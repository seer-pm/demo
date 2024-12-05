import { ImageResponse } from "https://deno.land/x/og_edge/mod.ts";
import React from "https://esm.sh/react@18.2.0";
import { isAddress } from "https://esm.sh/viem@2.17.5";
import type { Config, Context } from "@netlify/edge-functions";
import { displayBalance, formatOdds, getMarketEstimate, isOdd } from "./utils/common.ts";
import { INVALID_RESULT_OUTCOME_TEXT, VITE_SUPABASE_API_KEY, VITE_SUPABASE_PROJECT_URL } from "./utils/constants.ts";
import { fetchMarket } from "./utils/fetchMarket.ts";
import { convertFromSDAI } from "./utils/handleSDai.ts";
import { MarketTypes, getMarketType } from "./utils/market.ts";

async function fetchOdds(marketId: string): Promise<(number | null)[] | undefined> {
  if (!isAddress(marketId)) {
    return;
  }
  try {
    const response = await fetch(`${VITE_SUPABASE_PROJECT_URL}/rest/v1/markets?id=eq.${marketId}&select=*&limit=1`, {
      headers: {
        apikey: VITE_SUPABASE_API_KEY!,
        Authorization: `Bearer ${VITE_SUPABASE_API_KEY}`,
      },
    });
    const data = await response.json();
    return data[0]?.odds;
  } catch (e) {
    console.log(e);
  }
}

export default async (request: Request, context: Context) => {
  try {
    const match = request.url.match(/og-images\/markets\/(?<chainId>\d*)\/(?<marketId>0x[0-9a-fA-F]{40})/);
    const { chainId = "0", marketId = "" } = match?.groups || {};

    const market = await fetchMarket(marketId, chainId, {});

    if (!market) {
      return new ImageResponse(
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            color: "#FFF",
          }}
        >
          <img
            alt="Seer Card"
            width="2400"
            src="https://cdn.kleros.link/ipfs/Qmbxw66xbRG9hLt7jh5hERqULkQmeiEYT3sJx7wriapGwA/seer-twitter-card-v2.jpg"
          />
        </div>,
        { width: 2400, height: 1350, debug: false },
      );
    }
    const [odds = [], daiAmount = (market.outcomesSupply / 1e18) * 1.115] = await Promise.all([
      fetchOdds(marketId),
      convertFromSDAI(market.outcomesSupply, Number(chainId)),
    ]);

    const marketEstimate = getMarketEstimate(odds, market, true);
    const indexesOrderedByOdds = odds
      .map((odd, i) => ({ odd, i }))
      .sort((a, b) => (b.odd ?? 0) - (a.odd ?? 0))
      .map((obj) => obj.i);

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          color: "#FFF",
        }}
      >
        <img
          alt="seer background"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
          src="https://cdn.kleros.link/ipfs/QmRZoc5ehDFASXBbHNo41W8ifWXc7Fe7AJWBkipt5cPm9d/seer-background.png"
        ></img>
        <div style={{ display: "flex", flexDirection: "column", padding: 48, width: "100%" }}>
          <div style={{ display: "flex" }}>
            <img
              alt="Seer Logo"
              width="114"
              src="https://cdn.kleros.link/ipfs/QmSY7h5zeipL6rELiGwbcHDtNgBm83QxwkPtkFbxAA2N8p/seer-logo-all-white.png"
            />
          </div>
          <div
            style={{
              flex: "1",
              display: "flex",
              fontSize: Math.max(54 - 0.3 * Math.max(0, market.marketName.length - 115), 40),
              marginTop: 24,
            }}
          >
            {market.marketName.length > 220 ? `${market.marketName.slice(0, 220 - 3)}...` : market.marketName}
          </div>
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", flex: "1" }}>
              {getMarketType(market) === MarketTypes.SCALAR && marketEstimate !== "NA" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
                  <div style={{ display: "flex", fontSize: 32 }}>{marketEstimate}</div>
                  <div style={{ display: "flex", fontSize: 24, opacity: 0.8 }}>Market Estimate</div>
                </div>
              )}
              <div style={{ backgroundColor: "#8B52F6", width: 100, height: 4, marginBottom: 16 }}></div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                  rowGap: 8,
                }}
              >
                {market.outcomes.map((_, j) => {
                  const i = indexesOrderedByOdds ? indexesOrderedByOdds[j] : j;
                  const outcome = market.outcomes[i];

                  if (j >= 2) {
                    // render the first 3 outcomes
                    return null;
                  }
                  if (outcome === INVALID_RESULT_OUTCOME_TEXT) {
                    return null;
                  }
                  return (
                    <div
                      key={`${outcome}_${i}`}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", fontSize: 32 }}>
                        {outcome.length > 35 ? `${outcome.slice(0, 35 - 3)}...` : outcome}
                      </div>
                      {isOdd(odds[i]) && (
                        <div style={{ display: "flex", fontSize: 24, opacity: 0.8 }}>
                          {formatOdds(odds[i], getMarketType(market))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <img
                alt="DAI"
                style={{
                  width: 48,
                  height: 48,
                }}
                src="https://cdn.kleros.link/ipfs/QmTDgfpsjtmXP5WmgbQaX7TTn8vSxyS75qDSi4LPCYbPVg/badge-dai.png"
              />
              <div
                style={{
                  display: "flex",
                  fontSize: 32,
                }}
              >
                {displayBalance(daiAmount, 18, true)} {chainId === "100" ? "xDAI" : "DAI"}
              </div>
              <div style={{ display: "flex", fontSize: 24, opacity: 0.8 }}>Open Interest</div>
            </div>
          </div>
        </div>
      </div>,
      { debug: false },
    );
  } catch (e) {
    console.log(e);
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          color: "#FFF",
        }}
      >
        <img
          alt="Seer Card"
          width="2400"
          src="https://cdn.kleros.link/ipfs/Qmbxw66xbRG9hLt7jh5hERqULkQmeiEYT3sJx7wriapGwA/seer-twitter-card-v2.jpg"
        />
      </div>,
      { width: 2400, height: 1350, debug: false },
    );
  }
};

export const config: Config = { path: "/og-images/markets/:chainId/:marketId" };

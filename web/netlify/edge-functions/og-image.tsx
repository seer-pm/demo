import { ImageResponse } from "https://deno.land/x/og_edge/mod.ts";
import React from "https://esm.sh/react@18.2.0";
import { Address, isAddress } from "https://esm.sh/viem@2.17.5";
import type { Config, Context } from "@netlify/edge-functions";
import { formatBigNumbers, formatOdds, getMarketEstimate, getMarketType, isOdd } from "./utils/common.ts";
import { MarketTypes, SimpleMarket, SupportedChain } from "./utils/types.ts";

const INVALID_RESULT_OUTCOME_TEXT = "Invalid";

async function fetchMarket(baseUrl: string, chainId: SupportedChain, id: Address): Promise<SimpleMarket> {
  const params: Record<string, string | string[]> = { chainsList: [chainId.toString()] };
  if (!isAddress(id, { strict: false })) {
    params.url = id;
  } else {
    params.id = id;
  }
  const response = await fetch(`${baseUrl}/.netlify/functions/get-market`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const markets = await response.json();

  if (markets.length === 0) {
    throw new Error("Market not found");
  }

  return markets[0];
}

export default async (request: Request, context: Context) => {
  try {
    const match = request.url.match(/og-images\/markets\/(?<chainId>\d*)\/(?<marketId>[^/]+)/);
    const { chainId = "0", marketId = "" } = match?.groups || {};

    const market = await fetchMarket(context.site.url, chainId, marketId);

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

    const odds = market?.odds ?? [];
    const liquidityUSD = formatBigNumbers(market?.liquidityUSD ?? 0);
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
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <img
              alt="Seer Logo"
              width="114"
              src="https://cdn.kleros.link/ipfs/QmSY7h5zeipL6rELiGwbcHDtNgBm83QxwkPtkFbxAA2N8p/seer-logo-all-white.png"
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <img
                alt="USD"
                style={{
                  width: 48,
                  height: 48,
                }}
                src="https://cdn.kleros.link/ipfs/QmU4BQ55yQsCUBUkkL88pRiy9ZaBJDRBRi8StheLQ9dL5x/attach-money-24dp-ffffff-fill0-wght400-grad0-opsz24.svg"
              />
              <div
                style={{
                  display: "flex",
                  fontSize: 32,
                }}
              >
                {liquidityUSD}
              </div>
              <div style={{ display: "flex", fontSize: 24, opacity: 0.8 }}>Liquidity</div>
            </div>
          </div>
          <p
            style={{
              display: "flex",
              fontSize: 48,
              marginTop: 24,
              marginBottom: 0,
              height: "4.2em",
            }}
          >
            {market.marketName.length > 130 ? `${market.marketName.slice(0, 130 - 3)}...` : market.marketName}
          </p>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 36 }}>
            {getMarketType(market) === MarketTypes.SCALAR && marketEstimate !== "NA" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ display: "flex", fontSize: 32, color: "#C496FF", fontWeight: "600" }}>
                  {marketEstimate}
                </div>
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
                      {outcome.length > 60 ? `${outcome.slice(0, 60 - 3)}...` : outcome}
                    </div>
                    {isOdd(odds[i]) && (
                      <div style={{ display: "flex", fontSize: 36, color: "#C496FF", fontWeight: "600" }}>
                        {formatOdds(odds[i], getMarketType(market))}
                      </div>
                    )}
                  </div>
                );
              })}
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

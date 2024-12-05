import { ImageResponse } from "https://deno.land/x/og_edge/mod.ts";
import React from "https://esm.sh/react@18.2.0";
import { isAddress } from "https://esm.sh/viem@2.17.5";
import { gnosis } from "https://esm.sh/wagmi@2.11.2/chains";
import type { Config, Context } from "@netlify/edge-functions";
import { displayBalance, getMarketEstimate, isUndefined } from "./utils/common.ts";
import MarketInfo from "./utils/components/MarketInfo.tsx";
import OutcomesInfo from "./utils/components/OutcomesInfo.tsx";
import {
  CURATE_REGISTRY_ADDRESSES,
  CURATE_SUBGRAPH_URLS,
  NETWORK_LOGOS,
  VITE_SUPABASE_API_KEY,
  VITE_SUPABASE_PROJECT_URL,
} from "./utils/constants.ts";
import { fetchMarket } from "./utils/fetchMarket.ts";
import { fetchVerificationStatusList } from "./utils/fetchVerificationStatusList.ts";
import { fetchWinningOutcomes } from "./utils/fetchWinningOutcomes.ts";
import { getMarketStatus } from "./utils/getMarketStatus.ts";
import { getTokenInfo } from "./utils/getTokenInfo.ts";
import { convertFromSDAI } from "./utils/handleSDai.ts";
import {
  CategoricalIcon,
  CheckCircleIcon,
  ClockIcon,
  DaiLogo,
  ExclamationCircleIcon,
  LawBalanceIcon,
  MultiCategoricalIcon,
  MultiScalarIcon,
  ScalarIcon,
  SeerLogo,
} from "./utils/icons.tsx";
import { MarketTypes, getMarketType } from "./utils/market.ts";
import { COLORS, STATUS_TEXTS } from "./utils/types.ts";

export const MARKET_TYPES_TEXTS: Record<MarketTypes, string> = {
  [MarketTypes.CATEGORICAL]: "Categorical",
  [MarketTypes.SCALAR]: "Scalar",
  [MarketTypes.MULTI_CATEGORICAL]: "Multi Categorical",
  [MarketTypes.MULTI_SCALAR]: "Multi Scalar",
};

export const MARKET_TYPES_ICONS: Record<MarketTypes, React.ReactNode> = {
  [MarketTypes.CATEGORICAL]: <CategoricalIcon />,
  [MarketTypes.SCALAR]: <ScalarIcon />,
  [MarketTypes.MULTI_CATEGORICAL]: <MultiCategoricalIcon />,
  [MarketTypes.MULTI_SCALAR]: <MultiScalarIcon />,
};

async function fetchOdds(marketId: string) {
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

async function fetchMarketImages(marketId: string, chainId: string) {
  const query = `{
  litems(where: {registryAddress: "${CURATE_REGISTRY_ADDRESSES[chainId]}"}) {
    data
    metadata {
      props{
        value
      }
    }
  }
}`;

  const results = await fetch(CURATE_SUBGRAPH_URLS[chainId]!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
    }),
  });

  const json = await results.json();
  const item = json?.data?.litems?.find((litem) =>
    litem.metadata?.props?.some((prop) => prop.value?.toLocaleLowerCase() === marketId.toLocaleLowerCase()),
  );

  if (!item) {
    return;
  }

  const metadataResult = await fetch(`https://cdn.kleros.link${item.data}`);
  const imagesIpfsPath = (await metadataResult.json())?.values?.Images;

  if (!imagesIpfsPath) {
    throw new Error("Market images not found");
  }

  const imagesResult = await fetch(`https://cdn.kleros.link${imagesIpfsPath}`);
  const imagesMetadata = await imagesResult.json();

  return {
    market: `https://cdn.kleros.link${imagesMetadata.market}`,
    outcomes: ((imagesMetadata.outcomes || []) as string[]).map((path) => `https://cdn.kleros.link${path}`),
  };
}

export default async (request: Request, context: Context) => {
  try {
    const match = request.url.match(/og-images-v2\/markets\/(?<chainId>\d*)\/(?<marketId>0x[0-9a-fA-F]{40})/);
    const { chainId = "0", marketId = "" } = match?.groups || {};
    const verificationStatusList = await fetchVerificationStatusList(chainId);
    const market = await fetchMarket(marketId, chainId, verificationStatusList);
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
    const [images, parentMarket, odds = [], daiAmount, winningOutcomes] = await Promise.all([
      fetchMarketImages(marketId, chainId),
      fetchMarket(market.parentMarket, market.chainId, verificationStatusList),
      fetchOdds(marketId),
      convertFromSDAI(market.outcomesSupply, market.chainId),
      fetchWinningOutcomes(market),
    ]);
    const parentCollateral = await getTokenInfo(
      parentMarket?.wrappedTokens?.[Number(market.parentOutcome)],
      market.chainId,
    );
    const marketStatus = getMarketStatus(market);
    const colors = marketStatus && COLORS[marketStatus];
    const hasLiquidity = odds.some((v) => v > 0);
    const marketEstimate = getMarketEstimate(odds, market, true);
    const marketType = getMarketType(market);
    return new ImageResponse(
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "3px",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "5px solid",
            fontSize: "14px",
            paddingLeft: "25px",
            paddingRight: "25px",
            height: "45px",
            alignItems: "center",
            borderTopColor: colors.color,
            backgroundColor: colors.backgroundColor,
            color: colors.color,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "100%",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: colors.color,
              }}
            ></div>
            {marketStatus && <div>{STATUS_TEXTS[marketStatus](hasLiquidity)}</div>}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginLeft: "auto",
              }}
            >
              <img
                alt="network-icon"
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                }}
                src={NETWORK_LOGOS[market.chainId]}
              />
            </div>
          </div>
          <div>{market.index && `#${market.index}`}</div>
        </div>

        <div
          style={{
            display: "flex",
            padding: "24px",
            gap: "12px",
            ...(market.questions.length > 1 && { paddingBottom: "16px" }),
          }}
        >
          <div style={{ display: "flex" }}>
            {images?.market ? (
              <img
                src={images.market}
                alt={market.marketName}
                style={{
                  width: "65px",
                  height: "65px",
                  minWidth: "65px",
                  minHeight: "65px",
                  borderRadius: "50%",
                }}
              />
            ) : (
              <div
                style={{
                  width: "65px",
                  height: "65px",
                  borderRadius: "50%",
                  backgroundColor: "#9747FF",
                }}
              ></div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              flex: "1",
            }}
          >
            <p
              style={{
                fontWeight: "600",
                fontSize: "16px",
                wordBreak: "break-word",
                margin: "0",
                width: "100%",
              }}
            >
              {market.marketName}
            </p>
            {parentMarket && (
              <p
                style={{
                  fontSize: "14px",
                  marginTop: "8px",
                  marginBottom: "8px",
                  display: "flex",
                  gap: "4px",
                }}
              >
                Conditional on <span style={{ color: "#9747FF", fontWeight: "500" }}>"{parentMarket.marketName}"</span>
                being
                <span style={{ color: "#9747FF", fontWeight: "500" }}>
                  "{parentMarket.outcomes[Number(market.parentOutcome)]}"
                </span>
              </p>
            )}
            <MarketInfo market={market} marketStatus={marketStatus} />
          </div>
        </div>

        {marketType === MarketTypes.SCALAR && market.id !== "0x000" && marketEstimate !== "NA" && (
          <div
            style={{
              borderTop: "1px solid #e5e5e5",
              paddingTop: "16px",
              paddingBottom: "16px",
              paddingLeft: "24px",
              paddingRight: "24px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Market Estimate: {marketEstimate}
            </div>
          </div>
        )}
        <div
          style={{
            display: "flex",
            borderTop: "1px solid #e5e5e5",
            paddingTop: "16px",
            paddingBottom: "16px",
          }}
        >
          <OutcomesInfo
            market={market}
            outcomesCount={3}
            images={images?.outcomes}
            odds={odds}
            winningOutcomes={winningOutcomes}
          />
        </div>
        <div
          style={{
            borderTop: "1px solid #e5e5e5",
            paddingLeft: "25px",
            paddingRight: "25px",
            height: "45px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "14px",
            marginTop: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <SeerLogo fill="#511778" width="50px" height="23.2px" />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex" }}>{MARKET_TYPES_ICONS[marketType]}</div>
              <div style={{ display: "flex" }}>{MARKET_TYPES_TEXTS[marketType]}</div>
            </div>
            {!isUndefined(daiAmount) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ color: "#999999" }}>Open interest:</span>{" "}
                {!parentMarket && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <p>
                      {displayBalance(daiAmount, 18, true)} {market.chainId === gnosis.id ? "xDAI" : "DAI"}
                    </p>
                    <DaiLogo />
                  </div>
                )}
                {parentMarket && (
                  <p>
                    {displayBalance(market.outcomesSupply, 18, true)} {parentCollateral?.symbol ?? ""}
                  </p>
                )}
              </div>
            )}
          </div>
          {!isUndefined(market.verification) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: {
                  verified: "#00C42B",
                  verifying: "#24CDFE",
                  challenged: "#FF9900",
                  not_verified: "#9747FF",
                }[market.verification.status],
              }}
            >
              {market.verification.status === "verified" && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircleIcon />
                  <p>Verified</p>
                </div>
              )}
              {market.verification.status === "verifying" && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ClockIcon />
                  <p>Verifying</p>
                </div>
              )}
              {market.verification.status === "challenged" && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <LawBalanceIcon />
                  <p>Challenged</p>
                </div>
              )}
              {market.verification.status === "not_verified" && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ExclamationCircleIcon width={14} height={14} />
                  <p>Verify it</p>
                </div>
              )}
            </div>
          )}
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

export const config: Config = { path: "/og-images-v2/markets/:chainId/:marketId" };

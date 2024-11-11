import { ImageResponse } from "https://deno.land/x/og_edge/mod.ts";
import React from "https://esm.sh/react@18.2.0";
import type { Config, Context } from "@netlify/edge-functions";

const tagStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginLeft: "12px",
  border: "1px solid #fff",
  borderRadius: "6px",
  padding: "4px 12px",
  color: "#fff",
};

const SUBGRAPH_API_KEY = Deno.env.get("SUBGRAPH_API_KEY");

const SEER_SUBGRAPH_URLS: Partial<Record<string, string>> = {
  "1": `https://gateway-arbitrum.network.thegraph.com/api/${SUBGRAPH_API_KEY}/subgraphs/id/BMQD869m8LnGJJfqMRjcQ16RTyUw6EUx5jkh3qWhSn3M`,
  "100": `https://gateway-arbitrum.network.thegraph.com/api/${SUBGRAPH_API_KEY}/subgraphs/id/B4vyRqJaSHD8dRDb3BFRoAzuBK18c1QQcXq94JbxDxWH`,
};

export const CURATE_SUBGRAPH_URLS: Partial<Record<string, string>> = {
  "1": `https://gateway-arbitrum.network.thegraph.com/api/${SUBGRAPH_API_KEY}/subgraphs/id/A5oqWboEuDezwqpkaJjih4ckGhoHRoXZExqUbja2k1NQ`,
  "100": `https://gateway-arbitrum.network.thegraph.com/api/${SUBGRAPH_API_KEY}/subgraphs/id/9hHo5MpjpC1JqfD3BsgFnojGurXRHTrHWcUcZPPCo6m8`,
};

export const CURATE_REGISTRY_ADDRESSES: Partial<Record<string, string>> = {
  "1": "0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA",
  "100": "0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672",
} as const;

const NETWORK_LOGOS: Record<string, string> = {
  "100": "https://cdn.kleros.link/ipfs/QmQddp6L3SFpLfCQzjLPSprZPgzLHUXZPsQfQ5Gu4eCbe1/gnosis.jpg",
  "1": "https://cdn.kleros.link/ipfs/QmNjoXKCYHHZYhFWdkKJKvTVDwkjyW8eKE9r91bfGHjMEp/ethereum.jpg",
};

function formatBigNumbers(amount: number) {
  const quantifiers: [number, string][] = [
    [10 ** 9, "B"],
    [10 ** 6, "M"],
    [10 ** 3, "k"],
  ];

  for (const [denominator, letter] of quantifiers) {
    if (amount >= denominator) {
      return `${+Math.round((amount * 100) / denominator / 100)}${letter}`;
    }
  }

  return amount.toFixed(2);
}

async function fetchMarket(marketId: string, chainId: string) {
  const query = `{
  market(id: "${marketId.toLocaleLowerCase()}") {
    id
    marketName
    outcomes
    outcomesSupply
  }
}`;

  const results = await fetch(SEER_SUBGRAPH_URLS[chainId]!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
    }),
  });

  const json = await results.json();

  return json?.data?.market;
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
  const match = request.url.match(/og-images\/markets\/(?<chainId>\d*)\/(?<marketId>0x[0-9a-fA-F]{40})/);
  const { chainId = "0", marketId = "" } = match?.groups || {};

  const market = await fetchMarket(marketId, chainId);

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

  const images = await fetchMarketImages(marketId, chainId);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#59097e",
        color: "#FFF",
        padding: 62,
      }}
    >
      {/* logo + tags */}
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex" }}>
          <img
            alt="Seer Logo"
            width="150"
            src="https://cdn.kleros.link/ipfs/QmSY7h5zeipL6rELiGwbcHDtNgBm83QxwkPtkFbxAA2N8p/seer-logo-all-white.png"
          />
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={tagStyle}>
            <img
              alt="Verified"
              width="20"
              style={{ borderRadius: "50%", marginRight: 5 }}
              src={"https://cdn.kleros.link/ipfs/QmWF8M92t2vAMMFrsUhdYsFNuYUivgmZxZy3th3cQYW2tm/verified.png"}
            />
            <span>Verified</span>
          </div>

          <div style={tagStyle}>
            <img alt="Chain" width="20" style={{ borderRadius: "50%", marginRight: 5 }} src={NETWORK_LOGOS[chainId]} />
            <span>{chainId === "100" ? "Gnosis" : "Ethereum"}</span>
          </div>
        </div>
      </div>
      {/* market + outcomes */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
        {images?.market && (
          <div style={{ display: "flex", width: "12%" }}>
            <img
              alt="dai"
              width="100"
              src={images.market}
              style={{
                borderRadius: 128,
              }}
            />
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", width: "88%" }}>
          <div style={{ display: "flex", fontSize: 62, fontWeight: "bold" }}>
            {market.marketName.length > 90 ? `${market.marketName.substring(0, 90)}...` : market.marketName}
          </div>
          <div style={{ display: "flex", fontSize: 24 }}>{market.outcomes.slice(0, -1).join(", ")}</div>
        </div>
      </div>
      {/* details */}
      <div
        style={{
          marginTop: "8px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "flex-end",
        }}
      >
        <ul
          style={{
            display: "flex",
            listStyle: "none",
            alignItems: "baseline",
          }}
        >
          <li
            style={{
              display: "flex",
              alignItems: "baseline",
            }}
          >
            <img
              alt="DAI"
              style={{
                width: 24,
                height: 24,
              }}
              src="https://cdn.kleros.link/ipfs/QmTDgfpsjtmXP5WmgbQaX7TTn8vSxyS75qDSi4LPCYbPVg/badge-dai.png"
            />
            <span
              style={{
                display: "flex",
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  maxHeight: "35px",
                  fontSize: "32px",
                  margin: "0 10px",
                  fontWeight: 700,
                }}
              >
                {formatBigNumbers((market.outcomesSupply / 1e18) * 1.115)} {chainId === "100" ? "xDAI" : "DAI"}
              </span>
              <span
                style={{
                  position: "relative",
                  top: "4px",
                  fontSize: "18px",
                  fontWeight: 500,
                  color: "#C7C7C7",
                }}
              >
                Open Interest
              </span>
            </span>
          </li>
        </ul>
      </div>
    </div>,
    { debug: false },
  );
};

export const config: Config = { path: "/og-images/markets/:chainId/:marketId" };

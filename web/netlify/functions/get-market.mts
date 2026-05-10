import type { SupportedChain } from "@seer-pm/sdk";
import { serializeMarket } from "@seer-pm/sdk/market-types";
import { CORS_HEADERS } from "./utils/common";
import { getMarketByChainAndId, getMarketId } from "./utils/markets";

/**
 * For individual market fetches, we prioritize real-time accuracy by querying both the database and subgraph.
 * This dual-source approach ensures we get the most up-to-date market data, as the database may contain
 * cached information that hasn't been refreshed recently. The subgraph provides the current on-chain state.
 */
export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  const body = await req.json();

  if (!body) {
    return new Response(JSON.stringify({ error: "Missing request body" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  }

  if (!body.chainId || (!body.id && !body.url)) {
    return new Response(JSON.stringify({ error: "Missing required parameters: chainId and (id or url)" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  }

  console.log(`chainId: ${body.chainId}, id: ${body.id}, url: ${body.url}`);

  try {
    // Market URLs are stored in Supabase rather than on-chain. If a URL parameter is provided,
    // we first look up the corresponding market ID in Supabase before querying the subgraph.
    const id = await getMarketId(body.id, body.url);

    const market = await getMarketByChainAndId(Number(body.chainId) as SupportedChain, id);

    if (!market) {
      return new Response(JSON.stringify({ error: "Market not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      });
    }

    return new Response(JSON.stringify(serializeMarket(market)), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  } catch (e) {
    console.log(e);
    return new Response(JSON.stringify({ error: e.message || "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  }
};

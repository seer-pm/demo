import { SupportedChain } from "@/lib/chains";
import { serializeMarket } from "@/lib/market";
import { getSubgraphVerificationStatusList } from "./utils/curate";
import { SubgraphMarket, getDatabaseMarket, getMarketId, getSubgraphMarket, mapGraphMarketFromDbResult } from "./utils/markets";

/**
 * For individual market fetches, we prioritize real-time accuracy by querying both the database and subgraph.
 * This dual-source approach ensures we get the most up-to-date market data, as the database may contain
 * cached information that hasn't been refreshed recently. The subgraph provides the current on-chain state.
 */
export default async (req: Request) => {
  const body = await req.json();

  if (!body) {
    return new Response(JSON.stringify({ error: "Missing request body" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  if (!body.chainId || (!body.id && !body.url)) {
    return new Response(JSON.stringify({ error: "Missing required parameters: chainId and (id or url)" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  try {
    // Market URLs are stored in Supabase rather than on-chain. If a URL parameter is provided,
    // we first look up the corresponding market ID in Supabase before querying the subgraph.
    const id = await getMarketId(body.id, body.url);

    const [dbResult, subgraphResult, verificationStatusList] = await Promise.allSettled([getDatabaseMarket(id), getSubgraphMarket(Number(body.chainId) as SupportedChain, id), getSubgraphVerificationStatusList(Number(body.chainId) as SupportedChain)]);

    const dbRow = (dbResult.status === "fulfilled" && dbResult.value) || {
      id,
      chain_id: Number(body.chainId) as SupportedChain,
      verification: undefined,
      subgraph_data: undefined,
    };
    const verification = verificationStatusList.status === "fulfilled" && verificationStatusList.value?.[id as `0x${string}`];
    dbRow.verification = dbRow.verification ?? verification;

    const subgraphMarket = (subgraphResult.status === "fulfilled" && subgraphResult.value) || (dbRow?.subgraph_data as SubgraphMarket | undefined);

    if (!subgraphMarket) {
      return new Response(JSON.stringify({ error: "Market not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const market = serializeMarket(mapGraphMarketFromDbResult(subgraphMarket, dbRow));

    return new Response(JSON.stringify(market), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.log(e);
    return new Response(JSON.stringify({ error: e.message || "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

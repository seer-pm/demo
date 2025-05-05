import { getSdk as getSeerSdk } from "@/hooks/queries/gql-generated-seer";
import { graphQLClient } from "@/lib/subgraph";
import { createClient } from "@supabase/supabase-js";
import { Address } from "viem";
import { serializeMarket } from "../../src/hooks/useMarket";
import { SupportedChain } from "../../src/lib/chains";
import { MARKET_DB_FIELDS, SubgraphMarket, mapGraphMarketFromDbResult } from "./markets-search.mts";
import { getSubgraphVerificationStatusList } from "./utils/curate";
import { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

async function getMarketId(id: string | undefined, url: string | undefined): Promise<"" | Address> {
  if (!id && !url) {
    return "";
  }

  if (url) {
    const { data: market } = await supabase.from("markets").select("id").eq("url", url).single();

    return (market?.id as Address) || "";
  }

  return (id as Address) || "";
}

async function getDatabaseMarket(id: "" | Address) {
  const { data: result, error } = await supabase.from("markets").select(MARKET_DB_FIELDS).eq("id", id).single();

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error("Market not found");
  }

  return result;
}

async function getSubgraphMarket(chainId: SupportedChain, id: "" | Address) {
  const client = graphQLClient(chainId);
  const { market } = await getSeerSdk(client).GetMarket({ id });
  return market;
}

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

    const [result, subgraphMarket, verificationStatusList] = await Promise.all([
      getDatabaseMarket(id),
      getSubgraphMarket(Number(body.chainId) as SupportedChain, id),
      getSubgraphVerificationStatusList(Number(body.chainId) as SupportedChain),
    ]);

    const verification = verificationStatusList?.[id as `0x${string}`];
    if (verification !== undefined) {
      result.verification = verification;
    }

    const market = serializeMarket(
      mapGraphMarketFromDbResult(subgraphMarket || (result.subgraph_data as SubgraphMarket), result),
    );

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

import { createClient } from "@supabase/supabase-js";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi, zeroAddress, zeroHash } from "viem";
import { GetMarketQuery, Market_OrderBy } from "../../src/hooks/queries/gql-generated-seer";
import { Market, SerializedMarket, VerificationResult, serializeMarket } from "../../src/hooks/useMarket";
import { MarketStatus } from "../../src/hooks/useMarketStatus";
import { SUPPORTED_CHAINS, SupportedChain } from "../../src/lib/chains";
import { FetchMarketParams, sortMarkets } from "../../src/lib/markets-search";
import { unescapeJson } from "../../src/lib/reality";
import { INVALID_RESULT_OUTCOME, INVALID_RESULT_OUTCOME_TEXT } from "../../src/lib/utils";
import { config } from "./utils/config";
import { Database, Json } from "./utils/supabase";
const crypto = require("node:crypto");

const supabase = createClient<Database>(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

type SubgraphMarket = NonNullable<GetMarketQuery["market"]>;

type PoolBalance = Array<{
  token0: { symbol: string; balance: number };
  token1: { symbol: string; balance: number };
} | null>;

function mapGraphMarket(
  market: SubgraphMarket,
  extra: {
    chainId: SupportedChain;
    verification: VerificationResult | undefined;
    liquidityUSD: number;
    incentive: number;
    hasLiquidity: boolean;
    categories: string[];
    poolBalance: PoolBalance;
    odds: (number | null)[];
    url: string;
  },
): Market {
  return {
    ...market,
    id: market.id as Address,
    marketName: unescapeJson(market.marketName),
    outcomes: market.outcomes.map((outcome) => {
      if (outcome === INVALID_RESULT_OUTCOME) {
        return INVALID_RESULT_OUTCOME_TEXT;
      }
      return unescapeJson(outcome);
    }),
    parentMarket: {
      id: (market.parentMarket?.id as Address) || zeroAddress,
      conditionId: market.parentMarket?.conditionId || zeroHash,
      payoutReported: market.parentMarket?.payoutReported || false,
      payoutNumerators: (market.parentMarket?.payoutNumerators || []).map((n) => BigInt(n)),
    },
    parentOutcome: BigInt(market.parentOutcome),
    templateId: BigInt(market.templateId),
    openingTs: Number(market.openingTs),
    finalizeTs: Number(market.finalizeTs),
    questions: market.questions.map((question) => {
      return {
        ...question.question,
        id: question.question.id as `0x${string}`,
        opening_ts: Number(question.question.opening_ts),
        timeout: Number(question.question.timeout),
        finalize_ts: Number(question.question.finalize_ts),
        bond: BigInt(question.question.bond),
        min_bond: BigInt(question.question.min_bond),
      };
    }),
    outcomesSupply: BigInt(market.outcomesSupply),
    lowerBound: BigInt(market.lowerBound),
    upperBound: BigInt(market.upperBound),
    blockTimestamp: Number(market.blockTimestamp),
    payoutNumerators: market.payoutNumerators.map((n) => BigInt(n)),
    ...extra,
  };
}

export async function searchMarkets(
  chainsIds: SupportedChain[],
  id?: Address | "",
  parentMarket?: Address | "",
  _marketName?: string,
  marketStatusList?: MarketStatus[] | undefined,
  creator?: Address | "",
  participant?: Address | "",
  orderBy?: Market_OrderBy | undefined,
  orderDirection?: "asc" | "desc" | undefined,
  marketIds?: string[] | undefined,
): Promise<Market[]> {
  const now = Math.round(new Date().getTime() / 1000);

  let query = supabase
    .from("markets")
    .select("id,chain_id,url,subgraph_data,categories,liquidity,incentive,odds,pool_balance,verification")
    .not("subgraph_data", "is", null);

  if (id) {
    query = query.eq("id", id.toLowerCase());
  }

  if (parentMarket) {
    query = query.eq("subgraph_data->parentMarket->id", parentMarket.toLowerCase());
  }

  if (marketIds?.length) {
    query = query.in("id", marketIds);
  }

  const conditions = [];

  if (marketStatusList?.includes(MarketStatus.NOT_OPEN)) {
    conditions.push(`subgraph_data->>openingTs.gt.${now}`);
  }
  if (marketStatusList?.includes(MarketStatus.OPEN)) {
    conditions.push(`and(subgraph_data->>openingTs.lt.${now},subgraph_data->hasAnswers.eq.false)`);
  }
  if (marketStatusList?.includes(MarketStatus.ANSWER_NOT_FINAL)) {
    conditions.push(
      `and(subgraph_data->>openingTs.lt.${now},subgraph_data->hasAnswers.eq.true,subgraph_data->>finalizeTs.gt.${now})`,
    );
  }
  if (marketStatusList?.includes(MarketStatus.IN_DISPUTE)) {
    conditions.push("subgraph_data->>questionsInArbitration.gt.0");
  }
  if (marketStatusList?.includes(MarketStatus.PENDING_EXECUTION)) {
    conditions.push(`and(subgraph_data->>finalizeTs.lt.${now},subgraph_data->payoutReported.eq.false)`);
  }
  if (marketStatusList?.includes(MarketStatus.CLOSED)) {
    conditions.push("subgraph_data->payoutReported.eq.true");
  }

  if (conditions.length > 0) {
    query = query.or(conditions.join(","));
  }

  if (participant) {
    // markets this user is a participant in (participant = creator or trader)
    const marketsWithUserPositions = (await fetchMarketsWithPositions(participant, chainsIds)).map((a) =>
      a.toLocaleLowerCase(),
    );
    if (marketsWithUserPositions.length > 0) {
      query = query.or(`id.in.(${marketsWithUserPositions.join(",")}),eq(subgraph_data->creator,${participant})`);
    } else {
      query = query.eq("subgraph_data->creator", participant);
    }
  } else if (creator) {
    query = query.eq("subgraph_data->creator", creator);
  }

  query = query.in("chain_id", chainsIds);

  if (orderBy) {
    const orderByField = `subgraph_data->${orderBy}`;
    query = query.order(orderByField, {
      ascending: orderDirection === "asc",
    });
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data.map((result) => {
    return mapGraphMarket(result.subgraph_data as SubgraphMarket, {
      chainId: result.chain_id as SupportedChain,
      verification: result.verification as VerificationResult,
      liquidityUSD: result?.liquidity ?? 0,
      incentive: result?.incentive ?? 0,
      hasLiquidity: result?.odds?.some((odd: number | null) => (odd ?? 0) > 0) ?? false,
      odds: result?.odds ?? [],
      categories: result?.categories ?? ["misc"],
      poolBalance: (result?.pool_balance || []) as PoolBalance,
      url: result?.url || "",
    });
  });
}

const fetchMarketsWithPositions = async (address: Address, chainIds: SupportedChain[]) => {
  const { data: markets, error } = await supabase
    .from("markets")
    .select("id,subgraph_data->wrappedTokens")
    .in("chain_id", chainIds);

  if (error) {
    throw error;
  }

  // tokenId => marketId
  const tokenToMarket = markets.reduce(
    (acum, market) => {
      const wrappedTokens = (market.wrappedTokens as string[]) || [];
      for (const tokenId of wrappedTokens) {
        acum[tokenId as `0x${string}`] = market.id as Address;
      }
      return acum;
    },
    {} as Record<`0x${string}`, Address>,
  );

  // [tokenId, ..., ...]
  const allTokensIds = Object.keys(tokenToMarket) as `0x${string}`[];

  // [tokenBalance, ..., ...]
  const balances = (await readContracts(config, {
    contracts: allTokensIds.map((wrappedAddresses) => ({
      abi: erc20Abi,
      address: wrappedAddresses,
      functionName: "balanceOf",
      args: [address],
    })),
    allowFailure: false,
  })) as bigint[];

  // Set<marketWithBalance>
  const marketsWithTokens = balances.reduce((acumm, balance, index) => {
    if (balance > 0n) {
      acumm.add(tokenToMarket[allTokensIds[index]]);
    }
    return acumm;
  }, new Set<Address>());

  // [marketWithBalance, ..., ...]
  return [...marketsWithTokens];
};

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

async function multiChainSearch(body: FetchMarketParams, id: Address | ""): Promise<SerializedMarket[]> {
  const {
    chainsList = [],
    parentMarket = "",
    marketName = "",
    marketStatusList,
    creator = "",
    participant = "",
    orderBy,
    orderDirection,
    marketIds,
  } = body;

  const chainIds = (
    chainsList.length === 0 ? Object.keys(SUPPORTED_CHAINS) : chainsList.filter((chain) => chain !== "all")
  )
    .filter((chain) => chain !== "31337")
    .map((chainId) => Number(chainId)) as SupportedChain[];

  const markets = await searchMarkets(
    chainIds,
    id,
    parentMarket,
    marketName,
    marketStatusList,
    creator,
    participant,
    orderBy,
    orderDirection,
    marketIds,
  );

  markets.sort(sortMarkets(orderBy, orderDirection || "desc"));

  return markets.map((market) => serializeMarket(market));
}

async function keyValueFetch<T extends Json>(key: string, callback: () => Promise<T>) {
  const { data, error } = await supabase.from("key_value").select("value").eq("key", key).single();

  if (error && error.code !== "PGRST116") {
    // Handle error if it's not a "not found" error
    throw error;
  }

  const currentTime = new Date();
  const fiveMinutesAgo = new Date(currentTime.getTime() - 5 * 60 * 1000);

  // @ts-ignore
  if (!data || new Date(data.value.date) < fiveMinutesAgo) {
    const result = await callback();

    const { error: saveError } = await supabase.from("key_value").upsert(
      {
        key,
        value: { date: currentTime.toISOString(), value: result },
      },
      { onConflict: "key" },
    );

    if (saveError) {
      throw saveError;
    }

    return result;
  }

  // @ts-ignore
  return data.value.value;
}

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

  try {
    let markets: SerializedMarket[];
    // Market URLs are stored in Supabase rather than on-chain. If a URL parameter is provided,
    // we first look up the corresponding market ID in Supabase before querying the subgraph.
    const id = await getMarketId(body.id, body.url);

    const cachingEnabled = true;

    if (id === "" && cachingEnabled) {
      const hashKey = `markets_search_${crypto.createHash("md5").update(JSON.stringify(body)).digest("hex")}`;
      markets = await keyValueFetch(
        hashKey,
        () => multiChainSearch(body as FetchMarketParams, id) as unknown as Promise<Json>,
      );
    } else {
      // Skip caching when querying by ID to ensure fresh data, particularly after user updates like category changes
      markets = await multiChainSearch(body as FetchMarketParams, id);
    }

    return new Response(JSON.stringify(markets), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.log(e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

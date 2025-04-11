import { createClient } from "@supabase/supabase-js";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi, zeroAddress, zeroHash } from "viem";
import { GetMarketQuery } from "../../src/hooks/queries/gql-generated-seer";
import { Market, SerializedMarket, VerificationResult, serializeMarket } from "../../src/hooks/useMarket";
import { MarketStatus } from "../../src/hooks/useMarketStatus";
import { SUPPORTED_CHAINS, SupportedChain, sepolia } from "../../src/lib/chains";
import { FetchMarketParams, sortMarkets } from "../../src/lib/markets-search";
import { unescapeJson } from "../../src/lib/reality";
import { INVALID_RESULT_OUTCOME, INVALID_RESULT_OUTCOME_TEXT } from "../../src/lib/utils";
import { config } from "./utils/config";
import { Database, Json } from "./utils/supabase";

const supabase = createClient<Database>(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

export const MARKET_DB_FIELDS =
  "id,chain_id,url,subgraph_data,categories,liquidity,incentive,odds,pool_balance,verification,images";

export type SubgraphMarket = NonNullable<GetMarketQuery["market"]>;

type PoolBalance = Array<{
  token0: { symbol: string; balance: number };
  token1: { symbol: string; balance: number };
} | null>;

type VerificationImages = { market: string; outcomes: string[] };

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
    images: VerificationImages | undefined;
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

export function mapGraphMarketFromDbResult(
  market: SubgraphMarket,
  result: {
    id: string;
    chain_id: number | null;
    url: string | null;
    subgraph_data: Json;
    categories: string[] | null;
    liquidity: number | null;
    incentive: number | null;
    odds: number[] | null;
    pool_balance: Json;
    verification: Json;
    images: Json;
  },
) {
  return mapGraphMarket(market, {
    chainId: result.chain_id as SupportedChain,
    verification: result.verification as VerificationResult,
    liquidityUSD: result?.liquidity ?? 0,
    incentive: result?.incentive ?? 0,
    hasLiquidity: result?.odds?.some((odd: number | null) => (odd ?? 0) > 0) ?? false,
    odds: result?.odds?.map((x) => x ?? Number.NaN) ?? [],
    categories: result?.categories ?? ["misc"],
    poolBalance: (result?.pool_balance || []) as PoolBalance,
    url: result?.url || "",
    images: (result?.images as VerificationImages) || undefined,
  });
}

export async function searchMarkets(
  chainsIds: SupportedChain[],
  id?: Address | "",
  parentMarket?: Address | "",
  _marketName?: string,
  marketStatusList?: MarketStatus[] | undefined,
  creator?: Address | "",
  participant?: Address | "",
  marketIds?: string[] | undefined,
): Promise<Market[]> {
  const now = Math.round(new Date().getTime() / 1000);

  let query = supabase.from("markets").select(MARKET_DB_FIELDS).not("subgraph_data", "is", null);

  if (id) {
    query = query.eq("id", id.toLowerCase());
  }

  if (parentMarket) {
    query = query.eq("subgraph_data->parentMarket->>id", parentMarket.toLowerCase());
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
    const marketsWithUserPositions = (
      await Promise.all(chainsIds.map((chainId) => fetchMarketsWithPositions(participant, chainId)))
    )
      .flat()
      .map((a) => a.toLocaleLowerCase());
    if (marketsWithUserPositions.length > 0) {
      // the user is an active trader in some market
      query = query.or(`id.in.(${marketsWithUserPositions.join(",")}),subgraph_data->>creator.eq.${participant})`);
    } else {
      // the user is not trading, search only created markets
      query = query.eq("subgraph_data->>creator", participant);
    }
  } else if (creator) {
    query = query.eq("subgraph_data->>creator", creator);
  }

  query = query.in("chain_id", chainsIds);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data.map((result) => {
    return mapGraphMarketFromDbResult(result.subgraph_data as SubgraphMarket, result);
  });
}

const fetchMarketsWithPositions = async (address: Address, chainId: SupportedChain) => {
  const { data: markets, error } = await supabase
    .from("markets")
    .select("id,subgraph_data->wrappedTokens")
    .eq("chain_id", chainId);

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
      chainId,
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

export async function multiChainSearch(body: FetchMarketParams, id: Address | ""): Promise<SerializedMarket[]> {
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

  const chainIds =
    process.env.VITE_TESTNET_WEBSITE === "1"
      ? [sepolia.id]
      : ((chainsList.length === 0 ? Object.keys(SUPPORTED_CHAINS) : chainsList.filter((chain) => chain !== "all"))
          .filter((chain) => chain !== "31337")
          .map((chainId) => Number(chainId)) as SupportedChain[]);

  const markets = await searchMarkets(
    chainIds,
    id,
    parentMarket,
    marketName,
    marketStatusList,
    creator,
    participant,
    marketIds,
  );

  markets.sort(sortMarkets(orderBy, orderDirection || "desc"));

  return markets.map((market) => serializeMarket(market));
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
    const markets: SerializedMarket[] = await multiChainSearch(body as FetchMarketParams, "");

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

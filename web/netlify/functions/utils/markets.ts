import { FAST_TESTNET_FACTORY } from "@/lib/constants";
import type { SupportedChain } from "@seer-pm/sdk";
import { INVALID_RESULT_OUTCOME, INVALID_RESULT_OUTCOME_TEXT, unescapeJson } from "@seer-pm/sdk/market";
import type { Market, MarketStatus, VerificationResult, VerificationStatus } from "@seer-pm/sdk/market-types";
import { MarketsOrderBy } from "@seer-pm/sdk/markets-fetch";
import { graphQLClient } from "@seer-pm/sdk/subgraph";
import { type GetMarketQuery, getSdk as getSeerSdk } from "@seer-pm/sdk/subgraph/seer";
import { createClient } from "@supabase/supabase-js";
import { type Address, erc20Abi, zeroAddress, zeroHash } from "viem";
import { multicall } from "viem/actions";
import { getPublicClientByChainId } from "./config";
import type { Database, Json } from "./supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

export const MARKET_DB_FIELDS =
  "id,chain_id,url,subgraph_data,categories,liquidity,max_liquidity,incentive,odds,pool_balance,verification,images";

export type LegacySubgraphMarket = {
  __typename?: "Market";
  id: string;
  type: "Generic" | "Futarchy";
  marketName: string;
  outcomes: Array<string>;
  wrappedTokens: Array<`0x${string}`>;
  collateralToken: `0x${string}`;
  collateralToken1: `0x${string}`;
  collateralToken2: `0x${string}`;
  parentOutcome: string;
  parentCollectionId: `0x${string}`;
  conditionId: `0x${string}`;
  questionId: `0x${string}`;
  templateId: string;
  hasAnswers: boolean;
  questionsInArbitration: string;
  openingTs: string;
  finalizeTs: string;
  encodedQuestions: Array<string>;
  lowerBound: string;
  upperBound: string;
  payoutReported: boolean;
  payoutNumerators: Array<string>;
  factory: `0x${string}`;
  creator: `0x${string}`;
  outcomesSupply: string;
  blockTimestamp: string;
  transactionHash: `0x${string}`;
  parentMarket?: {
    __typename?: "Market";
    id: string;
    payoutReported: boolean;
    conditionId: `0x${string}`;
    payoutNumerators: Array<string>;
  } | null;
  questions: Array<{
    __typename?: "MarketQuestion";
    question: {
      __typename?: "Question";
      id: string;
      arbitrator: `0x${string}`;
      opening_ts: string;
      timeout: string;
      finalize_ts: string;
      is_pending_arbitration: boolean;
      best_answer: `0x${string}`;
      bond: string;
      min_bond: string;
      index: number;
    };
    baseQuestion: { __typename?: "Question"; id: string };
  }>;
};

export type EnvioMarket = NonNullable<GetMarketQuery["market"]>;

/** Sort Envio `questions` by `question.index` (matches on-chain / legacy order). */
function sortEnvioMarketQuestions(market: EnvioMarket): EnvioMarket {
  const sortedQuestions = [...market.questions].sort(
    (questionA, questionB) => questionA.question!.index - questionB.question!.index,
  );
  return {
    ...market,
    questions: sortedQuestions,
  };
}

// Remaps Envio index fields to the legacy The Graph shape stored in `subgraph_data`.
// Root: `address` → `id`, `marketType` → `type`; drop `chainId` (chain lives on the DB row).
// Nested: parent market `address` → `id` (Supabase filters use subgraph_data->parentMarket->>id).
// Questions: Envio uses `questionId`; legacy consumers expect `id` on Question / baseQuestion.
export function envioMarketToLegacySubgraphMarket(market: EnvioMarket): LegacySubgraphMarket {
  const {
    address,
    marketType,
    chainId: _chainId,
    parentMarket,
    questions,
    wrappedTokens,
    collateralToken,
    collateralToken1,
    collateralToken2,
    parentCollectionId,
    conditionId,
    questionId,
    factory,
    creator,
    transactionHash,
    ...rest
  } = sortEnvioMarketQuestions(market);
  return {
    id: address,
    type: marketType as LegacySubgraphMarket["type"],
    wrappedTokens: wrappedTokens as Address[],
    collateralToken: collateralToken as Address,
    collateralToken1: collateralToken1 as Address,
    collateralToken2: collateralToken2 as Address,
    parentCollectionId: parentCollectionId as `0x${string}`,
    conditionId: conditionId as `0x${string}`,
    questionId: questionId as `0x${string}`,
    factory: market.factory as Address,
    creator: creator as Address,
    transactionHash: transactionHash as `0x${string}`,
    ...rest,
    parentMarket: parentMarket
      ? {
          id: parentMarket.address,
          payoutReported: parentMarket.payoutReported,
          conditionId: parentMarket.conditionId as `0x${string}`,
          payoutNumerators: parentMarket.payoutNumerators,
        }
      : null,
    questions: questions.map((entry) => ({
      question: {
        opening_ts: String(entry.question?.opening_ts),
        timeout: String(entry.question?.timeout),
        finalize_ts: String(entry.question?.finalize_ts),
        is_pending_arbitration: Boolean(entry.question?.is_pending_arbitration),
        arbitrator: entry.question?.arbitrator as Address,
        best_answer: entry.question?.best_answer as `0x${string}`,
        bond: String(entry.question?.bond),
        min_bond: String(entry.question?.min_bond),
        index: Number(entry.question?.index),
        id: entry.question!.questionId,
      },
      baseQuestion: {
        id: entry.baseQuestion!.questionId,
      },
    })),
  };
}

type DbMarket = {
  id: string;
  chain_id: number | null;
  url?: string | null;
  subgraph_data?: Json;
  categories?: string[] | null;
  liquidity?: number | null;
  max_liquidity?: number | null;
  incentive?: number | null;
  odds?: number[] | null;
  pool_balance?: Json;
  verification?: Json;
  images?: Json;
};

type PoolBalance = Array<{
  token0: { symbol: string; balance: number };
  token1: { symbol: string; balance: number };
} | null>;

type VerificationImages = { market: string; outcomes: string[] };

export function mapGraphMarket(
  market: LegacySubgraphMarket,
  extra: {
    chainId: SupportedChain;
    verification: VerificationResult | undefined;
    liquidityUSD: number;
    maxLiquidity: number;
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
    wrappedTokens: market.wrappedTokens as Address[],
    marketName: unescapeJson(market.marketName),
    outcomes: market.outcomes.map((outcome) => {
      if (outcome === INVALID_RESULT_OUTCOME) {
        return INVALID_RESULT_OUTCOME_TEXT;
      }
      return unescapeJson(outcome);
    }),
    parentMarket: {
      id: market.parentMarket
        ? (("address" in market.parentMarket ? market.parentMarket.address : market.parentMarket.id) as Address)
        : zeroAddress,
      conditionId: (market.parentMarket?.conditionId as `0x${string}`) || zeroHash,
      payoutReported: market.parentMarket?.payoutReported || false,
      payoutNumerators: (market.parentMarket?.payoutNumerators || []).map((n) => BigInt(n)),
    },
    parentOutcome: BigInt(market.parentOutcome),
    templateId: BigInt(market.templateId),
    openingTs: Number(market.openingTs),
    finalizeTs: Number(market.finalizeTs),
    questions: market.questions.flatMap((question) => {
      if (!question.question) return [];
      const baseQuestion = question.baseQuestion
        ? (("questionId" in question.baseQuestion
            ? question.baseQuestion.questionId
            : question.baseQuestion.id) as `0x${string}`)
        : undefined;
      return [
        {
          ...question.question,
          id: ("questionId" in question.question
            ? question.question.questionId
            : question.question.id) as `0x${string}`,

          arbitrator: (question.question.arbitrator as Address) || zeroAddress,
          best_answer: (question.question.best_answer as `0x${string}`) || zeroHash,
          opening_ts: Number(question.question.opening_ts),
          timeout: Number(question.question.timeout),
          finalize_ts: Number(question.question.finalize_ts),
          bond: BigInt(question.question.bond),
          min_bond: BigInt(question.question.min_bond),
          // Base question is not yet available for futarchy markets
          base_question: baseQuestion || zeroAddress,
        },
      ];
    }),
    outcomesSupply: BigInt(market.outcomesSupply),
    lowerBound: BigInt(market.lowerBound),
    upperBound: BigInt(market.upperBound),
    blockTimestamp: Number(market.blockTimestamp),
    payoutNumerators: market.payoutNumerators.map((n) => BigInt(n)),
    ...extra,
    images: extra.images
      ? {
          market: `https://cdn.kleros.link${extra.images.market}`,
          outcomes: ((extra.images.outcomes || []) as string[]).map((path) => `https://cdn.kleros.link${path}`),
        }
      : undefined,
  };
}

export function mapGraphMarketFromDbResult(subgraphMarket: LegacySubgraphMarket, extraData: DbMarket) {
  return mapGraphMarket(subgraphMarket, {
    chainId: extraData.chain_id as SupportedChain,
    verification: extraData?.verification as VerificationResult,
    liquidityUSD: extraData?.liquidity ?? 0,
    maxLiquidity: extraData?.max_liquidity ?? 0,
    incentive: extraData?.incentive ?? 0,
    hasLiquidity: extraData?.odds?.some((odd: number | null) => (odd ?? 0) > 0) ?? false,
    odds: extraData?.odds?.map((x) => x ?? Number.NaN) ?? [],
    categories: extraData?.categories ?? ["misc"],
    poolBalance: (extraData?.pool_balance || []) as PoolBalance,
    url: extraData?.url || "",
    images: (extraData?.images as VerificationImages) || undefined,
  });
}

function sortMarkets(orderBy: MarketsOrderBy | undefined, orderDirection: "asc" | "desc") {
  if (!orderBy) {
    return [
      { column: "is_closed", ascending: true },
      { column: "is_underlying_worthless", ascending: true },
      { column: "verification_priority", ascending: true },
      { column: "liquidity", ascending: false },
      { column: "opening_ts", ascending: true },
    ];
  }

  if (orderBy === "liquidityUSD") {
    return [{ column: "liquidity", ascending: orderDirection === "asc" }];
  }

  if (orderBy === "creationDate") {
    return [{ column: "block_timestamp", ascending: orderDirection === "asc" }];
  }

  if (orderBy === "oddsRunTimestamp") {
    return [{ column: "odds_run_timestamp", ascending: orderDirection === "asc" }];
  }

  if (orderBy === "outcomesSupply") {
    return [{ column: "outcomes_supply", ascending: orderDirection === "asc" }];
  }
  // by opening date
  return [{ column: "opening_ts", ascending: orderDirection === "asc" }];
}

function escapePostgrest(str: string): string {
  return str
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/"/g, '\\"')
    .replace(/,/g, "\\,")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

type SearchMarketsProps = {
  chainIds: SupportedChain[];
  type?: "Generic" | "Futarchy" | "";
  id?: Address | "";
  parentMarket?: Address | "";
  marketName?: string;
  categoryList?: string[] | undefined;
  marketStatusList?: MarketStatus[] | undefined;
  verificationStatusList?: VerificationStatus[] | undefined;
  showConditionalMarkets?: boolean | undefined;
  showMarketsWithRewards?: boolean | undefined;
  minLiquidity?: number | undefined;
  finalizeTs?: number | undefined;
  creator?: Address | "";
  participant?: Address | "";
  marketIds?: string[] | undefined;
  limit?: number;
  page?: number;
  orderBy?: MarketsOrderBy;
  orderDirection?: "asc" | "desc";
};

export type SearchAllMarketsProps = Omit<SearchMarketsProps, "limit" | "page">;

/** Page size PostgREST uses when no range is set (~1000 rows); stay aligned for stable pagination. */
const SEARCH_MARKETS_PAGE_SIZE = 1000;

/**
 * Same filters as {@link searchMarkets}, but fetches every page until no more rows (not only the first chunk).
 */
export async function searchAllMarkets(props: SearchAllMarketsProps): Promise<{ markets: Market[]; count: number }> {
  let page = 1;
  const allMarkets: Market[] = [];
  let totalCount = 0;

  while (true) {
    const { markets, count } = await searchMarkets({
      ...props,
      limit: SEARCH_MARKETS_PAGE_SIZE,
      page,
    });

    if (page === 1) {
      totalCount = count;
    }

    allMarkets.push(...markets);

    if (markets.length < SEARCH_MARKETS_PAGE_SIZE) {
      break;
    }

    if (totalCount > 0 && allMarkets.length >= totalCount) {
      break;
    }

    page++;
  }

  return { markets: allMarkets, count: totalCount };
}

export async function searchMarkets({
  chainIds,
  type,
  id,
  parentMarket,
  marketName,
  categoryList,
  marketStatusList,
  verificationStatusList,
  showConditionalMarkets,
  showMarketsWithRewards,
  minLiquidity,
  finalizeTs,
  creator,
  participant,
  marketIds,
  limit,
  page = 1,
  orderBy,
  orderDirection,
}: SearchMarketsProps): Promise<{ markets: Market[]; count: number }> {
  let query = supabase
    .from("markets_search")
    .select(MARKET_DB_FIELDS, { count: "exact" })
    .not("subgraph_data", "is", null);

  if (limit !== undefined && page) {
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
  }

  if (id) {
    query = query.eq("id", id.toLowerCase());
  }

  if (parentMarket) {
    query = query.eq("subgraph_data->parentMarket->>id", parentMarket.toLowerCase());
  }

  if (type) {
    query = query.eq("subgraph_data->>type", type);

    if (type === "Futarchy") {
      query = query.neq("subgraph_data->>marketName", "");
    }
  }

  if (marketName) {
    const safeMarketName = escapePostgrest(marketName);
    query = query.or(
      [
        `subgraph_data->>marketName.ilike.%${safeMarketName}%`,
        `outcomes_text.ilike.%${safeMarketName}%`,
        `collections_names.ilike.%${safeMarketName}%`,
      ].join(","),
    );
  }

  if (marketIds?.length) {
    query = query.in(
      "id",
      marketIds.map((id) => id.toLowerCase()),
    );
  }

  if (process.env.VITE_IS_FAST_TESTNET) {
    query = query.eq("subgraph_data->>factory", FAST_TESTNET_FACTORY);
  } else {
    query = query.neq("subgraph_data->>factory", FAST_TESTNET_FACTORY);
  }

  if (categoryList?.length) {
    query = query.overlaps("categories", categoryList);
  }

  if (marketStatusList?.length) {
    query = query.in(
      "status",
      marketStatusList.map((s) => s.toLowerCase()),
    );
  }

  if (verificationStatusList?.length) {
    query = query.in("verification->>status", verificationStatusList);
  }

  if (showConditionalMarkets) {
    query = query.neq("subgraph_data->parentMarket->>id", zeroAddress);
  }

  if (showMarketsWithRewards) {
    query = query.gt("incentive", 0);
  }

  if (minLiquidity) {
    query = query.gt("liquidity", Number(minLiquidity));
  }

  if (finalizeTs) {
    query = query.gt("finalize_ts", Number(finalizeTs));
  }

  if (participant) {
    // markets this user is a participant in (participant = creator or trader)
    const marketsWithUserPositions = (
      await Promise.all(chainIds.map((chainId) => fetchMarketsWithPositions(participant, chainId)))
    )
      .flat()
      .map((a) => a.toLocaleLowerCase());
    if (marketsWithUserPositions.length > 0) {
      // the user is an active trader in some market
      const safeMarketIds = marketsWithUserPositions.map((id) => escapePostgrest(id)).join(",");
      const safeParticipant = escapePostgrest(participant);
      query = query.or([`id.in.(${safeMarketIds})`, `subgraph_data->>creator.eq.${safeParticipant}`].join(","));
    } else {
      // the user is not trading, search only created markets
      query = query.eq("subgraph_data->>creator", participant);
    }
  } else if (creator) {
    query = query.eq("subgraph_data->>creator", creator);
  }

  query = query.in("chain_id", chainIds);

  for (const { column, ascending } of sortMarkets(orderBy, orderDirection || "desc")) {
    query = query.order(column, { ascending });
  }

  const { data, count, error } = await query;
  if (error) {
    // If the error is PGRST103 (Requested range not satisfiable), return empty results
    if (error.code === "PGRST103") {
      return {
        markets: [],
        count: 0,
      };
    }
    throw error;
  }

  return {
    markets: data.map((result) => {
      return mapGraphMarketFromDbResult(result.subgraph_data as LegacySubgraphMarket, result);
    }),
    count: count || 0,
  };
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
        acum[tokenId as Address] = market.id as Address;
      }
      return acum;
    },
    {} as Record<Address, Address>,
  );

  // [tokenId, ..., ...]
  const allTokensIds = Object.keys(tokenToMarket) as Address[];

  // [tokenBalance, ..., ...]
  const client = getPublicClientByChainId(chainId);
  const balances = (await multicall(client, {
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

export async function getMarketId(id: string | undefined, url: string | undefined): Promise<"" | Address> {
  if (!id && !url) {
    return "";
  }

  if (url) {
    const { data: market } = await supabase.from("markets").select("id").eq("url", url).single();

    return (market?.id?.toLowerCase() as Address) || "";
  }

  return (id?.toLowerCase() as Address) || "";
}

export async function getDatabaseMarket(chainId: SupportedChain, id: "" | Address) {
  const { data: result, error } = await supabase
    .from("markets")
    .select(MARKET_DB_FIELDS)
    .eq("id", id)
    .eq("chain_id", chainId)
    .single();

  if (!error) {
    return result;
  }

  // no market found
  return;
}

export async function getSubgraphMarket(chainId: SupportedChain, id: "" | Address) {
  const client = graphQLClient(chainId);
  const subgraphId = `${chainId}:${id.toLowerCase()}`;
  const { market } = await getSeerSdk(client).GetMarket({ id: subgraphId });
  return market;
}

export function getMarketsMappings(markets: Market[]) {
  return markets.reduce(
    (acum, market) => {
      // Add market to marketIdToMarket mapping
      acum.marketIdToMarket[market.id] = market;

      // Add token mappings to tokenToMarket
      for (let i = 0; i < market.wrappedTokens.length; i++) {
        const tokenId = market.wrappedTokens[i];
        acum.tokenToMarket[tokenId] = {
          market,
          tokenIndex: i,
        };
      }

      return acum;
    },
    {
      marketIdToMarket: {} as Record<Address, Market>,
      tokenToMarket: {} as Record<Address, { market: Market; tokenIndex: number }>,
    },
  );
}

export function getCollateralFromDexTx(market: Market, tokenIn: Address, tokenOut: Address) {
  if (market.type === "Generic") {
    return market.collateralToken;
  }

  return tokenIn.toLocaleLowerCase() === market.collateralToken1.toLocaleLowerCase() ? tokenIn : tokenOut;
}

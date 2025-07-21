import { GetMarketQuery, Market_OrderBy, getSdk as getSeerSdk } from "@/hooks/queries/gql-generated-seer";
import { SupportedChain } from "@/lib/chains";
import { Market, MarketStatus, VerificationResult, VerificationStatus } from "@/lib/market";
import { unescapeJson } from "@/lib/reality";
import { graphQLClient } from "@/lib/subgraph";
import { INVALID_RESULT_OUTCOME, INVALID_RESULT_OUTCOME_TEXT } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi, zeroAddress, zeroHash } from "viem";
import { config } from "./config";
import { Database, Json } from "./supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

export const MARKET_DB_FIELDS =
  "id,chain_id,url,subgraph_data,categories,liquidity,incentive,odds,pool_balance,verification,images";

export type SubgraphMarket = NonNullable<GetMarketQuery["market"]>;

type DbMarket = {
  id: string;
  chain_id: number | null;
  url?: string | null;
  subgraph_data?: Json;
  categories?: string[] | null;
  liquidity?: number | null;
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
        // Base question is not yet available for futarchy markets yet
        base_question: (question?.baseQuestion?.id || zeroAddress) as `0x${string}`,
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

export function mapGraphMarketFromDbResult(subgraphMarket: SubgraphMarket, extraData: DbMarket) {
  return mapGraphMarket(subgraphMarket, {
    chainId: extraData.chain_id as SupportedChain,
    verification: extraData?.verification as VerificationResult,
    liquidityUSD: extraData?.liquidity ?? 0,
    incentive: extraData?.incentive ?? 0,
    hasLiquidity: extraData?.odds?.some((odd: number | null) => (odd ?? 0) > 0) ?? false,
    odds: extraData?.odds?.map((x) => x ?? Number.NaN) ?? [],
    categories: extraData?.categories ?? ["misc"],
    poolBalance: (extraData?.pool_balance || []) as PoolBalance,
    url: extraData?.url || "",
    images: (extraData?.images as VerificationImages) || undefined,
  });
}

function sortMarkets(
  orderBy: Market_OrderBy | "liquidityUSD" | "creationDate" | undefined,
  orderDirection: "asc" | "desc",
) {
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

export async function searchMarkets(
  chainsIds: SupportedChain[],
  id?: Address | "",
  parentMarket?: Address | "",
  marketName?: string,
  categoryList?: string[] | undefined,
  marketStatusList?: MarketStatus[] | undefined,
  verificationStatusList?: VerificationStatus[] | undefined,
  showConditionalMarkets?: boolean | undefined,
  showMarketsWithRewards?: boolean | undefined,
  minLiquidity?: number | undefined,
  creator?: Address | "",
  participant?: Address | "",
  marketIds?: string[] | undefined,
  limit?: number,
  page?: number,
  orderBy?: Market_OrderBy | "liquidityUSD" | "creationDate",
  orderDirection?: "asc" | "desc",
): Promise<{ markets: Market[]; count: number }> {
  let query = supabase
    .from("markets_search")
    .select(MARKET_DB_FIELDS, { count: "exact" })
    .not("subgraph_data", "is", null);

  if (limit !== undefined && page !== undefined) {
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
  }

  if (id) {
    query = query.eq("id", id.toLowerCase());
  }

  if (parentMarket) {
    query = query.eq("subgraph_data->parentMarket->>id", parentMarket.toLowerCase());
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
    query = query.in("id", marketIds);
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

  if (participant) {
    // markets this user is a participant in (participant = creator or trader)
    const marketsWithUserPositions = (
      await Promise.all(chainsIds.map((chainId) => fetchMarketsWithPositions(participant, chainId)))
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

  query = query.in("chain_id", chainsIds);

  for (const { column, ascending } of sortMarkets(orderBy, orderDirection || "desc")) {
    query = query.order(column, { ascending });
  }

  const { data, count, error } = await query;

  if (error) {
    throw error;
  }

  return {
    markets: data.map((result) => {
      return mapGraphMarketFromDbResult(result.subgraph_data as SubgraphMarket, result);
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

export async function getDatabaseMarket(id: "" | Address) {
  const { data: result, error } = await supabase.from("markets").select(MARKET_DB_FIELDS).eq("id", id).single();

  if (!error) {
    return result;
  }

  // no market found
  return;
}

export async function getSubgraphMarket(chainId: SupportedChain, id: "" | Address) {
  const client = graphQLClient(chainId);
  const { market } = await getSeerSdk(client).GetMarket({ id });
  return market;
}

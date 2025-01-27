import { STATUS_TEXTS } from "@/components/Market/Header";
import {
  lightGeneralizedTcrAddress,
  marketFactoryAddress,
  readMarketViewGetMarkets,
} from "@/hooks/contracts/generated";
import { GetImagesQuery, Status, getSdk as getCurateSdk } from "@/hooks/queries/gql-generated-curate";
import {
  GetMarketQuery,
  GetMarketsQuery,
  Market_Filter,
  Market_OrderBy,
  OrderDirection,
  getSdk as getSeerSdk,
} from "@/hooks/queries/gql-generated-seer";
import { Market, VerificationResult, mapOnChainMarket } from "@/hooks/useMarket";
import { MarketStatus, getMarketStatus } from "@/hooks/useMarketStatus";
import { fetchMarketsWithPositions } from "@/hooks/useMarketsWithPositions";
import { SupportedChain } from "@/lib/chains";
import { curateGraphQLClient, graphQLClient } from "@/lib/subgraph";
import { config } from "@/wagmi";
import { Address, zeroAddress, zeroHash } from "viem";
import { unescapeJson } from "./reality";
import { INVALID_RESULT_OUTCOME, INVALID_RESULT_OUTCOME_TEXT, isUndefined } from "./utils";

export const ITEMS_PER_PAGE = 10;
export const MARKETS_COUNT_PER_QUERY = 1000;

async function getVerificationStatusList(
  chainId: SupportedChain,
): Promise<Record<Address, VerificationResult | undefined>> {
  const client = curateGraphQLClient(chainId);

  const registryAddress = lightGeneralizedTcrAddress[chainId];
  let litems: GetImagesQuery["litems"] = [];
  if (client && !isUndefined(registryAddress)) {
    try {
      const data = await getCurateSdk(client).GetImages({
        where: {
          registryAddress,
        },
      });
      litems = data.litems;
    } catch (e) {
      const fallbackClient = curateGraphQLClient(chainId, true);
      if (fallbackClient) {
        const data = await getCurateSdk(fallbackClient).GetImages({
          where: {
            registryAddress,
          },
        });
        litems = data.litems;
      } else {
        throw e;
      }
    }
    return litems.reduce(
      (obj, item) => {
        const marketId = item.metadata?.props?.find((prop) => prop.label === "Market")?.value?.toLowerCase();
        if (!marketId) {
          return obj;
        }
        const isVerifiedBeforeClearing =
          item.status === Status.ClearingRequested &&
          item.requests.find((request) => request.requestType === Status.RegistrationRequested)?.resolved;
        if (item.status === Status.Registered || isVerifiedBeforeClearing) {
          obj[marketId] = { status: "verified", itemID: item.itemID };
          return obj;
        }
        if (item.status === Status.RegistrationRequested) {
          if (item.disputed) {
            obj[marketId] = { status: "challenged", itemID: item.itemID };
          } else {
            obj[marketId] = { status: "verifying", itemID: item.itemID };
          }
          return obj;
        }
        obj[marketId] = { status: "not_verified" };
        return obj;
      },
      {} as { [key: string]: VerificationResult },
    );
  }

  return {};
}

export function sortMarkets(
  orderBy: Market_OrderBy | "liquidityUSD" | "creationDate" | undefined,
  orderDirection: "asc" | "desc",
) {
  const STATUS_PRIORITY = {
    verified: 0,
    verifying: 1,
    challenged: 2,
    not_verified: 3,
  };
  const directionMultiplier = orderDirection === "asc" ? -1 : 1;
  return (a: Market, b: Market) => {
    if (!orderBy) {
      // closed markets will be put on the back
      try {
        const marketStatusA = getMarketStatus(a);
        const marketStatusB = getMarketStatus(b);

        if (marketStatusA !== marketStatusB) {
          if (marketStatusA === MarketStatus.CLOSED) return 1;
          if (marketStatusB === MarketStatus.CLOSED) return -1;
        }
      } catch (e) {
        console.log(e);
      }

      //if underlying token is worthless we put it after
      if (a.parentMarket.id !== zeroAddress || b.parentMarket.id !== zeroAddress) {
        const underlyingAWorthless =
          a.parentMarket.id !== zeroAddress &&
          a.parentMarket.payoutReported &&
          a.parentMarket.payoutNumerators[Number(a.parentOutcome)] === 0n;
        const underlyingBWorthless =
          b.parentMarket.id !== zeroAddress &&
          b.parentMarket.payoutReported &&
          b.parentMarket.payoutNumerators[Number(b.parentOutcome)] === 0n;

        if (underlyingAWorthless !== underlyingBWorthless) {
          return underlyingAWorthless ? 1 : -1;
        }
      }

      //by verification status
      const statusDiff =
        STATUS_PRIORITY[a.verification?.status || "not_verified"] -
        STATUS_PRIORITY[b.verification?.status || "not_verified"];
      if (statusDiff !== 0) {
        return statusDiff;
      }

      // if market has no liquidity we not prioritize it
      try {
        const statusTextA = STATUS_TEXTS[getMarketStatus(a)](a.hasLiquidity);
        const statusTextB = STATUS_TEXTS[getMarketStatus(b)](b.hasLiquidity);
        if (statusTextA !== statusTextB) {
          if (statusTextA === "Liquidity Required") return 1;
          if (statusTextB === "Liquidity Required") return -1;
        }
      } catch (e) {
        console.log(e);
      }

      // by liquidity
      return b.liquidityUSD - a.liquidityUSD;
    }

    if (orderBy === "liquidityUSD") {
      return (b.liquidityUSD - a.liquidityUSD) * directionMultiplier;
    }

    if (orderBy === "creationDate") {
      return (Number(b.blockTimestamp) - Number(a.blockTimestamp)) * directionMultiplier;
    }
    // by opening date
    return (b.openingTs - a.openingTs) * directionMultiplier;
  };
}

function mapGraphMarket(
  market: NonNullable<GetMarketQuery["market"]>,
  extra: {
    chainId: SupportedChain;
    verification: VerificationResult | undefined;
    liquidityUSD: number;
    incentive: number;
    hasLiquidity: boolean;
    categories: string[];
    poolBalance: MarketExtraData["pool_balance"];
    odds: (number | null)[];
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

interface MarketExtraData {
  id: string;
  liquidity: number | null;
  incentive: number | null;
  odds: (number | null)[];
  categories: string[];
  pool_balance: Array<{
    token0: { symbol: string; balance: number };
    token1: { symbol: string; balance: number };
  } | null>;
}

export const fetchMarkets = async (
  chainId: SupportedChain,
  where?: Market_Filter,
  orderBy?: Market_OrderBy,
  orderDirection?: "asc" | "desc",
): Promise<Market[]> => {
  const client = graphQLClient(chainId);

  if (!client) {
    throw new Error("Subgraph not available");
  }

  let markets: GetMarketsQuery["markets"] = [];
  const maxAttempts = 20;
  let attempt = 1;
  let currentId = undefined;
  // try to fetch all markets on subgraph

  while (attempt < maxAttempts) {
    const { markets: currentMarkets } = await getSeerSdk(client).GetMarkets({
      where: isUndefined(currentId) ? where : where ? { and: [where, { id_gt: currentId }] } : { id_gt: currentId },
      orderDirection: OrderDirection.Asc,
      orderBy: Market_OrderBy.Id,
      first: MARKETS_COUNT_PER_QUERY,
    });
    markets = markets.concat(currentMarkets);
    if (currentMarkets[currentMarkets.length - 1]?.id === currentId) {
      break;
    }
    if (currentMarkets.length < MARKETS_COUNT_PER_QUERY) {
      break; // We've fetched all markets
    }
    currentId = currentMarkets[currentMarkets.length - 1]?.id;
    attempt++;
  }
  const verificationStatusList = await getVerificationStatusList(chainId);
  let marketToMarketDataMapping: { [key: string]: MarketExtraData } | undefined;
  try {
    const { data } = await fetch(
      `${import.meta.env.VITE_WEBSITE_URL || "https://app.seer.pm"}/.netlify/functions/supabase-query/markets`,
    ).then((res) => res.json());
    const markets = data as MarketExtraData[];
    marketToMarketDataMapping = markets.reduce(
      (acc, curr) => {
        acc[curr.id] = curr;
        return acc;
      },
      {} as { [key: string]: MarketExtraData },
    );
  } catch (e) {
    console.log(e);
  }
  return markets
    .map((market) => {
      const marketExtraData = marketToMarketDataMapping?.[market.id.toLowerCase() as Address];
      return mapGraphMarket(market, {
        chainId,
        verification: verificationStatusList?.[market.id.toLowerCase() as Address] ?? { status: "not_verified" },
        liquidityUSD: marketExtraData?.liquidity ?? 0,
        incentive: marketExtraData?.incentive ?? 0,
        hasLiquidity: marketExtraData?.odds?.some((odd: number | null) => (odd ?? 0) > 0) ?? false,
        odds: marketExtraData?.odds ?? [],
        categories: marketExtraData?.categories ?? ["misc"],
        poolBalance: marketExtraData?.pool_balance || [],
      });
    })
    .sort(sortMarkets(orderBy, orderDirection || "desc"));
};

export async function searchGraphMarkets(
  chainId: SupportedChain,
  _marketName: string,
  marketStatusList: MarketStatus[] | undefined,
  creator: Address | "",
  participant: Address | "",
  orderBy: Market_OrderBy | undefined,
  orderDirection: "asc" | "desc" | undefined,
) {
  const now = String(Math.round(new Date().getTime() / 1000));

  let where: Market_Filter = {};
  const or = [];

  if (marketStatusList?.includes(MarketStatus.NOT_OPEN)) {
    or.push({
      openingTs_gt: now,
    });
  }
  if (marketStatusList?.includes(MarketStatus.OPEN)) {
    or.push({
      openingTs_lt: now,
      hasAnswers: false,
    });
  }
  if (marketStatusList?.includes(MarketStatus.ANSWER_NOT_FINAL)) {
    or.push({
      openingTs_lt: now,
      hasAnswers: true,
      finalizeTs_gt: now,
    });
  }
  if (marketStatusList?.includes(MarketStatus.IN_DISPUTE)) {
    or.push({
      questionsInArbitration_gt: "0",
    });
  }
  if (marketStatusList?.includes(MarketStatus.PENDING_EXECUTION)) {
    or.push({
      finalizeTs_lt: now,
      payoutReported: false,
      questionsInArbitration: "0",
    });
  }
  if (marketStatusList?.includes(MarketStatus.CLOSED)) {
    or.push({
      payoutReported: true,
    });
  }

  if (or.length > 0) {
    where = {
      and: [where, { or }],
    };
  }

  if (participant) {
    // markets this user is a participant in (participant = creator or trader)
    const marketsWithUserPositions = (await fetchMarketsWithPositions(participant, chainId)).map((a) =>
      a.toLocaleLowerCase(),
    );
    if (marketsWithUserPositions.length > 0) {
      // the user is an active trader in some market
      where = {
        and: [
          where,
          {
            or: [{ id_in: marketsWithUserPositions }, { creator: participant }],
          },
        ],
      };
    } else {
      // the user is not trading, search only created markets
      where["creator"] = participant;
    }
  } else if (creator !== "") {
    where["creator"] = creator;
  }

  return await fetchMarkets(chainId, where, orderBy, orderDirection);
}

export async function searchOnChainMarkets(chainId: SupportedChain) {
  return (
    await readMarketViewGetMarkets(config, {
      args: [BigInt(50), marketFactoryAddress[chainId]],
      chainId,
    })
  )
    .filter((m) => m.id !== "0x0000000000000000000000000000000000000000")
    .map((market) =>
      mapOnChainMarket(market, {
        chainId,
        outcomesSupply: 0n,
        liquidityUSD: 0,
        incentive: 0,
        hasLiquidity: false,
        categories: ["misc"],
        poolBalance: [],
        odds: [],
      }),
    );
}

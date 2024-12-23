import { STATUS_TEXTS } from "@/components/Market/Header";
import {
  lightGeneralizedTcrAddress,
  marketFactoryAddress,
  readMarketViewGetMarkets,
} from "@/hooks/contracts/generated";
import { Status, getSdk as getCurateSdk } from "@/hooks/queries/gql-generated-curate";
import {
  GetMarketQuery,
  GetMarketsQuery,
  MarketType,
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

  if (client && !isUndefined(registryAddress)) {
    const { litems } = await getCurateSdk(client).GetImages({
      where: {
        registryAddress,
      },
    });
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
  orderBy: Market_OrderBy | undefined,
  marketToLiquidityCheckMapping?: { [key: string]: boolean },
) {
  const STATUS_PRIORITY = {
    verified: 0,
    verifying: 1,
    challenged: 2,
    not_verified: 3,
  };

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
      if (marketToLiquidityCheckMapping) {
        try {
          const statusTextA = STATUS_TEXTS[getMarketStatus(a)](marketToLiquidityCheckMapping[a.id]);
          const statusTextB = STATUS_TEXTS[getMarketStatus(b)](marketToLiquidityCheckMapping[b.id]);
          if (statusTextA !== statusTextB) {
            if (statusTextA === "Liquidity Required") return 1;
            if (statusTextB === "Liquidity Required") return -1;
          }
        } catch (e) {
          console.log(e);
        }
      }

      // by open interest (outcomesSupply)
      return Number(b.outcomesSupply - a.outcomesSupply);
    }

    if (orderBy === "outcomesSupply") {
      // by open interest (outcomesSupply)
      return Number(b.outcomesSupply - a.outcomesSupply);
    }

    // by opening date
    return a.openingTs - b.openingTs;
  };
}

function mapGraphMarket(
  market: NonNullable<GetMarketQuery["market"]>,
  extra: { chainId: SupportedChain; verification: VerificationResult | undefined },
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

export const fetchMarkets = async (
  chainId: SupportedChain,
  where?: Market_Filter,
  orderBy?: Market_OrderBy,
): Promise<Market[]> => {
  const client = graphQLClient(chainId);

  if (!client) {
    throw new Error("Subgraph not available");
  }

  let markets: GetMarketsQuery["markets"] = [];

  let skip = 0;
  // try to fetch all markets on subgraph
  // skip cannot be higher than 5000
  while (skip <= 5000) {
    const { markets: currentMarkets } = await getSeerSdk(client).GetMarkets({
      where,
      orderDirection: OrderDirection.Desc,
      first: MARKETS_COUNT_PER_QUERY,
      skip,
    });
    markets = markets.concat(currentMarkets);

    if (currentMarkets.length < MARKETS_COUNT_PER_QUERY) {
      break; // We've fetched all markets
    }

    skip += MARKETS_COUNT_PER_QUERY;
  }

  const verificationStatusList = await getVerificationStatusList(chainId);

  return markets
    .map((market) => {
      return mapGraphMarket(market, {
        chainId,
        verification: verificationStatusList?.[market.id.toLowerCase() as Address] ?? { status: "not_verified" },
      });
    })
    .sort(sortMarkets(orderBy));
};

export async function searchGraphMarkets(
  chainId: SupportedChain,
  type: "Generic" | "Futarchy" | "",
  marketName: string,
  marketStatusList: MarketStatus[] | undefined,
  creator: Address | "",
  participant: Address | "",
  orderBy: Market_OrderBy | undefined,
) {
  const now = String(Math.round(new Date().getTime() / 1000));

  let where: Market_Filter = { marketName_contains_nocase: marketName };
  const or = [];

  if (type) {
    where["type"] = type as MarketType;
  }

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

  return await fetchMarkets(chainId, where, orderBy);
}

export async function searchOnChainMarkets(chainId: SupportedChain) {
  return (
    await readMarketViewGetMarkets(config, {
      args: [BigInt(50), marketFactoryAddress[chainId]],
      chainId,
    })
  )
    .filter((m) => m.id !== "0x0000000000000000000000000000000000000000")
    .map((market) => mapOnChainMarket(market, { chainId, outcomesSupply: 0n }));
}

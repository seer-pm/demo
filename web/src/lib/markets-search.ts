import {
  lightGeneralizedTcrAddress,
  marketFactoryAddress,
  marketViewAbi,
  marketViewAddress,
  readMarketViewGetMarkets,
} from "@/hooks/contracts/generated";
import { getSdk as getCurateSdk } from "@/hooks/queries/gql-generated-curate";
import {
  GetMarketsQuery,
  Market_Filter,
  Market_OrderBy,
  OrderDirection,
  getSdk as getSeerSdk,
} from "@/hooks/queries/gql-generated-seer";
import { Market, OnChainMarket, VerificationResult, mapOnChainMarket } from "@/hooks/useMarket";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { fetchMarketsWithPositions } from "@/hooks/useMarketsWithPositions";
import { SupportedChain } from "@/lib/chains";
import { curateGraphQLClient, graphQLClient } from "@/lib/subgraph";
import { config } from "@/wagmi";
import { readContracts } from "@wagmi/core";
import { Address } from "viem";
import { isUndefined } from "./utils";

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
        if (!item.key0) {
          return obj;
        }
        if (item.status === "Registered") {
          obj[item.key0.toLowerCase()] = { status: "verified", itemID: item.itemID };
          return obj;
        }
        if (item.status === "RegistrationRequested") {
          if (item.disputed) {
            obj[item.key0.toLowerCase()] = { status: "challenged", itemID: item.itemID };
          } else {
            obj[item.key0.toLowerCase()] = { status: "verifying", itemID: item.itemID };
          }
          return obj;
        }
        obj[item.key0.toLowerCase()] = { status: "not_verified" };
        return obj;
      },
      {} as { [key: string]: VerificationResult },
    );
  }

  return {};
}

export function sortMarkets(orderBy: Market_OrderBy | undefined) {
  const STATUS_PRIORITY = {
    verified: 0,
    verifying: 1,
    challenged: 2,
    not_verified: 3,
  };

  return (a: Market, b: Market) => {
    if (!orderBy) {
      //by verification status
      const statusDiff =
        STATUS_PRIORITY[a.verification?.status || "not_verified"] -
        STATUS_PRIORITY[b.verification?.status || "not_verified"];
      if (statusDiff !== 0) {
        return statusDiff;
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

  // add creator field to market to sort
  // create marketId-creator mapping for quick add to market
  const subgraphFieldsMapping = markets.reduce(
    (obj, item) => {
      obj[item.id.toLowerCase()] = { creator: item.creator, outcomesSupply: BigInt(item.outcomesSupply) };
      return obj;
    },
    {} as { [key: string]: { creator: Address; outcomesSupply: bigint } },
  );

  const onChainMarkets = (await readContracts(config, {
    allowFailure: false,
    contracts: markets.map((market) => ({
      abi: marketViewAbi,
      address: marketViewAddress[chainId],
      chainId,
      functionName: "getMarket",
      args: [market.factory, market.id],
    })),
  })) as OnChainMarket[];

  const verificationStatusList = await getVerificationStatusList(chainId);

  // add additional fields to each market
  return onChainMarkets
    .map((market) => {
      return mapOnChainMarket(market, {
        chainId,
        ...subgraphFieldsMapping[market.id.toLowerCase()],
        verification: verificationStatusList?.[market.id.toLowerCase() as Address],
      });
    })
    .sort(sortMarkets(orderBy));
};

export async function searchGraphMarkets(
  chainId: SupportedChain,
  marketName: string,
  marketStatusList: MarketStatus[] | undefined,
  creator: Address | "",
  participant: Address | "",
  orderBy: Market_OrderBy | undefined,
) {
  const now = String(Math.round(new Date().getTime() / 1000));

  let where: Market_Filter = { marketName_contains_nocase: marketName };
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
  const markets = (
    await readMarketViewGetMarkets(config, {
      args: [BigInt(50), marketFactoryAddress[chainId]],
      chainId,
    })
  ).map((market) => mapOnChainMarket(market, { chainId, outcomesSupply: 0n }));

  return markets.filter((m) => {
    const hasOpenQuestions = m.questions.find((q) => q.opening_ts !== 0);
    return hasOpenQuestions;
  });
}

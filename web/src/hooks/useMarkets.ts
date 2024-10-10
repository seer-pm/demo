import { SupportedChain } from "@/lib/chains";
import { graphQLClient } from "@/lib/subgraph";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address } from "viem";
import { useAccount } from "wagmi";
import {
  marketFactoryAddress,
  marketViewAbi,
  marketViewAddress,
  readMarketViewGetMarkets,
} from "./contracts/generated";
import { GetMarketsQuery, Market_Filter, Market_OrderBy, OrderDirection, getSdk } from "./queries/gql-generated-seer";
import useDefaultSortMarket from "./useDefaultSortMarket";
import { useGlobalState } from "./useGlobalState";
import { Market, OnChainMarket, mapOnChainMarket } from "./useMarket";
import { MarketStatus } from "./useMarketStatus";
import useMarketsSearchParams from "./useMarketsSearchParams";
import { fetchMarketsWithPositions } from "./useMarketsWithPositions";
import { VerificationStatus, defaultStatus, useVerificationStatusList } from "./useVerificationStatus";

const ITEMS_PER_PAGE = 10;
const MARKETS_COUNT_PER_QUERY = 1000;

export const useOnChainMarkets = (
  chainId: SupportedChain,
  marketName: string,
  marketStatusList: MarketStatus[] | undefined,
) => {
  return useQuery<Market[] | undefined, Error>({
    queryKey: ["useOnChainMarkets", chainId, marketName, marketStatusList],
    queryFn: async () => {
      const markets = (
        await readMarketViewGetMarkets(config, {
          args: [BigInt(50), marketFactoryAddress[chainId]],
          chainId,
        })
      ).map(mapOnChainMarket);

      return markets.filter((m) => {
        const hasOpenQuestions = m.questions.find((q) => q.opening_ts !== 0);
        return hasOpenQuestions;
      });
    },
  });
};

export const fetchMarkets = async (chainId: SupportedChain, where?: Market_Filter, orderBy?: Market_OrderBy) => {
  const client = graphQLClient(chainId);

  if (!client) {
    throw new Error("Subgraph not available");
  }

  let markets: GetMarketsQuery["markets"] = [];

  let skip = 0;
  // try to fetch all markets on subgraph
  // skip cannot be higher than 5000
  while (skip <= 5000) {
    const { markets: currentMarkets } = await getSdk(client).GetMarkets({
      where,
      orderBy,
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
  const creatorMapping = markets.reduce(
    (obj, item) => {
      obj[item.id.toLowerCase()] = item.creator;
      return obj;
    },
    {} as { [key: string]: string | null | undefined },
  );

  const onChainMarkets = (await readContracts(config, {
    allowFailure: false,
    contracts: markets.map((market) => ({
      abi: marketViewAbi,
      address: marketViewAddress[chainId],
      functionName: "getMarket",
      args: [market.factory, market.id],
    })),
  })) as OnChainMarket[];

  // add creator to each market
  return onChainMarkets.map((market) => {
    return mapOnChainMarket({
      ...market,
      creator: creatorMapping[market.id.toLowerCase()],
    });
  });
};

export const useGraphMarkets = (
  chainId: SupportedChain,
  marketName: string,
  marketStatusList: MarketStatus[] | undefined,
  creator: Address | "",
  participant: Address | "",
  orderBy: Market_OrderBy | undefined,
) => {
  return useQuery<Market[], Error>({
    queryKey: ["useGraphMarkets", chainId, marketName, marketStatusList, creator, orderBy],
    queryFn: async () => {
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
    },
    retry: false,
  });
};

interface UseMarketsProps {
  chainId: SupportedChain;
  marketName?: string;
  marketStatusList?: MarketStatus[];
  creator?: Address | "";
  participant?: Address | "";
  orderBy?: Market_OrderBy;
  verificationStatusList?: VerificationStatus[];
  isShowMyMarkets: boolean;
}

export const useMarkets = ({
  chainId,
  marketName = "",
  marketStatusList = [],
  creator = "",
  participant = "",
  orderBy,
}: UseMarketsProps) => {
  const onChainMarkets = useOnChainMarkets(chainId, marketName, marketStatusList);
  const graphMarkets = useGraphMarkets(chainId, marketName, marketStatusList, creator, participant, orderBy);
  if (marketName || marketStatusList.length > 0) {
    // we only filter using the subgraph
    return graphMarkets;
  }

  // if the subgraph is error we return on chain markets, otherwise we return subgraph
  return graphMarkets.isError ? onChainMarkets : graphMarkets;
};

export const useSortAndFilterMarkets = (params: UseMarketsProps) => {
  const result = useMarkets(params);
  const { address = "" } = useAccount();
  const favorites = useGlobalState((state) => state.favorites);
  const { data: verificationStatusResultList } = useVerificationStatusList(params.chainId as SupportedChain);
  const { page, setPage } = useMarketsSearchParams();

  const markets = result.data || [];

  // if not orderBy, default sort by verification status -> open interest
  const defaultSortedMarkets = useDefaultSortMarket(markets);
  let data = params.orderBy ? markets : defaultSortedMarkets;

  // filter by verification status
  if (params.verificationStatusList) {
    data = data.filter((market) => {
      const verificationStatus =
        verificationStatusResultList?.[market.id.toLowerCase()]?.status ?? defaultStatus.status;
      return params.verificationStatusList?.some((status) => verificationStatus === status);
    });
  }

  // filter my markets
  if (params.isShowMyMarkets) {
    data = data.filter((market: Market & { creator?: string }) => {
      return address && market.creator?.toLocaleLowerCase() === address.toLocaleLowerCase();
    });
  }

  // favorite markets on top, we use reduce to keep the current sort order
  const [favoriteMarkets, nonFavoriteMarkets] = data.reduce(
    (total, market) => {
      if (favorites[address]?.find((x) => x === market.id)) {
        total[0].push(market);
      } else {
        total[1].push(market);
      }
      return total;
    },
    [[], []] as Market[][],
  );
  data = favoriteMarkets.concat(nonFavoriteMarkets);

  //pagination
  const itemOffset = (page - 1) * ITEMS_PER_PAGE;
  const endOffset = itemOffset + ITEMS_PER_PAGE;

  const currentMarkets = data.slice(itemOffset, endOffset) as Market[];
  const pageCount = Math.ceil(data.length / ITEMS_PER_PAGE);

  const handlePageClick = ({ selected }: { selected: number }) => {
    setPage(selected + 1);
  };

  return {
    ...result,
    data: currentMarkets,
    pagination: { pageCount, handlePageClick, page: Number(page ?? "") },
  };
};

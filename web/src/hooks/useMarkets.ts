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
import { Market_Filter, Market_OrderBy, OrderDirection, getSdk } from "./queries/generated";
import useDefaultSortMarket from "./useDefaultSortMarket";
import { useGlobalState } from "./useGlobalState";
import { Market, OnChainMarket, mapOnChainMarket } from "./useMarket";
import { MarketStatus } from "./useMarketStatus";
import useMarketsSearchParams from "./useMarketsSearchParams";
import { VerificationStatus, defaultStatus, useVerificationStatusList } from "./useVerificationStatus";

const itemsPerPage = 10;
const marketsCountPerQuery = 1000;

export const useOnChainMarkets = (chainId: SupportedChain, marketName: string, marketStatus: MarketStatus | "") => {
  return useQuery<Market[] | undefined, Error>({
    queryKey: ["useOnChainMarkets", chainId, marketName, marketStatus],
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

export const useGraphMarkets = (
  chainId: SupportedChain,
  marketName: string,
  marketStatus: MarketStatus | "",
  creator: Address | "",
  orderBy: Market_OrderBy | undefined,
) => {
  return useQuery<Market[], Error>({
    queryKey: ["useGraphMarkets", chainId, marketName, marketStatus, creator, orderBy],
    queryFn: async () => {
      const client = graphQLClient(chainId);

      if (client) {
        const now = String(Math.round(new Date().getTime() / 1000));

        const where: Market_Filter = { marketName_contains_nocase: marketName };

        if (marketStatus === MarketStatus.NOT_OPEN) {
          where["openingTs_gt"] = now;
        } else if (marketStatus === MarketStatus.OPEN) {
          where["openingTs_lt"] = now;
          where["hasAnswers"] = false;
        } else if (marketStatus === MarketStatus.ANSWER_NOT_FINAL) {
          where["openingTs_lt"] = now;
          where["hasAnswers"] = true;
          where["finalizeTs_gt"] = now;
        } else if (marketStatus === MarketStatus.IN_DISPUTE) {
          where["questionsInArbitration_gt"] = "0";
        } else if (marketStatus === MarketStatus.PENDING_EXECUTION) {
          where["finalizeTs_lt"] = now;
          where["payoutReported"] = false;
        } else if (marketStatus === MarketStatus.CLOSED) {
          where["payoutReported"] = true;
        }

        if (creator !== "") {
          where["creator"] = creator;
        }

        let markets: {
          __typename?: "Market";
          id: string;
          factory: `0x${string}`;
          creator: `0x${string}`;
        }[] = [];

        let lastId = null;

        // try to fetch all markets on subgraph
        while (true) {
          const { markets: currentMarkets } = await getSdk(client).GetMarkets({
            where: { ...where, ...(lastId && { id_gt: lastId }) },
            orderBy,
            orderDirection: OrderDirection.Desc,
            first: marketsCountPerQuery,
          });

          markets = markets.concat(currentMarkets);

          if (currentMarkets.length < marketsCountPerQuery) {
            break; // We've fetched all markets
          }

          lastId = currentMarkets[currentMarkets.length - 1].id;
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
      }

      throw new Error("Subgraph not available");
    },
    retry: false,
  });
};

interface UseMarketsProps {
  chainId: SupportedChain;
  marketName?: string;
  marketStatus?: MarketStatus | "";
  creator?: Address | "";
  orderBy?: Market_OrderBy;
  verificationStatus?: VerificationStatus;
}

export const useMarkets = ({ chainId, marketName = "", marketStatus = "", creator = "", orderBy }: UseMarketsProps) => {
  const onChainMarkets = useOnChainMarkets(chainId, marketName, marketStatus);
  const graphMarkets = useGraphMarkets(chainId, marketName, marketStatus, creator, orderBy);

  if (marketName || marketStatus) {
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

  // if not orderBy, default sort by your markets-> verification status -> liquidity
  const defaultSortedMarkets = useDefaultSortMarket(markets);
  let data = params.orderBy ? markets : defaultSortedMarkets;

  // filter by verification status
  if (params.verificationStatus) {
    data = data.filter((market) => {
      const verificationStatus =
        verificationStatusResultList?.[market.id.toLowerCase()]?.status ?? defaultStatus.status;
      return verificationStatus === params.verificationStatus;
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
  const itemOffset = (page - 1) * itemsPerPage;
  const endOffset = itemOffset + itemsPerPage;

  const currentMarkets = data.slice(itemOffset, endOffset) as Market[];
  const pageCount = Math.ceil(markets.length / itemsPerPage);

  const handlePageClick = ({ selected }: { selected: number }) => {
    setPage(selected + 1);
  };

  return {
    ...result,
    data,
    pagination: { currentMarkets, pageCount, handlePageClick, page: Number(page ?? "") },
  };
};

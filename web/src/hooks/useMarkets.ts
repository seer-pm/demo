import { RouterAbi } from "@/abi/RouterAbi";
import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { getRouterAddress } from "@/lib/config";
import { ITEMS_PER_PAGE, searchGraphMarkets, searchOnChainMarkets, sortMarkets } from "@/lib/markets-search";
import { queryClient } from "@/lib/query-client";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { Market_OrderBy } from "./queries/gql-generated-seer";
import { useGlobalState } from "./useGlobalState";
import { Market, VerificationStatus, getUseGraphMarketKey } from "./useMarket";
import { MarketStatus } from "./useMarketStatus";
import useMarketsSearchParams from "./useMarketsSearchParams";

const useOnChainMarkets = (
  chainsList: Array<string | "all">,
  marketName: string,
  marketStatusList: MarketStatus[] | undefined,
) => {
  const chainIds = (
    chainsList.length === 0
      ? Object.keys(SUPPORTED_CHAINS)
      : chainsList.filter((chain) => chain !== "all" && chain !== "31337")
  )
    .filter((chain) => chain !== "31337")
    .map((chainId) => Number(chainId)) as SupportedChain[];

  return useQuery<Market[] | undefined, Error>({
    queryKey: ["useOnChainMarkets", chainIds, marketName, marketStatusList],
    queryFn: async () => {
      return (await Promise.all(chainIds.map(searchOnChainMarkets))).flat();
    },
  });
};

const useGraphMarkets = (
  chainsList: Array<string | "all">,
  marketName: string,
  marketStatusList: MarketStatus[] | undefined,
  creator: Address | "",
  participant: Address | "",
  orderBy: Market_OrderBy | undefined,
) => {
  const chainIds = (
    chainsList.length === 0 ? Object.keys(SUPPORTED_CHAINS) : chainsList.filter((chain) => chain !== "all")
  )
    .filter((chain) => chain !== "31337")
    .map((chainId) => Number(chainId)) as SupportedChain[];

  return useQuery<Market[], Error>({
    queryKey: ["useGraphMarkets", chainIds, marketName, marketStatusList, creator, orderBy],
    queryFn: async () => {
      const markets = (
        await Promise.all(
          chainIds.map((chainId) =>
            searchGraphMarkets(chainId, marketName, marketStatusList, creator, participant, orderBy),
          ),
        )
      ).flat();

      const winningOutcomesMapping = (
        await Promise.all(
          markets.map((market) => {
            const routerAddress = getRouterAddress(market.chainId);
            return readContract(config, {
              abi: RouterAbi,
              address: routerAddress as Address,
              functionName: "getWinningOutcomes",
              args: [market.conditionId],
              chainId: market.chainId,
            });
          }),
        )
      ).reduce(
        (acc, curr, index) => {
          acc[markets[index].id] = curr as boolean[];
          return acc;
        },
        {} as { [key: string]: boolean[] },
      );

      const payoutReportedMapping = markets.reduce(
        (acc, curr) => {
          acc[curr.id] = curr.payoutReported;
          return acc;
        },
        {} as { [key: string]: boolean },
      );
      // sort again because we are merging markets from multiple chains
      markets.sort(sortMarkets(orderBy, { payoutReportedMapping, winningOutcomesMapping }));
      for (const market of markets) {
        queryClient.setQueryData(getUseGraphMarketKey(market.id), market);
      }

      return markets;
    },
    retry: false,
  });
};

interface UseMarketsProps {
  marketName?: string;
  marketStatusList?: MarketStatus[];
  verificationStatusList?: VerificationStatus[];
  chainsList?: Array<string | "all">;
  creator?: Address | "";
  participant?: Address | "";
  orderBy?: Market_OrderBy;
  isShowMyMarkets?: boolean;
}

export const useMarkets = ({
  marketName = "",
  marketStatusList = [],
  chainsList = [],
  creator = "",
  participant = "",
  orderBy,
}: UseMarketsProps) => {
  const onChainMarkets = useOnChainMarkets(chainsList, marketName, marketStatusList);
  const graphMarkets = useGraphMarkets(chainsList, marketName, marketStatusList, creator, participant, orderBy);
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
  const { page, setPage } = useMarketsSearchParams();

  let data = result.data || [];

  // filter by verification status
  if (params.verificationStatusList) {
    data = data.filter((market) => {
      return params.verificationStatusList?.some((status) => market.verification?.status === status);
    });
  }

  // filter my markets
  if (params.isShowMyMarkets) {
    data = data.filter((market: Market) => {
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

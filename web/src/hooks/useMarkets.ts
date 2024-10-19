import { SupportedChain, gnosis, mainnet } from "@/lib/chains";
import { ITEMS_PER_PAGE, searchGraphMarkets, searchOnChainMarkets, sortMarkets } from "@/lib/markets-search";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { Market_OrderBy } from "./queries/gql-generated-seer";
import { useGlobalState } from "./useGlobalState";
import { Market, VerificationStatus } from "./useMarket";
import { MarketStatus } from "./useMarketStatus";
import useMarketsSearchParams from "./useMarketsSearchParams";

const useOnChainMarkets = (
  chainId: SupportedChain | "all",
  marketName: string,
  marketStatusList: MarketStatus[] | undefined,
) => {
  return useQuery<Market[] | undefined, Error>({
    queryKey: ["useOnChainMarkets", chainId, marketName, marketStatusList],
    queryFn: async () => {
      const chainIds = chainId === "all" ? [gnosis.id, mainnet.id] : [chainId];

      return (await Promise.all(chainIds.map(searchOnChainMarkets))).flat();
    },
  });
};

const useGraphMarkets = (
  chainId: SupportedChain | "all",
  marketName: string,
  marketStatusList: MarketStatus[] | undefined,
  creator: Address | "",
  participant: Address | "",
  orderBy: Market_OrderBy | undefined,
) => {
  return useQuery<Market[], Error>({
    queryKey: ["useGraphMarkets", chainId, marketName, marketStatusList, creator, orderBy],
    queryFn: async () => {
      const chainIds = chainId === "all" ? [gnosis.id, mainnet.id] : [chainId];

      return (
        (
          await Promise.all(
            chainIds.map((chainId) =>
              searchGraphMarkets(chainId, marketName, marketStatusList, creator, participant, orderBy),
            ),
          )
        )
          .flat()
          // sort again because we are merging markets from multiple chains
          .sort(sortMarkets(orderBy))
      );
    },
    retry: false,
  });
};

interface UseMarketsProps {
  chainId: SupportedChain | "all";
  marketName?: string;
  marketStatusList?: MarketStatus[];
  creator?: Address | "";
  participant?: Address | "";
  orderBy?: Market_OrderBy;
  verificationStatusList?: VerificationStatus[];
  isShowMyMarkets: boolean;
}

const useMarkets = ({
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

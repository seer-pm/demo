import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { searchGraphMarkets, searchOnChainMarkets, sortMarkets } from "@/lib/markets-search";
import { queryClient } from "@/lib/query-client";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { Market_OrderBy } from "./queries/gql-generated-seer";
import { Market, VerificationStatus, getUseGraphMarketKey } from "./useMarket";
import { MarketStatus } from "./useMarketStatus";

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
  type: "Generic" | "Futarchy" | "",
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

  return useQuery<Market[] | undefined, Error>({
    queryKey: ["useGraphMarkets", chainIds, type, marketName, marketStatusList, creator, orderBy],
    queryFn: async () => {
      const markets = (
        await Promise.allSettled(
          chainIds.map((chainId) =>
            searchGraphMarkets(chainId, type, marketName, marketStatusList, creator, participant, orderBy),
          ),
        )
      )
        .reduce((markets, result) => {
          if (result.status === "fulfilled") {
            markets.push(result.value);
          }
          return markets;
        }, [] as Market[][])
        .flat();

      // sort again because we are merging markets from multiple chains
      markets.sort(sortMarkets(orderBy));

      for (const market of markets) {
        queryClient.setQueryData(getUseGraphMarketKey(market.id), market);
      }

      return markets;
    },
    retry: false,
  });
};

export interface UseMarketsProps {
  type?: "Generic" | "Futarchy" | "";
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
  type = "",
  marketName = "",
  marketStatusList = [],
  chainsList = [],
  creator = "",
  participant = "",
  orderBy,
}: UseMarketsProps) => {
  const onChainMarkets = useOnChainMarkets(chainsList, marketName, marketStatusList);
  const graphMarkets = useGraphMarkets(chainsList, type, marketName, marketStatusList, creator, participant, orderBy);
  if (marketName || marketStatusList.length > 0) {
    // we only filter using the subgraph
    return graphMarkets;
  }

  // if the subgraph is error we return on chain markets, otherwise we return subgraph
  return graphMarkets.isError ? onChainMarkets : graphMarkets;
};

import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { searchGraphMarkets, sortMarkets } from "@/lib/markets-search";
import { queryClient } from "@/lib/query-client";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { Market_OrderBy } from "./queries/gql-generated-seer";
import { Market, getUseGraphMarketKey } from "./useMarket";
import { MarketStatus } from "./useMarketStatus";
import { UseMarketsProps } from "./useMarkets";

const useGraphProposals = (
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
    queryKey: ["useGraphProposals", chainIds, marketName, marketStatusList, creator, orderBy],
    queryFn: async () => {
      // TODO: return proposals instead of markets
      const markets = (
        await Promise.all(
          chainIds.map((chainId) =>
            searchGraphMarkets(chainId, marketName, marketStatusList, creator, participant, orderBy),
          ),
        )
      )
        .flat()
        // sort again because we are merging markets from multiple chains
        .sort(sortMarkets(orderBy));

      for (const market of markets) {
        queryClient.setQueryData(getUseGraphMarketKey(market.id), market);
      }

      return markets;
    },
    retry: false,
  });
};

export const useProposals = ({
  marketName = "",
  marketStatusList = [],
  chainsList = [],
  creator = "",
  participant = "",
  orderBy,
}: UseMarketsProps) => {
  return useGraphProposals(chainsList, marketName, marketStatusList, creator, participant, orderBy);
};

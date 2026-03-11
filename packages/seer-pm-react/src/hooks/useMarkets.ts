import type { SupportedChain } from "@seer-pm/sdk";
import {
  type FetchMarketParams,
  type MarketStatus,
  type MarketsResult,
  type VerificationStatus,
  fetchMarkets,
  searchOnChainMarkets,
} from "@seer-pm/sdk";
import { type Market_OrderBy } from "@seer-pm/sdk/subgraph/seer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { useConfig } from "wagmi";
import { getUseGraphMarketKey } from "./useMarket";

const useOnChainMarkets = (
  chainIds: SupportedChain[],
  marketName: string,
  marketStatusList: MarketStatus[] | undefined,
  disabled?: boolean,
) => {
  const config = useConfig();
  return useQuery<MarketsResult, Error>({
    queryKey: ["useOnChainMarkets", chainIds, marketName, marketStatusList],
    enabled: !disabled && chainIds.length > 0,
    queryFn: async () => {
      const markets = (await Promise.all(chainIds.map((chainId) => searchOnChainMarkets(config, chainId)))).flat();
      return {
        markets,
        count: markets.length,
        pages: 1,
      };
    },
  });
};

export const getUseGraphMarketsKey = (params: FetchMarketParams) => ["useGraphMarkets", params];

export const useGraphMarketsQueryFn = async (queryClient: QueryClient, params: FetchMarketParams) => {
  const result = await fetchMarkets(params);
  for (const market of result.markets) {
    queryClient.setQueryData(getUseGraphMarketKey(market.id, market.chainId), market);
    queryClient.setQueryData(getUseGraphMarketKey(market.url, market.chainId), market);
  }
  return result;
};

function useGraphMarkets(params: FetchMarketParams, queryClient: QueryClient) {
  return useQuery<MarketsResult, Error>({
    enabled: !params.disabled,
    queryKey: getUseGraphMarketsKey(params),
    queryFn: async () => {
      return useGraphMarketsQueryFn(queryClient, params);
    },
    retry: false,
  });
}

export interface UseMarketsProps {
  type?: "Generic" | "Futarchy" | "";
  marketName?: string;
  marketStatusList?: MarketStatus[];
  verificationStatusList?: VerificationStatus[];
  categoryList?: string[];
  chainsList?: Array<string | "all">;
  creator?: Address | "";
  participant?: Address | "";
  orderBy?: Market_OrderBy;
  showMyMarkets?: boolean;
  showConditionalMarkets?: boolean;
  showMarketsWithRewards?: boolean;
  showFutarchyMarkets?: boolean;
  minLiquidity?: number;
  orderDirection?: "asc" | "desc";
  marketIds?: string[];
  disabled?: boolean;
  limit?: number;
  page?: number;
}

export const useMarkets = ({
  type = "",
  marketName = "",
  categoryList = [],
  marketStatusList = [],
  verificationStatusList = [],
  showConditionalMarkets,
  showMarketsWithRewards,
  minLiquidity,
  chainsList = [],
  creator = "",
  participant = "",
  orderBy,
  orderDirection,
  marketIds,
  disabled,
  limit,
  page,
}: UseMarketsProps = {}) => {
  const queryClient = useQueryClient();

  const chainIds = (
    chainsList.length === 0
      ? []
      : chainsList.filter((chain) => chain !== "all" && chain !== "31337").map((chainId) => Number(chainId))
  ) as SupportedChain[];

  const onChainMarkets = useOnChainMarkets(chainIds, marketName, marketStatusList, disabled);
  const graphMarkets = useGraphMarkets(
    {
      chainsList,
      type,
      marketName,
      categoryList,
      marketStatusList,
      verificationStatusList,
      showConditionalMarkets,
      showMarketsWithRewards,
      minLiquidity,
      creator,
      participant,
      orderBy,
      orderDirection,
      marketIds,
      disabled,
      limit,
      page,
    },
    queryClient,
  );

  if (marketName || (marketStatusList?.length ?? 0) > 0) {
    return graphMarkets;
  }
  return graphMarkets.isError ? onChainMarkets : graphMarkets;
};

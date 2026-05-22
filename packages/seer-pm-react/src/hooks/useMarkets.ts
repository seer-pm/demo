import {
  type FetchMarketParams,
  type MarketStatus,
  type MarketsResult,
  type VerificationStatus,
  fetchMarkets,
} from "@seer-pm/sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { getUseGraphMarketKey } from "./useMarket";

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
  orderBy?: FetchMarketParams["orderBy"];
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

  return useGraphMarkets(
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
};

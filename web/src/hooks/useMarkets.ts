import { SUPPORTED_CHAINS } from "@/lib/chains";
import { MarketsResult } from "@/lib/market";
import { queryClient } from "@/lib/query-client";
import { config } from "@/wagmi";
import { getUseGraphMarketKey } from "@seer-pm/react";
import type { SupportedChain } from "@seer-pm/sdk";
import { FetchMarketParams, MarketStatus, VerificationStatus, fetchMarkets, searchOnChainMarkets } from "@seer-pm/sdk";
import { Market_OrderBy } from "@seer-pm/sdk/seer";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";

const useOnChainMarkets = (
  chainsList: Array<string | "all">,
  marketName: string,
  marketStatusList: MarketStatus[] | undefined,
  disabled?: boolean,
) => {
  const chainIds = (
    chainsList.length === 0
      ? Object.keys(SUPPORTED_CHAINS)
      : chainsList.filter((chain) => chain !== "all" && chain !== "31337")
  )
    .filter((chain) => chain !== "31337")
    .map((chainId) => Number(chainId)) as SupportedChain[];

  return useQuery<MarketsResult, Error>({
    queryKey: ["useOnChainMarkets", chainIds, marketName, marketStatusList],
    enabled: !disabled,
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

export const useGraphMarketsQueryFn = async (params: FetchMarketParams) => {
  const result = await fetchMarkets(params);
  for (const market of result.markets) {
    queryClient.setQueryData(getUseGraphMarketKey(market.id, market.chainId), market);
    queryClient.setQueryData(getUseGraphMarketKey(market.url, market.chainId), market);
  }

  return result;
};

function useGraphMarkets(params: FetchMarketParams) {
  return useQuery<MarketsResult, Error>({
    enabled: !params.disabled,
    queryKey: getUseGraphMarketsKey(params),
    queryFn: async () => {
      return useGraphMarketsQueryFn(params);
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
}: UseMarketsProps) => {
  const onChainMarkets = useOnChainMarkets(chainsList, marketName, marketStatusList, disabled);
  const graphMarkets = useGraphMarkets({
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
  });
  if (marketName || marketStatusList.length > 0) {
    // we only filter using the subgraph
    return graphMarkets;
  }

  // if the subgraph is error we return on chain markets, otherwise we return subgraph
  return graphMarkets.isError ? onChainMarkets : graphMarkets;
};

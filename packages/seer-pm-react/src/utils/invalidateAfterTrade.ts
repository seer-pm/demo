import { type Market, type SupportedChain, fetchChartData } from "@seer-pm/sdk";
import type { QueryClient } from "@tanstack/react-query";
import type { Address } from "viem";

export const getUsePoolHourDataSetsKey = (chainId: SupportedChain, marketId: Address) =>
  ["usePoolHourDataSets", chainId, marketId] as const;

export type InvalidateAfterTradeOptions = {
  market?: Market;
  onSuccess?: () => unknown;
};

export function invalidateAfterTrade(queryClient: QueryClient, options?: InvalidateAfterTradeOptions) {
  queryClient.invalidateQueries({ queryKey: ["useQuote"] });
  queryClient.invalidateQueries({ queryKey: ["useMarketOdds"] });
  queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
  queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
  queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
  queryClient.invalidateQueries({ queryKey: ["useTicksData"] });
  queryClient.invalidateQueries({ queryKey: ["usePortfolioPositions"] });
  queryClient.invalidateQueries({ queryKey: ["portfolioValue"] });
  if (options?.market) {
    const market = options.market;
    // Fetch directly — do not invalidate this key or active observers refetch without fresh=true.
    void fetchChartData(market, { fresh: true }).then(async (chartData) => {
      queryClient.setQueryData(getUsePoolHourDataSetsKey(market.chainId, market.id), chartData);
      await queryClient.invalidateQueries({
        queryKey: ["useChartData", market.chainId, market.id],
      });
    });
  }

  options?.onSuccess?.();
}

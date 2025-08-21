import { Market } from "@/lib/market";
import { getMarketOdds } from "@/lib/market-odds";
import { isUndefined } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import useMarketHasLiquidity from "./useMarketHasLiquidity";

export const useMarketOdds = (market: Market, enabled: boolean) => {
  const hasLiquidity = useMarketHasLiquidity(market);

  const getInitialData = () => {
    if (market.odds.length > 0) {
      if (market.odds.every((x) => x !== null)) {
        // all outcomes have valid odds
        return market.odds as number[];
      }

      if (!enabled) {
        // If some odds are null but the query is disabled, we're likely in prerendered mode (e.g., homepage)
        // Return the existing odds data even if incomplete to avoid unnecessary loading states
        // Since the query is disabled, it won't run to fetch updated data, so we use what we have
        // This is especially important for components like market previews on the homepage
        return market.odds;
      }
    }

    return undefined;
  };

  return useQuery<(number | null)[] | undefined, Error>({
    // hasLiquidity is undefined while loading market liquidity data
    enabled: enabled && !isUndefined(hasLiquidity),
    queryKey: ["useMarketOdds", market.id, market.chainId, hasLiquidity, market.odds],
    gcTime: 1000 * 60 * 60 * 24, //24 hours
    staleTime: 0,
    initialData: getInitialData(),
    queryFn: async () => {
      return getMarketOdds(market, hasLiquidity!);
    },
  });
};

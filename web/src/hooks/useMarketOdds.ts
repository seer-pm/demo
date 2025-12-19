import { Market } from "@/lib/market";
import { getMarketOdds } from "@/lib/market-odds";
import { isUndefined } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import useMarketHasLiquidity from "./useMarketHasLiquidity";

export const useMarketOdds = (market: Market, enabled: boolean) => {
  const hasLiquidity = useMarketHasLiquidity(market);

  const getInitialData = () => {
    if (market.odds.length > 0) {
      return market.odds;
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

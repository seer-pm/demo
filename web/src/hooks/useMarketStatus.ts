import { MarketStatus, getMarketStatus } from "@/lib/market";
import { Market } from "@/lib/market";
import { useQuery } from "@tanstack/react-query";

export const useMarketStatus = (market: Market) => {
  return useQuery<MarketStatus | undefined, Error>({
    queryKey: ["useMarketStatus", market.id],
    queryFn: async () => getMarketStatus(market),
    refetchOnWindowFocus: true,
  });
};

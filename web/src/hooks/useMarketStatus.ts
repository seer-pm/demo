import { useQuery } from "@tanstack/react-query";
import { Market } from "./useMarket";

export enum MarketStatus {
  OPEN = 1,
  WAITING_RESULTS = 2,
  CLOSED = 3,
}

export const useMarketStatus = (market?: Market) => {
  return useQuery<MarketStatus | undefined, Error>({
    enabled: !!market,
    queryKey: ["useMarketStatus", market?.id],
    queryFn: async () => {
      const now = Math.round(new Date().getTime() / 1000);

      if (market!.question.opening_ts > now) {
        return MarketStatus.OPEN;
      }

      if (market!.question.finalize_ts > now) {
        return MarketStatus.WAITING_RESULTS;
      }

      return MarketStatus.CLOSED;
    },
  });
};

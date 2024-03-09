import { SupportedChain } from "@/lib/chains";
import { hasAllUnansweredQuestions, hasOpenQuestions, isWaitingResults } from "@/lib/market";
import { useQuery } from "@tanstack/react-query";
import { Market } from "./useMarket";

export enum MarketStatus {
  NOT_OPEN = 1,
  OPEN = 2,
  ANSWER_NOT_FINAL = 3,
  PENDING_EXECUTION = 4,
  CLOSED = 5,
}

export const useMarketStatus = (market?: Market, chainId?: SupportedChain) => {
  return useQuery<MarketStatus | undefined, Error>({
    enabled: !!market && !!chainId,
    queryKey: ["useMarketStatus", market?.id, chainId],
    queryFn: async () => {
      if (!hasOpenQuestions(market!)) {
        return MarketStatus.NOT_OPEN;
      }

      if (hasAllUnansweredQuestions(market!)) {
        return MarketStatus.OPEN;
      }

      if (isWaitingResults(market!)) {
        return MarketStatus.ANSWER_NOT_FINAL;
      }

      if (!market!.payoutReported) {
        return MarketStatus.PENDING_EXECUTION;
      }

      return MarketStatus.CLOSED;
    },
  });
};

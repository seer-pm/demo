import { SupportedChain } from "@/lib/chains";
import { hasAllUnansweredQuestions, hasOpenQuestions, isInDispute, isWaitingResults } from "@/lib/market";
import { useQuery } from "@tanstack/react-query";
import { Market } from "./useMarket";

export enum MarketStatus {
  NOT_OPEN = 1,
  OPEN = 2,
  ANSWER_NOT_FINAL = 3,
  IN_DISPUTE = 4,
  PENDING_EXECUTION = 5,
  CLOSED = 6,
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

      if (isInDispute(market!)) {
        return MarketStatus.IN_DISPUTE;
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

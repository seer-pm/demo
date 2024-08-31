import { SupportedChain } from "@/lib/chains";
import { hasAllUnansweredQuestions, hasOpenQuestions, isInDispute, isWaitingResults } from "@/lib/market";
import { useQuery } from "@tanstack/react-query";
import { Market } from "./useMarket";

export enum MarketStatus {
  NOT_OPEN = "not_open",
  OPEN = "open",
  ANSWER_NOT_FINAL = "answer_not_final",
  IN_DISPUTE = "in_dispute",
  PENDING_EXECUTION = "pending_execution",
  CLOSED = "closed",
}

export const getMarketStatus = (market?: Market) => {
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
};

export const useMarketStatus = (market?: Market, chainId?: SupportedChain) => {
  return useQuery<MarketStatus | undefined, Error>({
    enabled: !!market && !!chainId,
    queryKey: ["useMarketStatus", market?.id, chainId],
    queryFn: async () => getMarketStatus(market),
    refetchOnWindowFocus: true,
  });
};

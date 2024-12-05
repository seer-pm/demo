import { hasAllUnansweredQuestions, hasOpenQuestions, isInDispute, isWaitingResults } from "./market.ts";
import { Market, MarketStatus } from "./types.ts";

export const getMarketStatus = (market: Market) => {
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

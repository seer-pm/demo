import { Market } from "@/hooks/useMarket";
import { isFinalized } from "./reality";
import { formatDate } from "./utils";

export function hasOpenQuestions(market: Market) {
  const now = Math.round(new Date().getTime() / 1000);

  // all the questions have the same opening_ts so we can use the first one to check it
  return market.questions[0].opening_ts < now;
}

export function hasAllUnansweredQuestions(market: Market) {
  return market.questions.every((question) => {
    return question.finalize_ts === 0;
  });
}

export function isInDispute(market: Market) {
  return market.questions.some((question) => {
    return question.is_pending_arbitration;
  });
}

export function isWaitingResults(market: Market) {
  return market.questions.some((question) => {
    return question.finalize_ts === 0 || !isFinalized(question);
  });
}

export function getOpeningTime(market: Market) {
  return formatDate(market.questions[0].opening_ts);
}

export function getClosingTime(market: Market) {
  return new Date(market.questions[0].opening_ts * 1000).toUTCString();
}

export enum MarketTypes {
  CATEGORICAL = 1,
  SCALAR = 2,
  MULTI_SCALAR = 3,
}

export function getMarketType(market: Market): MarketTypes {
  if (market.questions.length > 1) {
    return MarketTypes.MULTI_SCALAR;
  }

  if (market.lowerBound === 0n && market.upperBound === 0n) {
    return MarketTypes.CATEGORICAL;
  }

  return MarketTypes.SCALAR;
}

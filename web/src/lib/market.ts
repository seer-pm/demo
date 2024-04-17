import { Market } from "@/hooks/useMarket";
import {
  REALITY_TEMPLATE_MULTIPLE_SELECT,
  REALITY_TEMPLATE_SINGLE_SELECT,
  REALITY_TEMPLATE_UINT,
  isFinalized,
} from "./reality";
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
  CATEGORICAL = "categorical",
  SCALAR = "scalar",
  MULTI_CATEGORICAL = "multi_categorical",
  MULTI_SCALAR = "multi_scalar",
}

export function getTemplateByMarketType(marketType: MarketTypes) {
  return {
    [MarketTypes.CATEGORICAL]: REALITY_TEMPLATE_SINGLE_SELECT,
    [MarketTypes.SCALAR]: REALITY_TEMPLATE_UINT,
    [MarketTypes.MULTI_CATEGORICAL]: REALITY_TEMPLATE_MULTIPLE_SELECT,
    [MarketTypes.MULTI_SCALAR]: REALITY_TEMPLATE_UINT,
  }[marketType];
}

export function getMarketType(market: Market): MarketTypes {
  if (market.templateId === BigInt(REALITY_TEMPLATE_SINGLE_SELECT)) {
    return MarketTypes.CATEGORICAL;
  }

  if (market.templateId === BigInt(REALITY_TEMPLATE_MULTIPLE_SELECT)) {
    return MarketTypes.MULTI_CATEGORICAL;
  }

  if (market.questions.length > 1) {
    return MarketTypes.MULTI_SCALAR;
  }

  return MarketTypes.SCALAR;
}

export function hasOutcomes(marketType: MarketTypes) {
  return (
    marketType === MarketTypes.CATEGORICAL ||
    marketType === MarketTypes.MULTI_CATEGORICAL ||
    marketType === MarketTypes.MULTI_SCALAR
  );
}

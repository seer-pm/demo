import { formatInTimeZone } from "https://esm.sh/date-fns-tz@3.1.3";
import { fromUnixTime } from "https://esm.sh/date-fns@3.0.0";
import { REALITY_TEMPLATE_MULTIPLE_SELECT, REALITY_TEMPLATE_SINGLE_SELECT } from "./constants.ts";
import { Market, MarketStatus, Question } from "./types.ts";

export function isQuestionOpen(question: Question) {
  const now = Math.round(new Date().getTime() / 1000);

  return question.opening_ts < now;
}

export function isQuestionUnanswered(question: Question) {
  return question.finalize_ts === 0;
}

export function isQuestionInDispute(question: Question) {
  return question.is_pending_arbitration;
}

export function isQuestionPending(question: Question) {
  return question.finalize_ts === 0 || !isFinalized(question);
}
export function hasOpenQuestions(market: Market) {
  // all the questions have the same opening_ts so we can use the first one to check it
  return isQuestionOpen(market.questions[0]);
}

export function hasAllUnansweredQuestions(market: Market) {
  return market.questions.every((question) => isQuestionUnanswered(question));
}

export function isInDispute(market: Market) {
  return market.questions.some((question) => isQuestionInDispute(question));
}

export function isWaitingResults(market: Market) {
  return market.questions.some((question) => isQuestionPending(question));
}
export function isFinalized(question: Question) {
  const finalizeTs = Number(question.finalize_ts);
  return !question.is_pending_arbitration && finalizeTs > 0 && new Date().getTime() >= finalizeTs * 1000;
}
export function getOpeningTime(market: Market) {
  return `${formatDate(market.questions[0].opening_ts)} UTC`;
}

export function getClosingTime(market: Market) {
  return new Date(market.questions[0].opening_ts * 1000).toUTCString();
}

export function formatDate(timestamp: number) {
  const date = fromUnixTime(timestamp);
  return formatInTimeZone(date, "UTC", "MMMM d yyyy, HH:mm");
}

export enum MarketTypes {
  CATEGORICAL = "categorical",
  SCALAR = "scalar",
  MULTI_CATEGORICAL = "multi_categorical",
  MULTI_SCALAR = "multi_scalar",
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

export const getQuestionStatus = (question: Question) => {
  if (!isQuestionOpen(question)) {
    return MarketStatus.NOT_OPEN;
  }

  if (isQuestionUnanswered(question)) {
    return MarketStatus.OPEN;
  }

  if (isQuestionInDispute(question)) {
    return MarketStatus.IN_DISPUTE;
  }

  if (isQuestionPending(question)) {
    return MarketStatus.ANSWER_NOT_FINAL;
  }

  return MarketStatus.CLOSED;
};

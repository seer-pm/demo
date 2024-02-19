import { Market } from "@/hooks/useMarket";
import { isFinalized } from "./reality";

export function isOpen(market: Market) {
  const now = Math.round(new Date().getTime() / 1000);

  // all the questions have the same opening_ts so we can use the first one to check it
  return market.questions[0].opening_ts > now;
}

export function isWaitingResults(market: Market) {
  return market.questions.some((question) => {
    return question.finalize_ts === 0 || !isFinalized(question);
  });
}

export function getClosingTime(market: Market) {
  return new Date(market.questions[0].opening_ts * 1000).toUTCString();
}

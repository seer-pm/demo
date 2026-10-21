import { type Market, MarketStatus, MarketTypes } from "@seer-pm/sdk";

export const MARKET_SIGNAL_LABELS: Record<MarketTypes, string> = {
  [MarketTypes.CATEGORICAL]: "Single outcome",
  [MarketTypes.SCALAR]: "Numeric estimate",
  [MarketTypes.MULTI_CATEGORICAL]: "Multiple winners",
  [MarketTypes.MULTI_SCALAR]: "Relative values",
};

export const MARKET_SIGNAL_DESCRIPTIONS: Record<MarketTypes, string> = {
  [MarketTypes.CATEGORICAL]:
    "Prices imply the market's estimated probability of each outcome. The winning outcome pays 1.",
  [MarketTypes.SCALAR]:
    "Prices imply a numeric estimate within the market's range. Payouts depend on the resolved value.",
  [MarketTypes.MULTI_CATEGORICAL]:
    "Prices reflect expected shares of the payout. Multiple outcomes can win and split the payout.",
  [MarketTypes.MULTI_SCALAR]:
    "Prices reflect each outcome's share of the total resolved value, rather than separate probabilities.",
};

export const MARKET_STATUS_LABELS: Record<MarketStatus, string> = {
  [MarketStatus.NOT_OPEN]: "Resolution not open",
  [MarketStatus.OPEN]: "Resolution open",
  [MarketStatus.ANSWER_NOT_FINAL]: "Answer under review",
  [MarketStatus.IN_DISPUTE]: "In dispute",
  [MarketStatus.PENDING_EXECUTION]: "Awaiting settlement",
  [MarketStatus.CLOSED]: "Settled",
};

/** A shared date is shown only when every outcome opens for reporting at the same time. */
export function getResolutionOpening(market: Market): number | undefined {
  const timestamp = market.questions[0]?.opening_ts;
  if (!timestamp || !market.questions.every((question) => question.opening_ts === timestamp)) return undefined;
  return timestamp;
}

export function formatResolutionDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

import type { Address } from "viem";
import { zeroAddress } from "viem";
import type { Market } from "./market-types";
import { MarketStatus } from "./market-types";
import {
  REALITY_TEMPLATE_MULTIPLE_SELECT,
  REALITY_TEMPLATE_SINGLE_SELECT,
  REALITY_TEMPLATE_UINT,
  decodeQuestion,
  displayScalarBound,
  escapeJson,
  isQuestionInDispute,
  isQuestionOpen,
  isQuestionPending,
  isQuestionUnanswered,
} from "./reality";
export { unescapeJson } from "./reality";

/** Outcome string from MarketView for the invalid outcome. */
export const INVALID_RESULT_OUTCOME = "Invalid result";

/** Display text for the invalid outcome. */
export const INVALID_RESULT_OUTCOME_TEXT = "Invalid";

export enum MarketTypes {
  CATEGORICAL = "categorical",
  SCALAR = "scalar",
  MULTI_CATEGORICAL = "multi_categorical",
  MULTI_SCALAR = "multi_scalar",
}

/** Returns the canonical market name, appending the unit for scalar‑type markets. */
export function getMarketName(marketType: MarketTypes, marketName: string, unit: string): string {
  return [MarketTypes.SCALAR, MarketTypes.MULTI_SCALAR].includes(marketType) && unit.trim()
    ? `${escapeJson(marketName)} [${escapeJson(unit)}]`
    : escapeJson(marketName);
}

/**
 * Extracts the question prefix, suffix and outcome type for multi‑scalar markets.
 *
 * Returns `undefined` when the market name does not follow the expected bracketed format.
 */
export function getQuestionParts(
  marketName: string,
  marketType: MarketTypes,
): { questionStart: string; questionEnd: string; outcomeType: string } | undefined {
  if (marketType !== MarketTypes.MULTI_SCALAR) {
    return { questionStart: "", questionEnd: "", outcomeType: "" };
  }

  const parts = marketName.split(/\[|\]/);

  if (parts.length !== 3 && parts.length !== 5) {
    return undefined;
  }

  if (parts.length === 5) {
    const unitRegex = /\?\s*\[[^\]]+\]$/;
    if (!unitRegex.test(marketName)) {
      return undefined;
    }
  }

  if (marketName.indexOf("[") > marketName.indexOf("]")) {
    return undefined;
  }

  const [questionStart, outcomeType, questionEnd] = parts;
  if (!questionEnd?.trim() || !outcomeType?.trim()) {
    return undefined;
  }

  if (parts.length === 5) {
    return { questionStart, questionEnd: `${questionEnd}[${parts[3]}]`, outcomeType };
  }

  return { questionStart, questionEnd, outcomeType };
}

/** Normalizes outcomes for scalar markets while preserving the original array for other types. */
export function getOutcomes(outcomes: string[], marketType: MarketTypes): string[] {
  if (marketType === MarketTypes.SCALAR) {
    return ["DOWN", "UP", ...outcomes.slice(2)];
  }
  return outcomes;
}

/** Returns the unit encoded in the market name (e.g. "seats"), or an empty string when not present. */
export function getMarketUnit(market: Market): string {
  const marketName = market.marketName;
  if (marketName.lastIndexOf("[") > -1) {
    return `${marketName.slice(marketName.lastIndexOf("[") + 1, marketName.lastIndexOf("]"))}`;
  }
  return "";
}

/**
 * Infers the {@link MarketTypes} from the Reality template id and number of questions.
 *
 * NOTE: Reality templates use:
 * - 2: single-select (categorical)
 * - 3: multiple-select (multi-categorical)
 */
export function getMarketType(market: Market): MarketTypes {
  if (market.templateId === 2n) {
    return MarketTypes.CATEGORICAL;
  }

  if (market.templateId === 3n) {
    return MarketTypes.MULTI_CATEGORICAL;
  }

  if (market.questions.length > 1) {
    return MarketTypes.MULTI_SCALAR;
  }

  return MarketTypes.SCALAR;
}

/** Returns whether the given market type exposes discrete outcomes. */
export function hasOutcomes(marketType: MarketTypes): boolean {
  return (
    marketType === MarketTypes.CATEGORICAL ||
    marketType === MarketTypes.MULTI_CATEGORICAL ||
    marketType === MarketTypes.MULTI_SCALAR
  );
}

/**
 * Returns true when the given outcome index corresponds to the synthetic "Invalid" outcome.
 *
 * Only generic markets reserve the last wrapped token for the invalid outcome.
 */
export function isInvalidOutcome(market: Market, outcomeIndex: number): boolean {
  const hasInvalidOutcome = market.type === "Generic";
  return hasInvalidOutcome && outcomeIndex === market.wrappedTokens.length - 1;
}

/**
 * Estimates an absolute value for multi‑scalar markets from percentage odds.
 *
 * Uses hard‑coded upper bounds for some known markets and falls back to the on‑chain bound and unit.
 */
export function getMultiScalarEstimate(market: Market, odds: number | null): { value: number; unit: string } | null {
  // Fixed upper bounds and units for specific market addresses
  const UPPER_BOUNDS: Record<Address, [number, string]> = {
    "0x1c21c59cd3b33be95a5b07bd7625b5f6d8024a76": [343, "seats"],
    "0xabe35cf0953169d9384f5953633f02996b4802f9": [577, "seats"],
    "0xbfea94c611fbe8a5353eddd94e025a2b3ad425d3": [128, "seats"],
  };

  if (odds === null) {
    return null;
  }

  const [upperBound, unit] = UPPER_BOUNDS[market.id] || [displayScalarBound(market.upperBound), getMarketUnit(market)];

  if (upperBound <= 0 || unit === "") {
    return null;
  }

  return {
    value: Math.round((upperBound * Number(odds)) / 100),
    unit,
  };
}

/**
 * Calculates the redeemed price for a specific outcome token.
 *
 * For parent/child markets, this combines the child payout with the parent payout.
 */
export function getRedeemedPrice(market: Market, tokenIndex: number): number {
  // If the market hasn't reported payouts yet, return 0
  if (!market.payoutReported) {
    return 0;
  }

  // Calculate the total sum of all payout numerators for this market
  const sumPayout = market.payoutNumerators.reduce((acc, curr) => acc + Number(curr), 0);

  if (sumPayout === 0) {
    return 0;
  }

  // Check if this is a standalone market (no parent market)
  const isRootMarket = market.parentMarket.id.toLowerCase() === (zeroAddress as string).toLowerCase();

  if (isRootMarket) {
    // Return the ratio of this outcome's payout to total payouts
    return Number(market.payoutNumerators[tokenIndex]) / sumPayout;
  }

  // For child markets, check if the parent market has reported payouts and this outcome is winning
  const parentPayoutNumerators = market.parentMarket.payoutNumerators;
  const parentOutcomeIndex = Number(market.parentOutcome);
  const isParentPayout = market.parentMarket.payoutReported && parentPayoutNumerators[parentOutcomeIndex] > 0n;

  if (isParentPayout) {
    // Calculate total payouts for the parent market
    const sumParentPayout = parentPayoutNumerators.reduce((acc, curr) => acc + Number(curr), 0);

    if (sumParentPayout === 0) {
      return 0;
    }

    // Calculate the payout price for this specific outcome in the child market
    const payoutPrice = Number(market.payoutNumerators[tokenIndex]) / sumPayout;

    // Calculate the payout price for the parent market outcome
    const parentPayoutPrice = Number(parentPayoutNumerators[parentOutcomeIndex]) / sumParentPayout;

    // Return the combined payout: child market outcome price × parent market outcome price
    return payoutPrice * parentPayoutPrice;
  }

  // If parent market hasn't reported payouts or this outcome isn't winning, return 0
  return 0;
}

/**
 * Returns true if the market's first question is open.
 *
 * All market questions share the same opening timestamp, so checking the first one is enough.
 */
export function hasOpenQuestions(market: Market): boolean {
  return isQuestionOpen(market.questions[0]);
}

/** Returns true if every question in the market is still unanswered. */
export function hasAllUnansweredQuestions(market: Market): boolean {
  return market.questions.every((question) => isQuestionUnanswered(question));
}

/** Returns true if at least one question in the market is in dispute. */
export function isInDispute(market: Market): boolean {
  return market.questions.some((question) => isQuestionInDispute(question));
}

/** Returns true if at least one question in the market is pending results. */
export function isWaitingResults(market: Market): boolean {
  return market.questions.some((question) => isQuestionPending(question));
}

/** Human‑readable closing time for the market (UTC). */
export function getClosingTime(market: Market): string {
  return new Date(market.questions[0].opening_ts * 1000).toUTCString();
}

/** Maps {@link MarketTypes} to the corresponding Reality.eth template id. */
export function getTemplateByMarketType(marketType: MarketTypes): number {
  return {
    [MarketTypes.CATEGORICAL]: REALITY_TEMPLATE_SINGLE_SELECT,
    [MarketTypes.SCALAR]: REALITY_TEMPLATE_UINT,
    [MarketTypes.MULTI_CATEGORICAL]: REALITY_TEMPLATE_MULTIPLE_SELECT,
    [MarketTypes.MULTI_SCALAR]: REALITY_TEMPLATE_UINT,
  }[marketType];
}

/**
 * Heuristic to determine whether a market configuration is considered reliable.
 *
 * For scalar markets there is nothing to validate. For multi‑scalar markets we verify that the
 * encoded question text preserves the same question prefix/suffix (only the outcome type varies).
 * For categorical markets we validate that the encoded outcomes count matches the market outcomes.
 */
export function isMarketReliable(market: Market): boolean {
  if (getMarketType(market) === MarketTypes.SCALAR) {
    return true;
  }

  if (getMarketType(market) === MarketTypes.MULTI_SCALAR) {
    const result = /(?<questionStart>.*?)\[(?<outcomeType>.*?)\](?<questionEnd>.*)/.exec(market.marketName);

    if (result === null) {
      return false;
    }

    const { questionStart, questionEnd } = result.groups as {
      questionStart: string;
      questionEnd: string;
      outcomeType: string;
    };

    return market.encodedQuestions.every((encodedQuestion) => {
      const decodedQuestion = decodeQuestion(encodedQuestion);

      return decodedQuestion.question.startsWith(questionStart) && decodedQuestion.question.endsWith(questionEnd);
    });
  }

  // Categorical & multi‑categorical markets
  return market.encodedQuestions.every((encodedQuestion) => {
    const decodedQuestion = decodeQuestion(encodedQuestion);

    if (decodedQuestion.outcomes === undefined) {
      return false;
    }

    const hasInvalidOutcome = market.type === "Generic";

    if (hasInvalidOutcome) {
      // -1 to exclude the INVALID outcome
      return decodedQuestion.outcomes.length === market.outcomes.length - 1;
    }

    // Futarchy markets have 2 outcomes (Yes & No)
    return decodedQuestion.outcomes.length === 2;
  });
}

/** Derives the aggregate {@link MarketStatus} for a market from its questions and payout status. */
export function getMarketStatus(market: Market): MarketStatus {
  if (!hasOpenQuestions(market)) {
    return MarketStatus.NOT_OPEN;
  }

  if (hasAllUnansweredQuestions(market)) {
    return MarketStatus.OPEN;
  }

  if (isInDispute(market)) {
    return MarketStatus.IN_DISPUTE;
  }

  if (isWaitingResults(market)) {
    return MarketStatus.ANSWER_NOT_FINAL;
  }

  if (!market.payoutReported) {
    return MarketStatus.PENDING_EXECUTION;
  }

  return MarketStatus.CLOSED;
}

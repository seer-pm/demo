import type { Address } from "viem";
import { zeroAddress } from "viem";
import type { Market } from "./market-types";
import { displayScalarBound, escapeJson } from "./reality";

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

export function getMarketName(marketType: MarketTypes, marketName: string, unit: string): string {
  return [MarketTypes.SCALAR, MarketTypes.MULTI_SCALAR].includes(marketType) && unit.trim()
    ? `${escapeJson(marketName)} [${escapeJson(unit)}]`
    : escapeJson(marketName);
}

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

export function getOutcomes(outcomes: string[], marketType: MarketTypes): string[] {
  if (marketType === MarketTypes.SCALAR) {
    return ["DOWN", "UP", ...outcomes.slice(2)];
  }
  return outcomes;
}

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

export function hasOutcomes(marketType: MarketTypes): boolean {
  return (
    marketType === MarketTypes.CATEGORICAL ||
    marketType === MarketTypes.MULTI_CATEGORICAL ||
    marketType === MarketTypes.MULTI_SCALAR
  );
}

export function isInvalidOutcome(market: Market, outcomeIndex: number): boolean {
  const hasInvalidOutcome = market.type === "Generic";
  return hasInvalidOutcome && outcomeIndex === market.wrappedTokens.length - 1;
}

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

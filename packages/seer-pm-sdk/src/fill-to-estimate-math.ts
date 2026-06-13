import { getMarketEstimate, isOdd, rescaleOdds } from "./market-odds";
import type { Market } from "./market-types";
import { displayScalarBound } from "./reality";

export const FILL_TO_ESTIMATE_PRICE_TOLERANCE = 0.001;
export const FILL_TO_ESTIMATE_EPSILON = 0.01;

export type TargetOddsResult =
  | { ok: true; odds0: number; odds1: number; targetPrices: [number, number] }
  | { ok: false; reason: string };

export function estimateFromOdds(odds0: number, odds1: number, market: Market): number {
  const estimate = getMarketEstimate([odds0, odds1], market);
  return typeof estimate === "number" ? estimate : Number.NaN;
}

export function targetOddsFromEstimate(targetEstimate: number, market: Market): TargetOddsResult {
  const lowerBound = displayScalarBound(market.lowerBound);
  const upperBound = displayScalarBound(market.upperBound);

  if (lowerBound === upperBound) {
    return { ok: false, reason: "Market bounds must differ" };
  }
  if (targetEstimate < lowerBound || targetEstimate > upperBound) {
    return {
      ok: false,
      reason: `Target must be between ${lowerBound} and ${upperBound}`,
    };
  }

  const odds0 = (100 * (targetEstimate - upperBound)) / (lowerBound - upperBound);
  const odds1 = 100 - odds0;

  if (odds0 < 0 || odds1 < 0 || odds0 > 100 || odds1 > 100) {
    return { ok: false, reason: "Target estimate maps to invalid odds" };
  }

  return {
    ok: true,
    odds0,
    odds1,
    targetPrices: [odds0 / 100, odds1 / 100],
  };
}

export function getCurrentEstimateFromOdds(odds: number[], market: Market): number | null {
  if (!isOdd(odds[0]) || !isOdd(odds[1])) {
    return null;
  }
  const estimate = getMarketEstimate(odds, market);
  return typeof estimate === "number" ? estimate : null;
}

export function simulateEstimateFromPrices(prices: [number, number], market: Market): number {
  const odds = rescaleOdds(prices.map((price) => price * 100));
  return estimateFromOdds(odds[0], odds[1], market);
}

export function isEstimateReached(current: number, target: number, epsilon = FILL_TO_ESTIMATE_EPSILON): boolean {
  return Math.abs(current - target) <= epsilon;
}

export function isPriceReached(
  currentPrice: number,
  targetPrice: number,
  tolerance = FILL_TO_ESTIMATE_PRICE_TOLERANCE,
): boolean {
  return Math.abs(currentPrice - targetPrice) <= tolerance;
}

export type PoolLegDirection = "buy" | "sell" | "skip";

export function getPoolLegDirection(
  currentPrice: number,
  targetPrice: number,
  tolerance = FILL_TO_ESTIMATE_PRICE_TOLERANCE,
): PoolLegDirection {
  if (isPriceReached(currentPrice, targetPrice, tolerance)) {
    return "skip";
  }
  return targetPrice > currentPrice ? "buy" : "sell";
}

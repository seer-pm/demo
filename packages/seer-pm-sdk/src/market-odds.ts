import type { Address } from "viem";
import { getMarketUnit } from "./market";
import type { Market } from "./market-types";
import { displayScalarBound } from "./reality";
import { getTokenPrice } from "./token-price";
import type { Token } from "./tokens";

const CEIL_PRICE = 1;

function formatOdds(prices: number[]): number[] {
  return prices.map((price) => (Number.isNaN(price) ? Number.NaN : Number((price * 100).toFixed(1))));
}

export function isOdd(odd: number | undefined | null): odd is number {
  return typeof odd === "number" && !Number.isNaN(odd);
}

export function rescaleOdds(odds: (number | null)[]): number[] {
  if (!odds.length) {
    return [];
  }

  const numericOdds = odds.map((odd) => (odd === null ? 0 : odd));

  const oddsSum = numericOdds.reduce((acc, curr) => {
    if (Number.isNaN(curr)) {
      return Number(acc);
    }
    return Number(acc) + Number(curr);
  }, 0);

  if (oddsSum > 100) {
    return numericOdds.map((odd) => Number(((odd / oddsSum) * 100).toFixed(1)));
  }

  return numericOdds;
}

export function normalizeOdds(prices: number[]): number[] {
  const filteredPrices = prices.map((price) => (price > CEIL_PRICE ? Number.NaN : price));
  return formatOdds(filteredPrices);
}

/**
 * Prices Invalid as the complement of the other outcomes: a complete set redeems for exactly one
 * collateral, so `1 - sum(other prices)` is what Invalid is worth, and it needs no pool of its own.
 * Undefined while any other outcome has no price; pinned at 0 when the others already sum past 1.
 * Only Generic markets carry an Invalid outcome (always the last wrapped token).
 */
export function withInvalidPriceAsComplement(
  market: Pick<Market, "type" | "wrappedTokens">,
  prices: number[],
): number[] {
  if (market.type !== "Generic" || prices.length !== market.wrappedTokens.length || prices.length < 2) {
    return prices;
  }
  const others = prices.slice(0, -1);
  const invalidPrice = others.some((price) => Number.isNaN(price))
    ? Number.NaN
    : Math.max(0, 1 - others.reduce((sum, price) => sum + price, 0));
  return [...others, invalidPrice];
}

export async function getMarketOdds(market: Market, hasLiquidity: boolean): Promise<number[]> {
  if (!hasLiquidity || market.type === "Futarchy") {
    return Array(market.wrappedTokens.length).fill(Number.NaN);
  }

  const collateralToken: Token = {
    address: market.collateralToken as Address,
    chainId: market.chainId,
    decimals: 18,
    symbol: "",
  };

  const prices = await Promise.all(
    market.wrappedTokens.map((wrappedAddress) => getTokenPrice(wrappedAddress, collateralToken, market.chainId)),
  );

  return normalizeOdds(withInvalidPriceAsComplement(market, prices));
}

export function getMarketEstimate(odds: (number | null)[], market: Market, convertToString?: boolean): number | string {
  const { lowerBound, upperBound } = market;
  if (!isOdd(odds[0]) || !isOdd(odds[1])) {
    return "NA";
  }
  const scaledOdds = rescaleOdds(odds);

  const estimate =
    (scaledOdds[0] * displayScalarBound(lowerBound) + scaledOdds[1] * displayScalarBound(upperBound)) / 100;

  if (!convertToString) {
    return estimate;
  }
  const marketUnit = getMarketUnit(market);
  if (marketUnit) {
    return `${Number(estimate).toLocaleString()} ${marketUnit}`;
  }
  return Number(estimate).toLocaleString();
}

import { type Address, zeroAddress } from "viem";
import { getDefaultCollateralProfile } from "./collateral";
import { getMarketUnit } from "./market";
import type { Market } from "./market-types";
import { isTwoStringsEqual } from "./quote-utils";
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

function asCollateral(address: Address, chainId: number): Token {
  return { address, chainId, decimals: 18, symbol: "" };
}

/**
 * Odds from the pool prices in the market collateral. On a child market that collateral is the parent
 * outcome token; an outcome with no pool against it is priced from its main-collateral pool instead,
 * as an absolute price rather than one conditional on the parent outcome. That needs no price for the
 * parent token, which the "Other" of a chained market never has. The parent pool keeps precedence, the
 * same rule the backend applies.
 */
export async function getMarketOdds(market: Market, hasLiquidity: boolean): Promise<number[]> {
  if (!hasLiquidity || market.type === "Futarchy") {
    return Array(market.wrappedTokens.length).fill(Number.NaN);
  }

  const collateralToken = asCollateral(market.collateralToken as Address, market.chainId);

  const prices = await Promise.all(
    market.wrappedTokens.map((wrappedAddress) => getTokenPrice(wrappedAddress, collateralToken, market.chainId)),
  );

  const mainCollateral = getDefaultCollateralProfile(market.chainId).primary;
  // The swap quoter behind `getTokenPrice` reports a missing route as 0, not NaN.
  const unpriced = prices.map((price, i) => (Number.isNaN(price) || price === 0 ? i : -1)).filter((i) => i >= 0);
  if (
    unpriced.length > 0 &&
    market.parentMarket.id !== zeroAddress &&
    !isTwoStringsEqual(mainCollateral.address, market.collateralToken)
  ) {
    await Promise.all(
      unpriced.map(async (i) => {
        prices[i] = await getTokenPrice(market.wrappedTokens[i], mainCollateral, market.chainId);
      }),
    );
  }

  return normalizeOdds(prices);
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

import { type Address, zeroAddress } from "viem";
import { getDefaultCollateralProfile } from "./collateral";
import { tickToPrice } from "./liquidity-utils";
import { getMarketUnit } from "./market";
import { getMarketAllPoolsPairs, getOutcomePoolPairs, getTokensPairKey } from "./market-pools";
import type { Market } from "./market-types";
import { isTwoStringsEqual } from "./quote-utils";
import { displayScalarBound } from "./reality";
import { getPoolsStateFromSubgraph } from "./subgraph";
import { getTokenPriceFromSwap } from "./token-price";
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

export type OutcomePricePool = { token0: Address; token1: Address; liquidity: bigint; tick: number | null };

/**
 * Spot price of every outcome from the market's pools, in the collateral of the pool that prices it.
 *
 * Each outcome takes the first pair of `getOutcomePoolPairs` that has a pool with liquidity and a tick:
 * the market collateral pair, then on a child market the main collateral pair, as an absolute price
 * rather than one conditional on the parent outcome. An empty pool is skipped rather than priced,
 * because its tick is the price it was initialized at, not one anybody can trade at. Several pools of a
 * pair (fee tiers) resolve to the deepest one. NaN where no pool prices the outcome.
 */
export function getOutcomePricesFromPools(market: Market, pools: OutcomePricePool[]): number[] {
  const deepestByPair = new Map<string, OutcomePricePool>();
  for (const pool of pools) {
    if (pool.liquidity <= 0n || pool.tick === null) {
      continue;
    }
    const key = getTokensPairKey(pool.token0, pool.token1);
    const current = deepestByPair.get(key);
    if (!current || pool.liquidity > current.liquidity) {
      deepestByPair.set(key, pool);
    }
  }

  return market.wrappedTokens.map((outcomeToken, outcomeIndex) => {
    for (const pair of getOutcomePoolPairs(market, outcomeIndex)) {
      const pool = deepestByPair.get(getTokensPairKey(pair.token0, pair.token1));
      if (!pool) {
        continue;
      }
      // Full precision: the default form rounds to four decimals, which turns a cheap outcome into a
      // 0 that reads as a valid pool price and skips the swap-quote fallback.
      const [price0, price1] = tickToPrice(pool.tick as number, 18, true);
      return isTwoStringsEqual(pool.token0, outcomeToken) ? Number(price0) : Number(price1);
    }
    return Number.NaN;
  });
}

/**
 * Odds from the pool prices in the market collateral. On a child market that collateral is the parent
 * outcome token; an outcome with no pool against it is priced from its main-collateral pool instead,
 * as an absolute price rather than one conditional on the parent outcome. That needs no price for the
 * parent token, which the "Other" of a chained market never has. The parent pool keeps precedence, the
 * same rule the backend applies.
 *
 * The pools come from the subgraph in a single request (see `getPoolsStateFromSubgraph`). Only an
 * outcome the subgraph cannot price falls back to the swap quoter, in the same precedence.
 */
export async function getMarketOdds(market: Market, hasLiquidity: boolean): Promise<number[]> {
  if (!hasLiquidity || market.type === "Futarchy") {
    return Array(market.wrappedTokens.length).fill(Number.NaN);
  }

  let pools: OutcomePricePool[] = [];
  try {
    pools = await getPoolsStateFromSubgraph(getMarketAllPoolsPairs(market), market.chainId);
  } catch (e) {
    console.error(e);
  }
  const prices = getOutcomePricesFromPools(market, pools);

  const collateralToken = asCollateral(market.collateralToken as Address, market.chainId);
  const mainCollateral = getDefaultCollateralProfile(market.chainId).primary;
  const quoteMainCollateral =
    market.parentMarket.id !== zeroAddress && !isTwoStringsEqual(mainCollateral.address, market.collateralToken);

  await Promise.all(
    prices.map(async (price, i) => {
      if (!Number.isNaN(price)) {
        return;
      }
      prices[i] = await getTokenPriceFromSwap(market.wrappedTokens[i], collateralToken, market.chainId);
      // The swap quoter reports a missing route as 0, not NaN.
      if (quoteMainCollateral && (Number.isNaN(prices[i]) || prices[i] === 0)) {
        prices[i] = await getTokenPriceFromSwap(market.wrappedTokens[i], mainCollateral, market.chainId);
      }
    }),
  );

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

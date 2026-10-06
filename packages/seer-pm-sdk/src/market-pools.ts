import { type Address, zeroAddress } from "viem";
import { getDefaultCollateralProfile } from "./collateral";
import type { Market } from "./market-types";

export function getCollateralByIndex(market: Market, index: number): Address {
  if (market.type === "Generic") {
    return market.collateralToken;
  }
  return index < 2 ? market.collateralToken1 : market.collateralToken2;
}

export type Token0Token1 = { token1: Address; token0: Address };

export function getToken0Token1(token0: Address, token1: Address): Token0Token1 {
  return token0.toLocaleLowerCase() > token1.toLocaleLowerCase()
    ? { token0: token1.toLocaleLowerCase() as Address, token1: token0.toLocaleLowerCase() as Address }
    : { token0: token0.toLocaleLowerCase() as Address, token1: token1.toLocaleLowerCase() as Address };
}

export function getTokensPairKey(tokenA: Address | string, tokenB: Address | string): string {
  const { token0, token1 } = getToken0Token1(tokenA as Address, tokenB as Address);
  return `${token0}-${token1}`;
}

// outcome0 pairs with outcome2
// outcome1 pairs with outcome3
// outcome2 pairs with outcome0
// outcome3 pairs with outcome1
export const FUTARCHY_LP_PAIRS_MAPPING = [2, 3, 0, 1];

export function getLiquidityPair(market: Market, outcomeIndex: number): Token0Token1 {
  if (market.type === "Generic") {
    return getToken0Token1(market.wrappedTokens[outcomeIndex], market.collateralToken);
  }

  return getToken0Token1(
    market.wrappedTokens[outcomeIndex],
    market.wrappedTokens[FUTARCHY_LP_PAIRS_MAPPING[outcomeIndex]],
  );
}

export function getMarketPoolsPairs(market: Market): Token0Token1[] {
  const pools = new Set<Token0Token1>();
  const tokens = market.type === "Generic" ? market.wrappedTokens : market.wrappedTokens.slice(0, 2);
  tokens.forEach((_, index) => {
    pools.add(getLiquidityPair(market, index));
  });
  return [...pools];
}

/**
 * Every pool pair an outcome can trade in, the market collateral pair first.
 *
 * A child market's collateral is the parent's outcome token, so a child outcome may also hold a pool
 * against the chain's main collateral (sDAI, sUSDS): that pool prices it in absolute terms and needs
 * no parent pool to be worth anything. The order is a precedence: liquidity is summed over every pair,
 * but a price (odds, open interest) comes from the first pair that has a pool, because that is the pair
 * the swap widget quotes through and the one every existing market already uses.
 */
export function getOutcomePoolPairs(market: Market, outcomeIndex: number): Token0Token1[] {
  const pairs = [getLiquidityPair(market, outcomeIndex)];
  if (market.type !== "Generic" || market.parentMarket.id === zeroAddress) {
    return pairs;
  }
  const mainCollateral = getDefaultCollateralProfile(market.chainId).primary.address;
  if (mainCollateral.toLowerCase() === market.collateralToken.toLowerCase()) {
    return pairs;
  }
  pairs.push(getToken0Token1(market.wrappedTokens[outcomeIndex], mainCollateral));
  return pairs;
}

export type PoolLiquidity = { token0: Address; token1: Address; liquidity: bigint };

export type OutcomeSwapCollaterals = {
  /** Collateral addresses the outcome can be swapped against, the market collateral first. */
  options: Address[];
  /** The first option whose pool holds liquidity, or the market collateral when none does. */
  defaultCollateral: Address;
};

/**
 * Collaterals the swap widget can trade `outcomeIndex` in, from the pools fetched for the outcome.
 *
 * The market collateral is always offered: it is the token the outcome redeems to and the one every
 * existing market trades in. On a child Generic market the main collateral (sDAI, sUSDS) is offered only
 * when one of its pools holds liquidity, because the quoter has no route through an empty or missing pool
 * and the option would only produce a "no liquidity" error. The default follows the same precedence as
 * the odds: the parent pool when it has liquidity, the main collateral pool otherwise.
 */
export function getOutcomeSwapCollaterals(
  market: Market,
  outcomeIndex: number,
  pools: PoolLiquidity[],
): OutcomeSwapCollaterals {
  const outcomeToken = market.wrappedTokens[outcomeIndex].toLowerCase();
  const liquidityByPair = new Map<string, bigint>();
  for (const pool of pools) {
    const key = getTokensPairKey(pool.token0, pool.token1);
    const current = liquidityByPair.get(key) ?? 0n;
    liquidityByPair.set(key, pool.liquidity > current ? pool.liquidity : current);
  }

  const options: Address[] = [];
  let defaultCollateral: Address | undefined;
  getOutcomePoolPairs(market, outcomeIndex).forEach((pair, index) => {
    const collateral = pair.token0 === outcomeToken ? pair.token1 : pair.token0;
    const hasLiquidity = (liquidityByPair.get(getTokensPairKey(pair.token0, pair.token1)) ?? 0n) > 0n;
    if (index > 0 && !hasLiquidity) {
      return;
    }
    options.push(collateral);
    if (hasLiquidity && defaultCollateral === undefined) {
      defaultCollateral = collateral;
    }
  });

  return { options, defaultCollateral: defaultCollateral ?? options[0] };
}

/**
 * Every pool pair of the market, deduplicated. Not aligned with the outcome index, unlike
 * `getMarketPoolsPairs`: use it where the pairs are a set (which pools to fetch), not a per-outcome list.
 */
export function getMarketAllPoolsPairs(market: Market): Token0Token1[] {
  const byKey = new Map<string, Token0Token1>();
  const tokens = market.type === "Generic" ? market.wrappedTokens : market.wrappedTokens.slice(0, 2);
  tokens.forEach((_, index) => {
    for (const pair of getOutcomePoolPairs(market, index)) {
      byKey.set(getTokensPairKey(pair.token0, pair.token1), pair);
    }
  });
  return [...byKey.values()];
}

export function getLiquidityPairForToken(market: Market, outcomeIndex: number): Address {
  if (market.type === "Generic") {
    return market.collateralToken;
  }

  return market.wrappedTokens[FUTARCHY_LP_PAIRS_MAPPING[outcomeIndex]];
}

import { type Token0Token1, getToken0Token1, getTokensPairKey } from "@seer-pm/sdk/market-pools";
import type { Address } from "viem";

/**
 * Spot price of one pool in both directions, in human units.
 *
 * DEX subgraphs name these the other way round from the raw sqrtPrice ratio (`token0Price` is
 * token0 *per token1*), so producers translate into these explicit names rather than passing
 * `token0Price` / `token1Price` through.
 */
export type PairMid = {
  token0PerToken1: number;
  token1PerToken0: number;
};

/** Keyed by `getTokensPairKey(token0, token1)`. */
export type PairMids = Map<string, PairMid>;

export type OutcomePriceToken = {
  tokenId: string;
  collateralToken: string;
  /** Set on conditional outcomes, which trade against a parent outcome token instead of the collateral. */
  parentMarketId?: string;
};

export function setPairMid(mids: PairMids, tokenA: string, tokenB: string, mid: PairMid): void {
  mids.set(getTokensPairKey(tokenA, tokenB), mid);
}

/** Price of `base` denominated in `quote`; 0 when the pair has no pool. */
export function getMid(mids: PairMids, base: string, quote: string): number {
  const mid = mids.get(getTokensPairKey(base, quote));
  if (!mid) {
    return 0;
  }
  const { token0 } = getToken0Token1(base as Address, quote as Address);
  const price = token0 === base.toLowerCase() ? mid.token1PerToken0 : mid.token0PerToken1;
  return Number.isFinite(price) ? price : 0;
}

/** Deduplicated outcome/counterparty pools to load prices for. */
export function outcomePairs(tokens: OutcomePriceToken[]): Token0Token1[] {
  const byKey = new Map<string, Token0Token1>();
  for (const { tokenId, collateralToken } of tokens) {
    const pair = getToken0Token1(tokenId as Address, collateralToken as Address);
    byKey.set(getTokensPairKey(pair.token0, pair.token1), pair);
  }
  return [...byKey.values()];
}

/**
 * Price of each outcome token in its market's collateral. Every input token gets an entry (0 when
 * the pool is unknown).
 *
 * A conditional outcome is quoted against its parent outcome token, so its absolute price is that
 * relative price times the parent's own price. The parent must itself be in `tokens` for that leg
 * to resolve; otherwise the conditional lands at 0.
 */
export function mapOutcomePrices(tokens: OutcomePriceToken[], mids: PairMids): Record<string, number> {
  const prices: Record<string, number> = {};

  for (const { tokenId, collateralToken, parentMarketId } of tokens) {
    if (parentMarketId !== undefined) continue;
    prices[tokenId.toLowerCase()] = getMid(mids, tokenId, collateralToken);
  }

  for (const { tokenId, collateralToken, parentMarketId } of tokens) {
    if (parentMarketId === undefined) continue;
    const relativePrice = getMid(mids, tokenId, collateralToken);
    prices[tokenId.toLowerCase()] = relativePrice * (prices[collateralToken.toLowerCase()] ?? 0);
  }

  return prices;
}

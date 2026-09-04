import { type Token0Token1, getToken0Token1, getTokensPairKey } from "@seer-pm/sdk/market-pools";
import type { Market } from "@seer-pm/sdk/market-types";
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

/** Whether a price is known for this pair at all — `getMid` cannot say, since it reports 0 for both. */
export function hasPairMid(mids: PairMids, tokenA: string, tokenB: string): boolean {
  return mids.has(getTokensPairKey(tokenA, tokenB));
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
 * Market-local payout ratio per outcome token, for every market that has already reported.
 *
 * Deliberately **not** `getRedeemedPrice`: that folds the parent's payout in, which is right for a
 * settled chain but wrong for a settled child of a market that is still open — it returns 0 there,
 * and the child's outcome is not worthless, it is still worth its share of a live parent token.
 * Keeping the ratio market-local lets `mapOutcomePrices` multiply the chain back together, and the
 * two agree wherever both apply.
 *
 * `asOfSeconds` restricts the result to markets that had already finalized by then, for pricing a
 * past moment: a payout reported last week says nothing about what an outcome was worth a month
 * ago, when it still traded. Omit it to price now. Same rule as `positionPriceAtReference`.
 */
export function settledPayoutRatios(markets: readonly Market[], asOfSeconds?: number): Record<string, number> {
  const ratios: Record<string, number> = {};

  for (const market of markets) {
    if (!market.payoutReported) continue;
    if (asOfSeconds !== undefined && !(market.finalizeTs > 0 && market.finalizeTs < asOfSeconds)) continue;

    const sumPayout = market.payoutNumerators.reduce((acc, payout) => acc + Number(payout), 0);
    if (sumPayout === 0) continue;

    (market.wrappedTokens ?? []).forEach((token, index) => {
      ratios[String(token).toLowerCase()] = Number(market.payoutNumerators[index] ?? 0n) / sumPayout;
    });
  }

  return ratios;
}

/**
 * Price of each outcome token in its market's collateral. Every input token gets an entry (0 when
 * the pool is unknown).
 *
 * A conditional outcome is quoted against its parent outcome token, so its absolute price is that
 * relative price times the parent's own price. The parent must itself be in `tokens` for that leg
 * to resolve; otherwise the conditional lands at 0.
 *
 * `settledRatioByToken` (see `settledPayoutRatios`) replaces the pool leg for tokens whose own
 * market has reported. It has to win over the mid rather than fall back to it (`??`, not `||`): a
 * settled market has no live pool, and a payout of **0** — a losing outcome — is exactly the value
 * that must survive. Because it replaces only the market-local leg, the parent chain still
 * multiplies through, which is what makes the three interesting cases come out right: a settled
 * parent that lost its branch contributes 0 and kills every descendant; a settled parent that won
 * contributes its payout instead of its dead pool; and a settled child of a still-open parent keeps
 * its share of the parent's live price.
 */
export function mapOutcomePrices(
  tokens: OutcomePriceToken[],
  mids: PairMids,
  settledRatioByToken?: Record<string, number>,
): Record<string, number> {
  const prices: Record<string, number> = {};
  const settled = (tokenId: string) => settledRatioByToken?.[tokenId.toLowerCase()];

  for (const { tokenId, collateralToken, parentMarketId } of tokens) {
    if (parentMarketId !== undefined) continue;
    prices[tokenId.toLowerCase()] = settled(tokenId) ?? getMid(mids, tokenId, collateralToken);
  }

  for (const { tokenId, collateralToken, parentMarketId } of tokens) {
    if (parentMarketId === undefined) continue;
    const relativePrice = settled(tokenId) ?? getMid(mids, tokenId, collateralToken);
    prices[tokenId.toLowerCase()] = relativePrice * (prices[collateralToken.toLowerCase()] ?? 0);
  }

  return prices;
}

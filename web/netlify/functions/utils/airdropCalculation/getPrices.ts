import { isTwoStringsEqual } from "@/lib/utils";
import { getToken0Token1 } from "@seer-pm/sdk/market-pools";
import type { Address } from "viem";
import type { PoolHourData } from "./getPoolHourDatas";

export type TokenPair = { tokenId: Address; parentTokenId?: Address; collateralToken: Address };

/** Pool state at one snapshot, keyed by `token0 + token1` (both lowercase, canonically ordered). */
export type PoolStateMap = Map<string, PoolHourData>;

/**
 * The newest candle at or before `startTime` for each pool.
 *
 * `poolHourDatas` is sorted by periodStartUnix desc, so the first entry seen per pool is the one we
 * want.
 *
 * Two deliberate limitations, both accepted rather than fixed:
 *
 *  - **No staleness bound.** A pool that last traded a year ago still supplies "the price". Bounding
 *    it would zero out holdings in markets that are simply illiquid but still valuable, which is
 *    worse than a stale quote. Much of the staleness that used to show up here was really the
 *    pagination bug in `fetchPoolHourDatasTimeRange` discarding candles; that is fixed.
 *  - **One entry per token pair, not per pool.** Uniswap can host several fee tiers for the same
 *    pair; whichever traded most recently wins. `dex_pool_hour_prices` stores no liquidity, so
 *    there is nothing to weight by. The `pool_id` tiebreak keeps the choice deterministic across
 *    runs instead of depending on row order.
 */
export function buildPoolStateAt(poolHourDatas: PoolHourData[], startTime: number): PoolStateMap {
  const resolvedMap: PoolStateMap = new Map();
  for (const entry of poolHourDatas) {
    if (Number(entry.periodStartUnix) > startTime) {
      continue;
    }
    const key = entry.pool.token0.id + entry.pool.token1.id;
    const existing = resolvedMap.get(key);
    if (!existing) {
      resolvedMap.set(key, entry);
      continue;
    }
    // Same hour from two fee tiers: pick deterministically rather than by arrival order.
    if (Number(entry.periodStartUnix) === Number(existing.periodStartUnix) && entry.pool.id < existing.pool.id) {
      resolvedMap.set(key, entry);
    }
  }
  return resolvedMap;
}

/** Price of `tokenId` denominated in `quoteId`, from the pool the two share. 0 when there is none. */
function relativePrice(poolState: PoolStateMap, tokenId: Address, quoteId: Address): number {
  const { token0, token1 } = getToken0Token1(tokenId, quoteId);
  const poolHourData = poolState.get(token0 + token1);
  if (!poolHourData) {
    return 0;
  }
  return isTwoStringsEqual(tokenId, token0) ? Number(poolHourData.token1Price) : Number(poolHourData.token0Price);
}

/**
 * Price of every token in collateral terms.
 *
 * Conditional outcome tokens trade against their PARENT outcome token, not against collateral, so
 * their collateral price is the product down the chain: price(child) = relative(child, parent) *
 * price(parent). This resolves that chain to any depth. The previous implementation handled exactly
 * one level — it looked the parent up in a map built only from non-conditional tokens, so a token
 * whose parent was itself conditional fell through to `|| 0` and the whole position priced at zero.
 *
 * Cycles cannot occur in well-formed market data but are guarded anyway: a token caught mid-
 * resolution resolves to 0 rather than recursing forever.
 *
 * Prices are in COLLATERAL terms, not USD. sDAI (gnosis/mainnet) and sUSDS (optimism/base) are
 * summed 1:1 across chains by the caller; both are ~$1 yield-bearing stables, so the error is the
 * drift between their accrued yields. Accepted deliberately — a real fix needs per-timestamp USD
 * rates that are not ingested anywhere.
 */
export function computePrices(
  poolHourDatas: PoolHourData[],
  tokens: TokenPair[] | undefined,
  startTime: number,
): { [tokenId: string]: number } {
  if (!tokens?.length) return {};
  return computePricesFromPoolState(buildPoolStateAt(poolHourDatas, startTime), tokens);
}

export function computePricesFromPoolState(
  poolState: PoolStateMap,
  tokens: TokenPair[] | undefined,
): { [tokenId: string]: number } {
  if (!tokens?.length) return {};

  const byTokenId = new Map<string, TokenPair>();
  for (const token of tokens) {
    byTokenId.set(token.tokenId.toLowerCase(), token);
  }

  const prices: { [tokenId: string]: number } = {};
  const resolving = new Set<string>();

  const priceOf = (token: TokenPair): number => {
    const key = token.tokenId.toLowerCase();
    const cached = prices[key];
    if (cached !== undefined) {
      return cached;
    }
    if (resolving.has(key)) {
      return 0; // cycle guard
    }
    resolving.add(key);

    let price: number;
    if (!token.parentTokenId) {
      price = relativePrice(poolState, token.tokenId, token.collateralToken);
    } else {
      const relative = relativePrice(poolState, token.tokenId, token.parentTokenId);
      const parent = byTokenId.get(token.parentTokenId.toLowerCase());
      // A parent outside `tokens` (its market was filtered out) leaves the child unpriceable.
      price = parent ? relative * priceOf(parent) : 0;
    }

    resolving.delete(key);
    prices[key] = price;
    return price;
  };

  for (const token of tokens) {
    priceOf(token);
  }
  return prices;
}

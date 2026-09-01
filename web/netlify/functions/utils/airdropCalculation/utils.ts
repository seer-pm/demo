import { Market } from "@seer-pm/sdk";
import { TickMath } from "@uniswap/v3-sdk";
import type { Address } from "viem";

export function getTokensByTimestamp(markets: Market[], timestamp: number) {
  return markets.reduce(
    (acum, market) => {
      if (Number(market.finalizeTs) > timestamp) {
        for (let i = 0; i < market.wrappedTokens.length; i++) {
          const tokenId = market.wrappedTokens[i] as Address;
          acum[tokenId] = true;
        }
      }
      return acum;
    },
    {} as { [key: Address]: boolean },
  );
}

export function getRandomNextDayTimestamp(timestampInSeconds: number, lastDayInSeconds: number) {
  // Get start of next UTC day
  const date = new Date(timestampInSeconds * 1000);
  date.setUTCDate(date.getUTCDate() + 1);
  date.setUTCHours(0, 0, 0, 0);

  const nextDayStartSeconds = Math.floor(date.getTime() / 1000);
  const nextDayEndSeconds = nextDayStartSeconds + 86400;
  // we need to wait a whole day to get a true random snapshot
  if (nextDayEndSeconds >= lastDayInSeconds) return;

  const randomOffset = Math.floor(Math.random() * 86400);

  return nextDayStartSeconds + randomOffset;
}

const Q96 = 2n ** 96n;

const sqrtRatioCache = new Map<number, bigint>();

/** `TickMath.getSqrtRatioAtTick` as a Q96 bigint, memoised — positions share tick bounds heavily. */
export function getSqrtRatioAtTickX96(tick: number): bigint {
  const cached = sqrtRatioCache.get(tick);
  if (cached !== undefined) {
    return cached;
  }
  const value = BigInt(TickMath.getSqrtRatioAtTick(tick).toString());
  sqrtRatioCache.set(tick, value);
  return value;
}

/**
 * Pool price at a snapshot, as Uniswap's Q96 sqrt price, derived from the stored hour candle.
 *
 * `dex_pool_hour_prices` keeps only token0Price/token1Price — the subgraph's `sqrtPrice` and `tick`
 * are not ingested. They do not need to be: `token1Price` IS the pool's price in Uniswap's own
 * sense (token1 per token0, raw units), so `sqrtPriceX96 = sqrt(token1Price) * 2^96`. Verified
 * against live Algebra data — `(sqrtPrice / 2^96)^2 * 10^(d0 - d1)` reproduces `token1Price`
 * exactly, and every pool the airdrop touches is 18/18 decimals (all default-profile primary
 * collaterals are 18: sDAI on gnosis/mainnet, sUSDS on optimism/base; the 6-decimal USDC is a swap
 * token only, never a market collateral), so the `10^(d0 - d1)` factor is 1 and drops out.
 *
 * If a non-18-decimal collateral is ever added to a default profile this becomes wrong silently,
 * hence the guard in the caller rather than an assumption buried here.
 *
 * Float64 loses ~1e-16 relative precision through the sqrt, which is far below anything that
 * survives into a SEER allocation.
 */
export function sqrtPriceX96FromToken1Price(token1Price: number): bigint {
  if (!Number.isFinite(token1Price) || token1Price <= 0) {
    return 0n;
  }
  return BigInt(Math.floor(Math.sqrt(token1Price) * 2 ** 96));
}

/**
 * Uniswap v3 `LiquidityAmounts.getAmountsForLiquidity`: the token composition of a concentrated
 * position at the current price. Algebra uses the same 1.0001^tick geometry, so this serves both.
 *
 * This replaces `calculateBurnAmounts`, whose out-of-range branches were **inverted** — it returned
 * all token1 below the range and all token0 above, which is backwards. Its in-range branch was
 * right, and taking limits proves the others wrong: as P approaches the lower bound the in-range
 * formulas tend to all token0, not all token1.
 *
 * All sqrt values are Q96 fixed point; `liquidity` and the returned amounts are RAW token units
 * (wei), unlike the subgraph's already-decimal-adjusted `amount0`/`amount1`.
 */
export function getAmountsForLiquidity(
  sqrtCurrent: bigint,
  sqrtLower: bigint,
  sqrtUpper: bigint,
  liquidity: bigint,
): { amount0: bigint; amount1: bigint } {
  const [lo, hi] = sqrtLower <= sqrtUpper ? [sqrtLower, sqrtUpper] : [sqrtUpper, sqrtLower];
  if (lo <= 0n || hi <= 0n || liquidity <= 0n) {
    return { amount0: 0n, amount1: 0n };
  }

  if (sqrtCurrent <= lo) {
    // Entirely below the range: the position holds only token0.
    return { amount0: (liquidity * Q96 * (hi - lo)) / (lo * hi), amount1: 0n };
  }
  if (sqrtCurrent >= hi) {
    // Entirely above the range: only token1.
    return { amount0: 0n, amount1: (liquidity * (hi - lo)) / Q96 };
  }
  return {
    amount0: (liquidity * Q96 * (hi - sqrtCurrent)) / (sqrtCurrent * hi),
    amount1: (liquidity * (sqrtCurrent - lo)) / Q96,
  };
}

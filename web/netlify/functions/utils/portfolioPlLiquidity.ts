import type { SupportedChain, TransactionData } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type Address, formatUnits } from "viem";
import { getAmountsForLiquidity, getSqrtRatioAtTickX96 } from "./airdropCalculation/utils";
import { fetchPoolSqrtPrices } from "./dexLiquidityPositions";
import type { Database } from "./supabase";
import { getTokenDecimals } from "./tokenDecimals";

/**
 * LP positions in P/L.
 *
 * A wallet that adds liquidity moves outcome tokens (and usually primary collateral) out of its
 * balances and into a pool. Balances alone read that as the tokens disappearing, and the P/L drops
 * by the whole deposit the moment it is made (issue #494). The fix is to value what the position
 * holds, on **both** ends of every window:
 *
 * - The outcome side of a position rides on its row as `lpTokenBalance`, so it is priced exactly
 *   like the wallet's own balance of the same token.
 * - The primary-collateral side is valued at 1 per unit, per market. It is the counterpart of
 *   `lpCollateralNetOut`, which keeps booking primary deposited as cash out: a deposit of X outcome
 *   + C primary then moves the P/L by `X·p + C − X·p − C = 0`, and what is left afterwards is price
 *   movement, impermanent loss and fees compounded into the position.
 * - Any other side (a parent outcome no loaded market lists) is left out, as it is from balances.
 *
 * Known limit: fees accrued but not yet collected are not part of the liquidity math, so they only
 * show up once collected.
 */

/** A concentrated-liquidity position as the P/L sees it: one pool, one tick range, its liquidity. */
export type PlLiquidityLeg = {
  poolId: string;
  token0: string;
  token1: string;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
};

/** What a wallet holds through LP positions at one moment. */
export type LiquidityHoldings = {
  /** Outcome tokens, raw units, keyed by lowercased token id. */
  outcomeRawByToken: Map<string, bigint>;
  /** Primary collateral, raw units, keyed by the lowercased id of the market the pool belongs to. */
  primaryRawByMarket: Map<string, bigint>;
};

function legKey(poolId: string, tickLower: number, tickUpper: number): string {
  return `${poolId.toLowerCase()}|${tickLower}|${tickUpper}`;
}

/**
 * Token amounts behind `legs` at `sqrtPriceByPool`, split into outcome rows and primary per market.
 *
 * `outcomeTokenToMarket` is the set of outcome tokens the caller values (and the market each
 * belongs to). A side is an outcome row when its token is in it, primary when it is `primary` and
 * the other side is a known outcome — the pool then belongs to that outcome's market, which is also
 * how `lpPrimaryCollateralFlow` attributes the deposit. A leg whose pool has no price is skipped.
 */
export function liquidityHoldingsAt(
  legs: PlLiquidityLeg[],
  sqrtPriceByPool: Map<string, bigint>,
  outcomeTokenToMarket: Map<string, string>,
  primary: string,
): LiquidityHoldings {
  const primaryLc = primary.toLowerCase();
  const outcomeRawByToken = new Map<string, bigint>();
  const primaryRawByMarket = new Map<string, bigint>();

  for (const leg of legs) {
    const sqrtPrice = sqrtPriceByPool.get(leg.poolId.toLowerCase()) ?? 0n;
    if (leg.liquidity <= 0n || sqrtPrice <= 0n) continue;
    const { amount0, amount1 } = getAmountsForLiquidity(
      sqrtPrice,
      getSqrtRatioAtTickX96(leg.tickLower),
      getSqrtRatioAtTickX96(leg.tickUpper),
      leg.liquidity,
    );
    const sides = [
      [leg.token0.toLowerCase(), amount0, leg.token1.toLowerCase()],
      [leg.token1.toLowerCase(), amount1, leg.token0.toLowerCase()],
    ] as const;
    for (const [token, amount, other] of sides) {
      if (amount <= 0n) continue;
      if (outcomeTokenToMarket.has(token)) {
        outcomeRawByToken.set(token, (outcomeRawByToken.get(token) ?? 0n) + amount);
        continue;
      }
      const marketId = outcomeTokenToMarket.get(other);
      if (token === primaryLc && marketId) {
        primaryRawByMarket.set(marketId, (primaryRawByMarket.get(marketId) ?? 0n) + amount);
      }
    }
  }

  return { outcomeRawByToken, primaryRawByMarket };
}

/**
 * `liquidityHoldingsAt` per owner, over legs carrying their own current price (`LiquidityLeg`).
 *
 * For market-driven callers that hold every position in a pool rather than one wallet's.
 */
export function liquidityHoldingsByOwner(
  legs: (PlLiquidityLeg & { owner: string; sqrtPrice: bigint })[],
  outcomeTokenToMarket: Map<string, string>,
  primary: string,
): Map<string, LiquidityHoldings> {
  const legsByOwner = new Map<string, typeof legs>();
  for (const leg of legs) {
    const owner = leg.owner.toLowerCase();
    legsByOwner.set(owner, [...(legsByOwner.get(owner) ?? []), leg]);
  }
  const out = new Map<string, LiquidityHoldings>();
  for (const [owner, ownerLegs] of legsByOwner) {
    const sqrtPrices = new Map(ownerLegs.map((leg) => [leg.poolId.toLowerCase(), leg.sqrtPrice]));
    out.set(owner, liquidityHoldingsAt(ownerLegs, sqrtPrices, outcomeTokenToMarket, primary));
  }
  return out;
}

/**
 * The wallet's positions as they stood at `time`: today's legs with the mints and burns after `time`
 * rolled back.
 *
 * Rolled back per (pool, tick range) rather than per position NFT, because that is all an event
 * carries. `events` must be the wallet's own mints and burns (the P/L pass fetches them by origin)
 * and must reach at least back to `time`; each needs `poolId`, the tick range and `liquidity`, and
 * one without them is ignored. Events after `endTime` are ignored too — `currentLegs` is the state
 * at `endTime`, and a mint the current legs have not seen yet must not be subtracted from them.
 *
 * A range that goes negative (a position received by NFT transfer, then burned) holds nothing.
 */
export function liquidityLegsAt(
  currentLegs: PlLiquidityLeg[],
  events: TransactionData[],
  time: number,
  endTime: number,
): PlLiquidityLeg[] {
  const byKey = new Map<string, PlLiquidityLeg>();
  for (const leg of currentLegs) {
    const key = legKey(leg.poolId, leg.tickLower, leg.tickUpper);
    const existing = byKey.get(key);
    if (existing) existing.liquidity += leg.liquidity;
    else byKey.set(key, { ...leg, poolId: leg.poolId.toLowerCase() });
  }

  for (const event of events) {
    const ts = Number(event.timestamp ?? 0);
    if (ts <= time || ts > endTime) continue;
    if (!event.poolId || event.tickLower === undefined || event.tickUpper === undefined || !event.liquidity) continue;
    if (!event.token0 || !event.token1) continue;
    const delta = BigInt(event.liquidity);
    // Rolling back: a mint after `time` was not there yet, a burn after `time` still was.
    const signed = event.type === "lp" ? -delta : event.type === "lp-burn" ? delta : 0n;
    if (signed === 0n) continue;
    const key = legKey(event.poolId, event.tickLower, event.tickUpper);
    const leg = byKey.get(key) ?? {
      poolId: event.poolId.toLowerCase(),
      token0: event.token0.toLowerCase(),
      token1: event.token1.toLowerCase(),
      tickLower: event.tickLower,
      tickUpper: event.tickUpper,
      liquidity: 0n,
    };
    leg.liquidity += signed;
    byKey.set(key, leg);
  }

  return [...byKey.values()].filter((leg) => leg.liquidity > 0n);
}

/** Lookback for the nearest pool candle, matching the history-price path. */
const HISTORY_LOOKBACK_SECONDS = 60 * 60 * 24 * 30 * 3;

/**
 * Q96 `sqrtPrice` of a pool from a human `token1Price` (token1 per token0), in raw units.
 *
 * Unlike `sqrtPriceX96FromToken1Price`, this does not assume both tokens have 18 decimals: the raw
 * ratio is `token1Price · 10^(d1 − d0)`.
 */
function sqrtPriceX96FromHumanPrice(token1Price: number, decimals0: number, decimals1: number): bigint {
  const raw = token1Price * 10 ** (decimals1 - decimals0);
  if (!Number.isFinite(raw) || raw <= 0) return 0n;
  return BigInt(Math.floor(Math.sqrt(raw) * 2 ** 96));
}

/**
 * Each pool's `sqrtPrice` at `time`: the nearest hourly candle at or before it.
 *
 * Candles are only written for hours a pool traded, so a pool with none in the lookback falls back
 * to its current price — the same fallback the history prices of outcome rows take.
 */
export async function poolSqrtPricesAt(
  supabase: SupabaseClient<Database>,
  chainId: SupportedChain,
  legs: PlLiquidityLeg[],
  time: number,
): Promise<Map<string, bigint>> {
  const out = new Map<string, bigint>();
  if (legs.length === 0) return out;

  const pools = new Map<string, { token0: string; token1: string }>();
  for (const leg of legs) {
    pools.set(leg.poolId.toLowerCase(), { token0: leg.token0.toLowerCase(), token1: leg.token1.toLowerCase() });
  }
  const pairs = [...new Map([...pools.values()].map((pair) => [`${pair.token0}|${pair.token1}`, pair])).values()];
  const decimals = getTokenDecimals(chainId, pairs.flatMap((pair) => [pair.token0, pair.token1]) as Address[]);

  const { data, error } = await supabase.rpc("dex_pool_hour_prices_nearest_before_for_pairs", {
    p_chain_id: chainId,
    p_start_time: time,
    p_lookback_seconds: HISTORY_LOOKBACK_SECONDS,
    p_token0_ids: pairs.map((pair) => pair.token0),
    p_token1_ids: pairs.map((pair) => pair.token1),
  });
  if (error) throw new Error(`poolSqrtPricesAt: ${error.message}`);

  for (const row of data ?? []) {
    const poolId = String(row.pool_id ?? "").toLowerCase();
    if (!pools.has(poolId)) continue;
    const sqrtPrice = sqrtPriceX96FromHumanPrice(
      Number(row.token1_price),
      decimals[row.token0_id.toLowerCase()] ?? 18,
      decimals[row.token1_id.toLowerCase()] ?? 18,
    );
    if (sqrtPrice > 0n) out.set(poolId, sqrtPrice);
  }

  const missing = [...pools.keys()].filter((poolId) => !out.has(poolId));
  if (missing.length > 0) {
    for (const [poolId, sqrtPrice] of await fetchPoolSqrtPrices(chainId, missing)) {
      out.set(poolId, sqrtPrice);
    }
  }
  return out;
}

/** Primary collateral held through LP, in human units, per market. */
export function primaryValueByMarket(holdings: LiquidityHoldings, primaryDecimals: number): Map<string, number> {
  const out = new Map<string, number>();
  for (const [marketId, raw] of holdings.primaryRawByMarket) {
    out.set(marketId, Number(formatUnits(raw, primaryDecimals)));
  }
  return out;
}

export function sumValues(byMarket: Map<string, number>): number {
  let total = 0;
  for (const value of byMarket.values()) total += value;
  return total;
}

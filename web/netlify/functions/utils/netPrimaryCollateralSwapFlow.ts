import type { Token, TransactionData } from "@seer-pm/sdk";
import { type Address, formatUnits } from "viem";

/**
 * Seer wraps every outcome position as an 18-decimal ERC20, so a swap leg denominated in a
 * *parent outcome token* (conditional markets) is always 18-decimal — it is never the request
 * primary collateral, whose decimals come from the collateral profile.
 */
const OUTCOME_TOKEN_DECIMALS = 18;

/**
 * Price, in primary collateral, of one unit of a market's collateral token — keyed by market id.
 *
 * 1 for a market collateralised in the primary token itself. For a conditional market the
 * collateral is a *parent outcome token*, and the caller supplies its volume price (always 1/N:
 * one primary collateral split across N parent outcomes).
 */
export type CollateralPriceByMarketId = Map<string, number>;

export type PrimaryCollateralSwapFlowDebugRow = {
  marketId: string;
  marketName: string;
  timestamp: number;
  blockNumber: number;
  txHash?: string;
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  amountOut?: string;
  tokenInSymbol?: string;
  tokenOutSymbol?: string;
  countedPrimaryNetOutWei: string; // signed, in wei of primary token
  countedVolumeWei: string; // absolute notional of the market-collateral leg
  countedVolumeToken: string; // the token that notional is denominated in
  countedVolumeDecimals: number;
  countedVolumePrice: number; // that token's price in primary collateral
  countedVolumePrimary: number; // the leg in primary collateral: notional × price
};

export type CollateralSwapFlowOpts = {
  limitRows?: number;
};

export type PrimaryCollateralSwapFlowByPeriod = {
  /** Net primary out per window start (positive = spent more primary than received). */
  netOutByStartTime: Map<number, number>;
  /**
   * Gross traded notional in **primary collateral** (buy + sell legs) per window start: each
   * swap's market-collateral leg, priced by `collateralPriceByMarketId`.
   *
   * On conditional markets the pool is `childOutcome ↔ parentOutcome`, so no leg is the primary
   * collateral. Parent outcome tokens are valued at 1/N primary collateral for volume (split
   * notional), regardless of parent resolution or which outcome wins.
   */
  volumeByStartTime: Map<number, number>;
  /**
   * Primary collateral spent buying outcomes (primary as `tokenIn`) per window start.
   * Feeds `capitalDeployed` / ROI — not derived from volume (volume also counts nested legs).
   */
  buysByStartTime: Map<number, number>;
  /** Distinct markets with a market-collateral swap leg in the window. */
  marketCountByStartTime: Map<number, number>;
  rowsByStartTime: Map<number, PrimaryCollateralSwapFlowDebugRow[]>;
  primary: { address: string; decimals: number };
};

function aggregateSwapFlowForPeriods(
  swaps: TransactionData[],
  startTimes: number[],
  endTime: number,
  primaryAddr: string,
  decimals: number,
  collateralPriceByMarketId: CollateralPriceByMarketId,
  marketId?: Address,
  opts?: CollateralSwapFlowOpts,
): PrimaryCollateralSwapFlowByPeriod {
  const netOutWeiByStart = new Map<number, bigint>();
  const buysWeiByStart = new Map<number, bigint>();
  // Primary-collateral legs stay exact in wei; priced legs are floats the moment they are
  // multiplied by a volume price, so the two are summed only at the end.
  const volumePrimaryWeiByStart = new Map<number, bigint>();
  const volumePricedByStart = new Map<number, number>();
  const marketsByStart = new Map<number, Set<string>>();
  const rowsByStart = new Map<number, PrimaryCollateralSwapFlowDebugRow[]>();
  for (const s of startTimes) {
    netOutWeiByStart.set(s, 0n);
    buysWeiByStart.set(s, 0n);
    volumePrimaryWeiByStart.set(s, 0n);
    volumePricedByStart.set(s, 0);
    marketsByStart.set(s, new Set());
    rowsByStart.set(s, []);
  }

  const rowLimit = Math.max(0, opts?.limitRows ?? 200);

  for (const s of swaps) {
    if (marketId && (s.marketId ?? "").toLowerCase() !== marketId.toLowerCase()) continue;
    const ts = Number(s.timestamp ?? 0);
    if (ts > endTime) continue;

    const tin = (s.tokenIn ?? "").toLowerCase();
    const tout = (s.tokenOut ?? "").toLowerCase();
    // The collateral of the market this swap was attributed to: the primary collateral on flat
    // markets, the parent outcome token on conditional ones. Set by `getCollateralFromDexTx` when
    // the swap was mapped; fall back to the primary token so an unmapped swap keeps the old rule.
    const collateralAddr = (s.collateral ?? primaryAddr).toLowerCase();
    const collateralIsPrimary = collateralAddr === primaryAddr;
    const collateralPrice = collateralIsPrimary
      ? 1
      : (collateralPriceByMarketId.get(String(s.marketId ?? "").toLowerCase()) ?? 0);

    // Primary legs only: `netCounted` feeds P/L (both legs of a conditional swap are already
    // inside the valued position set, so counting them here would subtract the same trade twice)
    // and `buyCounted` feeds ROI capital.
    let netCounted = 0n;
    let buyCounted = 0n;
    if (tin === primaryAddr) {
      const amt = BigInt(s.amountIn || 0);
      netCounted += amt;
      buyCounted += amt;
    }
    if (tout === primaryAddr) {
      netCounted -= BigInt(s.amountOut || 0);
    }

    // Volume: the leg denominated in the market's own collateral, whatever that is, valued in
    // primary collateral. A zero price (e.g. missing payout numerators) contributes nothing.
    let volumeCounted = 0n;
    if (tin === collateralAddr) volumeCounted += BigInt(s.amountIn || 0);
    if (tout === collateralAddr) volumeCounted += BigInt(s.amountOut || 0);
    const volumePriced = collateralIsPrimary
      ? 0
      : Number(formatUnits(volumeCounted, OUTCOME_TOKEN_DECIMALS)) * collateralPrice;

    if (volumeCounted === 0n && netCounted === 0n) continue;

    const swapMarketId = String(s.marketId ?? "").toLowerCase();

    for (const startTime of startTimes) {
      if (ts <= startTime || ts > endTime) continue;
      netOutWeiByStart.set(startTime, (netOutWeiByStart.get(startTime) ?? 0n) + netCounted);
      buysWeiByStart.set(startTime, (buysWeiByStart.get(startTime) ?? 0n) + buyCounted);
      if (collateralIsPrimary) {
        volumePrimaryWeiByStart.set(startTime, (volumePrimaryWeiByStart.get(startTime) ?? 0n) + volumeCounted);
      } else {
        volumePricedByStart.set(startTime, (volumePricedByStart.get(startTime) ?? 0) + volumePriced);
      }
      // Counts the market as traded on the collateral leg, not on its priced volume.
      if (swapMarketId && volumeCounted > 0n) marketsByStart.get(startTime)?.add(swapMarketId);
      if (rowLimit > 0) {
        const rows = rowsByStart.get(startTime) ?? [];
        if (rows.length < rowLimit) {
          rows.push({
            marketId: String(s.marketId ?? ""),
            marketName: String(s.marketName ?? ""),
            timestamp: ts,
            blockNumber: Number(s.blockNumber ?? 0),
            txHash: s.transactionHash,
            tokenIn: s.tokenIn,
            tokenOut: s.tokenOut,
            amountIn: s.amountIn,
            amountOut: s.amountOut,
            tokenInSymbol: s.tokenInSymbol,
            tokenOutSymbol: s.tokenOutSymbol,
            countedPrimaryNetOutWei: netCounted.toString(),
            countedVolumeWei: volumeCounted.toString(),
            countedVolumeToken: collateralAddr,
            countedVolumeDecimals: collateralIsPrimary ? decimals : OUTCOME_TOKEN_DECIMALS,
            countedVolumePrice: collateralPrice,
            countedVolumePrimary: collateralIsPrimary ? Number(formatUnits(volumeCounted, decimals)) : volumePriced,
          });
          rowsByStart.set(startTime, rows);
        }
      }
    }
  }

  const netOutByStartTime = new Map<number, number>();
  const buysByStartTime = new Map<number, number>();
  const volumeByStartTime = new Map<number, number>();
  const marketCountByStartTime = new Map<number, number>();
  for (const st of startTimes) {
    netOutByStartTime.set(st, Number(formatUnits(netOutWeiByStart.get(st) ?? 0n, decimals)));
    buysByStartTime.set(st, Number(formatUnits(buysWeiByStart.get(st) ?? 0n, decimals)));
    volumeByStartTime.set(
      st,
      Number(formatUnits(volumePrimaryWeiByStart.get(st) ?? 0n, decimals)) + (volumePricedByStart.get(st) ?? 0),
    );
    marketCountByStartTime.set(st, marketsByStart.get(st)?.size ?? 0);
  }

  return {
    netOutByStartTime,
    buysByStartTime,
    volumeByStartTime,
    marketCountByStartTime,
    rowsByStartTime: rowsByStart,
    primary: { address: primaryAddr, decimals },
  };
}

/**
 * Net **primary collateral** spent on outcome **DEX/Cowswap** swaps in `(startTime, endTime]`,
 * in human units (same decimals as chain primary collateral).
 *
 * Positive = user sent more primary than they received (typical net cost of buying).
 * Also returns the primary spent on buys, and gross **volume** — each swap's market-collateral leg
 * valued in primary collateral, which on conditional markets means pricing the parent outcome
 * token at its settlement value (see `volumeByStartTime`).
 *
 * Sources: same as transaction history (`fetchAccountDexEvents`). Does not include split/merge/redeem —
 * those are handled separately in portfolio P/L: global path via HyperIndex
 * `router_collateral` transfers (`computeCollateralPortfolioValuesForPeriods`); market-scoped
 * via HyperIndex `ConditionalEvent` (`routerPrimaryCollateralNetInWindow`).
 *
 * Expects swaps from a prior `fetchAccountDexEvents` call (portfolio P/L uses one Goldsky pass per wallet).
 */
export function computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents(
  swaps: TransactionData[],
  startTimes: number[],
  endTime: number,
  primaryCollateral: Token,
  collateralPriceByMarketId: CollateralPriceByMarketId,
  marketId?: Address,
  opts?: CollateralSwapFlowOpts,
): PrimaryCollateralSwapFlowByPeriod {
  const primaryAddr = primaryCollateral.address.toLowerCase();
  const decimals = primaryCollateral.decimals;

  if (startTimes.length === 0) {
    return {
      netOutByStartTime: new Map(),
      buysByStartTime: new Map(),
      volumeByStartTime: new Map(),
      marketCountByStartTime: new Map(),
      rowsByStartTime: new Map(),
      primary: { address: primaryAddr, decimals },
    };
  }

  return aggregateSwapFlowForPeriods(
    swaps,
    startTimes,
    endTime,
    primaryAddr,
    decimals,
    collateralPriceByMarketId,
    marketId,
    opts,
  );
}

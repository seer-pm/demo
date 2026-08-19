import type { Token, TransactionData } from "@seer-pm/sdk";
import { type Address, formatUnits } from "viem";

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
  countedPrimaryVolumeWei: string; // absolute primary notional for this swap
};

export type CollateralSwapFlowOpts = {
  limitRows?: number;
};

export type PrimaryCollateralSwapFlowByPeriod = {
  /** Net primary out per window start (positive = spent more primary than received). */
  netOutByStartTime: Map<number, number>;
  /** Gross primary notional (buy + sell legs) per window start. */
  volumeByStartTime: Map<number, number>;
  /** Distinct markets with counted primary-collateral swap volume per window start. */
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
  marketId?: Address,
  opts?: CollateralSwapFlowOpts,
): PrimaryCollateralSwapFlowByPeriod {
  const netOutWeiByStart = new Map<number, bigint>();
  const volumeWeiByStart = new Map<number, bigint>();
  const marketsByStart = new Map<number, Set<string>>();
  const rowsByStart = new Map<number, PrimaryCollateralSwapFlowDebugRow[]>();
  for (const s of startTimes) {
    netOutWeiByStart.set(s, 0n);
    volumeWeiByStart.set(s, 0n);
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

    let netCounted = 0n;
    let volumeCounted = 0n;
    if (tin === primaryAddr) {
      const amt = BigInt(s.amountIn || 0);
      netCounted += amt;
      volumeCounted += amt;
    }
    if (tout === primaryAddr) {
      const amt = BigInt(s.amountOut || 0);
      netCounted -= amt;
      volumeCounted += amt;
    }

    if (volumeCounted === 0n) continue;

    const swapMarketId = String(s.marketId ?? "").toLowerCase();

    for (const startTime of startTimes) {
      if (ts <= startTime || ts > endTime) continue;
      netOutWeiByStart.set(startTime, (netOutWeiByStart.get(startTime) ?? 0n) + netCounted);
      volumeWeiByStart.set(startTime, (volumeWeiByStart.get(startTime) ?? 0n) + volumeCounted);
      if (swapMarketId) marketsByStart.get(startTime)?.add(swapMarketId);
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
            countedPrimaryVolumeWei: volumeCounted.toString(),
          });
          rowsByStart.set(startTime, rows);
        }
      }
    }
  }

  const netOutByStartTime = new Map<number, number>();
  const volumeByStartTime = new Map<number, number>();
  const marketCountByStartTime = new Map<number, number>();
  for (const st of startTimes) {
    netOutByStartTime.set(st, Number(formatUnits(netOutWeiByStart.get(st) ?? 0n, decimals)));
    volumeByStartTime.set(st, Number(formatUnits(volumeWeiByStart.get(st) ?? 0n, decimals)));
    marketCountByStartTime.set(st, marketsByStart.get(st)?.size ?? 0);
  }

  return {
    netOutByStartTime,
    volumeByStartTime,
    marketCountByStartTime,
    rowsByStartTime: rowsByStart,
    primary: { address: primaryAddr, decimals },
  };
}

/**
 * Net **primary collateral** (e.g. sDAI on Gnosis) spent on outcome **DEX/Cowswap** swaps in `(startTime, endTime]`,
 * in human units (same decimals as chain primary collateral).
 *
 * Positive = user sent more primary than they received (typical net cost of buying).
 * Also returns gross primary **volume** (sum of primary as tokenIn + primary as tokenOut).
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
  marketId?: Address,
  opts?: CollateralSwapFlowOpts,
): PrimaryCollateralSwapFlowByPeriod {
  const primaryAddr = primaryCollateral.address.toLowerCase();
  const decimals = primaryCollateral.decimals;

  if (startTimes.length === 0) {
    return {
      netOutByStartTime: new Map(),
      volumeByStartTime: new Map(),
      marketCountByStartTime: new Map(),
      rowsByStartTime: new Map(),
      primary: { address: primaryAddr, decimals },
    };
  }

  return aggregateSwapFlowForPeriods(swaps, startTimes, endTime, primaryAddr, decimals, marketId, opts);
}

import type { SupportedChain } from "@seer-pm/sdk";
import { COLLATERAL_TOKENS, getPrimaryCollateralAddress } from "@seer-pm/sdk";
import type { Market } from "@seer-pm/sdk/market-types";
import { type Address, formatUnits } from "viem";
import { getMappings } from "./portfolio";
import { getSwapEvents } from "./transactions/getSwapEvents";

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
};

/**
 * Net **primary collateral** (e.g. sDAI on Gnosis) spent on outcome **DEX/Cowswap** swaps in `(startTime, endTime]`,
 * in human units (same decimals as chain primary collateral).
 *
 * Positive = user sent more primary than they received (typical net cost of buying).
 *
 * Sources: same as transaction history (`getSwapEvents`). Does not include split/merge/redeem (those are captured in
 * `collateralValues` from router `tokens_transfers` when applicable).
 *
 * `markets` must be preloaded (e.g. same `searchAllMarkets` pass as portfolio positions for this request).
 */
export async function computeNetPrimaryCollateralSwapFlow(
  account: Address,
  chainId: SupportedChain,
  startTime: number,
  endTime: number,
  markets: Market[],
  marketId?: Address,
  opts?: { limitRows?: number },
): Promise<{
  netOut: number;
  rows: PrimaryCollateralSwapFlowDebugRow[];
  primary: { address: string; decimals: number };
}> {
  const primaryAddr = getPrimaryCollateralAddress(chainId).toLowerCase();
  const decimals = COLLATERAL_TOKENS[chainId as keyof typeof COLLATERAL_TOKENS].primary.decimals;

  if (markets.length === 0) return { netOut: 0, rows: [], primary: { address: primaryAddr, decimals } };

  const { netOutByStartTime, rowsByStartTime } = await computeNetPrimaryCollateralSwapFlowForPeriods(
    account,
    chainId,
    [startTime],
    endTime,
    markets,
    marketId,
    opts,
  );

  return {
    netOut: netOutByStartTime.get(startTime) ?? 0,
    rows: rowsByStartTime.get(startTime) ?? [],
    primary: { address: primaryAddr, decimals },
  };
}

/**
 * Single `getSwapEvents` over `(min(startTimes), endTime]`, then net primary collateral out per window
 * `(startTime, endTime]` for each `startTime`.
 */
export async function computeNetPrimaryCollateralSwapFlowForPeriods(
  account: Address,
  chainId: SupportedChain,
  startTimes: number[],
  endTime: number,
  markets: Market[],
  marketId?: Address,
  opts?: { limitRows?: number },
): Promise<{
  netOutByStartTime: Map<number, number>;
  rowsByStartTime: Map<number, PrimaryCollateralSwapFlowDebugRow[]>;
  primary: { address: string; decimals: number };
}> {
  const primaryAddr = getPrimaryCollateralAddress(chainId).toLowerCase();
  const decimals = COLLATERAL_TOKENS[chainId as keyof typeof COLLATERAL_TOKENS].primary.decimals;

  if (markets.length === 0 || startTimes.length === 0) {
    return {
      netOutByStartTime: new Map(startTimes.map((s) => [s, 0])),
      rowsByStartTime: new Map(startTimes.map((s) => [s, [] as PrimaryCollateralSwapFlowDebugRow[]])),
      primary: { address: primaryAddr, decimals },
    };
  }

  const mappings = await getMappings(markets, chainId);
  const minStart = Math.min(...startTimes);
  const swaps = await getSwapEvents(mappings, account, chainId, minStart, endTime);

  const netOutWeiByStart = new Map<number, bigint>();
  const rowsByStart = new Map<number, PrimaryCollateralSwapFlowDebugRow[]>();
  for (const s of startTimes) {
    netOutWeiByStart.set(s, 0n);
    rowsByStart.set(s, []);
  }

  const rowLimit = Math.max(0, opts?.limitRows ?? 200);

  for (const s of swaps) {
    if (marketId && (s.marketId ?? "").toLowerCase() !== marketId.toLowerCase()) {
      continue;
    }
    const ts = Number(s.timestamp ?? 0);
    if (ts > endTime) {
      continue;
    }

    const tin = (s.tokenIn ?? "").toLowerCase();
    const tout = (s.tokenOut ?? "").toLowerCase();

    let counted = 0n;
    if (tin === primaryAddr) counted += BigInt(s.amountIn || 0);
    if (tout === primaryAddr) counted -= BigInt(s.amountOut || 0);

    if (counted === 0n) continue;

    for (const startTime of startTimes) {
      if (ts <= startTime || ts > endTime) continue;
      netOutWeiByStart.set(startTime, (netOutWeiByStart.get(startTime) ?? 0n) + counted);
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
            countedPrimaryNetOutWei: counted.toString(),
          });
          rowsByStart.set(startTime, rows);
        }
      }
    }
  }

  const netOutByStartTime = new Map<number, number>();
  for (const st of startTimes) {
    netOutByStartTime.set(st, Number(formatUnits(netOutWeiByStart.get(st) ?? 0n, decimals)));
  }

  return { netOutByStartTime, rowsByStartTime: rowsByStart, primary: { address: primaryAddr, decimals } };
}

import type { Token, TransactionData } from "@seer-pm/sdk";
import { formatUnits } from "viem";

export type LpPrimaryCollateralFlowByPeriod = {
  /** Net primary into LP pools per window start (mints − burns). Positive = capital locked in LP. */
  netOutByStartTime: Map<number, number>;
  /**
   * Same quantity split by market id, in **wei**, so the caller can fold buckets back into the
   * scalar without float re-association changing the result.
   */
  netOutWeiByStartTimeAndMarket: Map<number, Map<string, bigint>>;
  primary: { address: string; decimals: number };
};

function primaryAmountWei(ev: TransactionData, primaryAddr: string): bigint {
  const p = primaryAddr.toLowerCase();
  if ((ev.token0 ?? "").toLowerCase() === p) return BigInt(ev.amount0 || 0);
  if ((ev.token1 ?? "").toLowerCase() === p) return BigInt(ev.amount1 || 0);
  return 0n;
}

function aggregateLpFlowForPeriods(
  mints: TransactionData[],
  burns: TransactionData[],
  startTimes: number[],
  endTime: number,
  primaryAddr: string,
  decimals: number,
): LpPrimaryCollateralFlowByPeriod {
  const byStartAndMarket = new Map<number, Map<string, bigint>>();
  for (const s of startTimes) byStartAndMarket.set(s, new Map());

  const apply = (ev: TransactionData, sign: 1n | -1n) => {
    const ts = Number(ev.timestamp ?? 0);
    if (ts > endTime) return;
    const amt = primaryAmountWei(ev, primaryAddr);
    if (amt === 0n) return;
    // Mints and burns are mapped to a market by `tokenPairToMarketMapping`; an unmapped event is
    // dropped upstream, so a missing id here would be a bug rather than a normal case.
    const marketId = String(ev.marketId ?? "").toLowerCase();
    for (const startTime of startTimes) {
      if (ts <= startTime || ts > endTime) continue;
      const byMarket = byStartAndMarket.get(startTime)!;
      byMarket.set(marketId, (byMarket.get(marketId) ?? 0n) + sign * amt);
    }
  };

  for (const m of mints) apply(m, 1n);
  for (const b of burns) apply(b, -1n);

  // Sum in wei, convert once: folding per-market floats would drift from the scalar.
  const netOutByStartTime = new Map<number, number>();
  for (const st of startTimes) {
    let total = 0n;
    for (const v of byStartAndMarket.get(st)!.values()) total += v;
    netOutByStartTime.set(st, Number(formatUnits(total, decimals)));
  }

  return {
    netOutByStartTime,
    netOutWeiByStartTimeAndMarket: byStartAndMarket,
    primary: { address: primaryAddr, decimals },
  };
}

/**
 * Net **primary collateral** deposited into outcome/collateral Uniswap/Swapr pools via LP mint/burn
 * in each window `(startTime, endTime]`, human units of `primaryCollateral`.
 *
 * Positive = more primary minted into pools than burned (typical LP capital out).
 * Same subgraph sources as `/get-transactions` LP rows.
 */
export function computeLpPrimaryCollateralNetOutForPeriodsFromEvents(
  mints: TransactionData[],
  burns: TransactionData[],
  startTimes: number[],
  endTime: number,
  primaryCollateral: Token,
): LpPrimaryCollateralFlowByPeriod {
  const primaryAddr = primaryCollateral.address.toLowerCase();
  const decimals = primaryCollateral.decimals;

  if (startTimes.length === 0) {
    return {
      netOutByStartTime: new Map(),
      netOutWeiByStartTimeAndMarket: new Map(),
      primary: { address: primaryAddr, decimals },
    };
  }

  return aggregateLpFlowForPeriods(mints, burns, startTimes, endTime, primaryAddr, decimals);
}

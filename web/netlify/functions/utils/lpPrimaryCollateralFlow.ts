import type { SupportedChain, Token, TransactionData } from "@seer-pm/sdk";
import type { Market } from "@seer-pm/sdk/market-types";
import { type Address, formatUnits } from "viem";
import { getPublicClientByChainId } from "./config";
import { getMappingsCached } from "./mappingsCache";
import { getLiquidityEvents } from "./transactions/getLiquidityEvents";
import { getLiquidityWithdrawEvents } from "./transactions/getLiquidityWithdrawEvents";

export type LpPrimaryCollateralFlowByPeriod = {
  /** Net primary into LP pools per window start (mints − burns). Positive = capital locked in LP. */
  netOutByStartTime: Map<number, number>;
  primary: { address: string; decimals: number };
};

function primaryAmountWei(ev: TransactionData, primaryAddr: string): bigint {
  const p = primaryAddr.toLowerCase();
  if ((ev.token0 ?? "").toLowerCase() === p) return BigInt(ev.amount0 || 0);
  if ((ev.token1 ?? "").toLowerCase() === p) return BigInt(ev.amount1 || 0);
  return 0n;
}

/**
 * Net **primary collateral** deposited into outcome/collateral Uniswap/Swapr pools via LP mint/burn
 * in each window `(startTime, endTime]`, human units of `primaryCollateral`.
 *
 * Positive = more primary minted into pools than burned (typical LP capital out).
 * Same subgraph sources as `/get-transactions` LP rows.
 */
export async function computeLpPrimaryCollateralNetOutForPeriods(
  account: Address,
  chainId: SupportedChain,
  startTimes: number[],
  endTime: number,
  markets: Market[],
  primaryCollateral: Token,
): Promise<LpPrimaryCollateralFlowByPeriod> {
  const primaryAddr = primaryCollateral.address.toLowerCase();
  const decimals = primaryCollateral.decimals;

  if (markets.length === 0 || startTimes.length === 0) {
    return {
      netOutByStartTime: new Map(startTimes.map((s) => [s, 0])),
      primary: { address: primaryAddr, decimals },
    };
  }

  const mappings = await getMappingsCached(getPublicClientByChainId(chainId), markets, chainId);
  const minStart = Math.min(...startTimes);
  const [mints, burns] = await Promise.all([
    getLiquidityEvents(mappings, account, chainId, minStart, endTime),
    getLiquidityWithdrawEvents(mappings, account, chainId, minStart, endTime),
  ]);

  const netOutWeiByStart = new Map<number, bigint>();
  for (const s of startTimes) netOutWeiByStart.set(s, 0n);

  const apply = (ev: TransactionData, sign: 1n | -1n) => {
    const ts = Number(ev.timestamp ?? 0);
    if (ts > endTime) return;
    const amt = primaryAmountWei(ev, primaryAddr);
    if (amt === 0n) return;
    for (const startTime of startTimes) {
      if (ts <= startTime || ts > endTime) continue;
      netOutWeiByStart.set(startTime, (netOutWeiByStart.get(startTime) ?? 0n) + sign * amt);
    }
  };

  for (const m of mints) apply(m, 1n);
  for (const b of burns) apply(b, -1n);

  const netOutByStartTime = new Map<number, number>();
  for (const st of startTimes) {
    netOutByStartTime.set(st, Number(formatUnits(netOutWeiByStart.get(st) ?? 0n, decimals)));
  }

  return {
    netOutByStartTime,
    primary: { address: primaryAddr, decimals },
  };
}

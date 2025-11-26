import { Market } from "@/lib/market";
import { isTwoStringsEqual } from "@/lib/utils";
import { Address } from "viem";
import { useTicksData } from "./useTicksData";
import { getVolumeUntilPrice } from "./useVolumeUntilPrice";
import { tickToPrice } from "./utils";

export function getPriceFromVolume(
  pool: {
    liquidity: bigint;
    tickSpacing: number;
    tick: number;
    token0: Address;
    token1: Address;
  },
  ticks: { liquidityNet: string; tickIdx: string }[],
  targetVolume: number,
  outcome: Address,
  swapType: "buy" | "sell",
): number {
  const tolerance = 1e-12;

  const isOutcomeToken0 = isTwoStringsEqual(pool.token0, outcome);

  const movingUp = (isOutcomeToken0 && swapType === "buy") || (!isOutcomeToken0 && swapType === "sell");

  const currentPrice = Number(tickToPrice(pool.tick, 18, true)[isOutcomeToken0 ? 0 : 1]);

  // Search bounds
  let low = 0.001;
  let high = 1;
  let mid = currentPrice;

  for (let i = 0; i < 60; i++) {
    mid = (low + high) / 2;
    const vol = getVolumeUntilPrice(pool, ticks, mid, outcome, swapType);

    if (Math.abs(vol - targetVolume) <= tolerance) break;

    if (movingUp) {
      if (vol < targetVolume) low = mid;
      else high = mid;
    } else {
      if (vol < targetVolume) high = mid;
      else low = mid;
    }
  }

  return mid;
}

export function usePriceFromVolume(
  market: Market,
  outcome: Address,
  swapType: "buy" | "sell",
  targetVolume: number | undefined,
) {
  const { data: ticksByPool } = useTicksData(
    market,
    market.wrappedTokens.findIndex((x) => isTwoStringsEqual(x, outcome)),
  );

  if (!ticksByPool || !targetVolume || targetVolume <= 0) {
    return;
  }

  const { ticks, poolInfo } = Object.values(ticksByPool)[0];
  return getPriceFromVolume(poolInfo, ticks, targetVolume, outcome, swapType);
}

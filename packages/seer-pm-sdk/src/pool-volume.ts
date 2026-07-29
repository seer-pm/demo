import type { Address } from "viem";
import { formatUnits } from "viem";
import { decimalToFraction, encodeSqrtRatioX96 } from "./liquidity-utils";
import { isTwoStringsEqual } from "./quote-utils";
import { getSqrtRatioAtTick, tickToPrice } from "./tick-math";

export type PoolVolumeInfo = {
  liquidity: bigint;
  tickSpacing: number;
  tick: number;
  token0: Address;
  token1: Address;
};

export type PoolTick = {
  liquidityNet: string;
  tickIdx: string;
};

function getVolumeWithinRange(
  currentSqrtPriceX96: bigint,
  targetSqrtPriceX96: bigint,
  liquidity: bigint,
  isOutcomeToken0: boolean,
  swapType: "buy" | "sell",
): number {
  if (swapType === "buy") {
    if (isOutcomeToken0) {
      const amount0 =
        (liquidity * (1n << 96n) * (targetSqrtPriceX96 - currentSqrtPriceX96)) /
        (targetSqrtPriceX96 * currentSqrtPriceX96);
      return Number(formatUnits(amount0, 18));
    }
    const amount1 = (liquidity * (currentSqrtPriceX96 - targetSqrtPriceX96)) / (1n << 96n);
    return Number(formatUnits(amount1, 18));
  }
  if (isOutcomeToken0) {
    const amount0 =
      (liquidity * (1n << 96n) * (currentSqrtPriceX96 - targetSqrtPriceX96)) /
      (targetSqrtPriceX96 * currentSqrtPriceX96);
    return Number(formatUnits(amount0, 18));
  }
  const amount1 = (liquidity * (targetSqrtPriceX96 - currentSqrtPriceX96)) / (1n << 96n);
  return Number(formatUnits(amount1, 18));
}

export function getVolumeUntilPrice(
  pool: PoolVolumeInfo,
  ticks: PoolTick[],
  targetPrice: number,
  outcome: Address,
  swapType: "buy" | "sell",
): number {
  const isOutcomeToken0 = isTwoStringsEqual(pool.token0, outcome);
  let currentSqrtPriceX96 = getSqrtRatioAtTick(pool.tick);
  const [num, den] = decimalToFraction(isOutcomeToken0 ? targetPrice : 1 / targetPrice);
  const targetSqrtPriceX96 = encodeSqrtRatioX96(num, den);

  const movingUp = (isOutcomeToken0 && swapType === "buy") || (!isOutcomeToken0 && swapType === "sell");
  if (movingUp && targetSqrtPriceX96 <= currentSqrtPriceX96) return 0;
  if (!movingUp && targetSqrtPriceX96 >= currentSqrtPriceX96) return 0;

  let relevantTicks: PoolTick[];
  if (movingUp) {
    relevantTicks = ticks
      .filter((tick) => Number(tick.tickIdx) > pool.tick)
      .sort((a, b) => Number(a.tickIdx) - Number(b.tickIdx));
  } else {
    relevantTicks = ticks
      .filter((tick) => Number(tick.tickIdx) < pool.tick)
      .sort((a, b) => Number(b.tickIdx) - Number(a.tickIdx));
  }

  let volume = 0;
  let liquidity = pool.liquidity;
  let reachedTarget = false;

  for (let i = 0; i < relevantTicks.length; i++) {
    const tick = Number(relevantTicks[i].tickIdx);
    const sqrtAtTick = getSqrtRatioAtTick(tick);

    let targetWithinRange = false;
    if (movingUp) {
      targetWithinRange = targetSqrtPriceX96 <= sqrtAtTick;
    } else {
      targetWithinRange = targetSqrtPriceX96 >= sqrtAtTick;
    }

    if (targetWithinRange) {
      volume += getVolumeWithinRange(currentSqrtPriceX96, targetSqrtPriceX96, liquidity, isOutcomeToken0, swapType);
      reachedTarget = true;
      break;
    }

    volume += getVolumeWithinRange(currentSqrtPriceX96, sqrtAtTick, liquidity, isOutcomeToken0, swapType);
    currentSqrtPriceX96 = sqrtAtTick;
    liquidity += BigInt(relevantTicks[i].liquidityNet) * (movingUp ? 1n : -1n);
  }

  // Empty ticks, or target beyond the last initialized tick: remaining segment with current liquidity.
  if (!reachedTarget) {
    if (
      (movingUp && targetSqrtPriceX96 > currentSqrtPriceX96) ||
      (!movingUp && targetSqrtPriceX96 < currentSqrtPriceX96)
    ) {
      volume += getVolumeWithinRange(currentSqrtPriceX96, targetSqrtPriceX96, liquidity, isOutcomeToken0, swapType);
    }
  }

  return volume;
}

export function getPriceFromVolume(
  pool: PoolVolumeInfo,
  ticks: PoolTick[],
  targetVolume: number,
  outcome: Address,
  swapType: "buy" | "sell",
): number | undefined {
  const tolerance = 1e-12;
  const isOutcomeToken0 = isTwoStringsEqual(pool.token0, outcome);
  const currentPrice = Number(tickToPrice(pool.tick, 18, true)[isOutcomeToken0 ? 0 : 1]);

  if (targetVolume <= 0) {
    return currentPrice;
  }

  // Search only on the side of the book the trade moves price toward.
  const low = swapType === "buy" ? currentPrice : 0.001;
  const high = swapType === "buy" ? 1 : currentPrice;
  if (low >= high) {
    return currentPrice;
  }

  let searchLow = low;
  let searchHigh = high;
  let mid = currentPrice;

  for (let i = 0; i < 60; i++) {
    mid = (searchLow + searchHigh) / 2;
    const vol = getVolumeUntilPrice(pool, ticks, mid, outcome, swapType);

    if (Math.abs(vol - targetVolume) <= tolerance) break;

    if (swapType === "buy") {
      if (vol < targetVolume) searchLow = mid;
      else searchHigh = mid;
    } else {
      if (vol < targetVolume) searchHigh = mid;
      else searchLow = mid;
    }
  }

  // Insufficient simulated depth: hide rather than report the hard cap (e.g. 1.000).
  const volAtMid = getVolumeUntilPrice(pool, ticks, mid, outcome, swapType);
  if (volAtMid + tolerance < targetVolume) {
    return undefined;
  }

  return mid;
}

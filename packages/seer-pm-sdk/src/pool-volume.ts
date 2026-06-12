import { TickMath, encodeSqrtRatioX96 } from "@uniswap/v3-sdk";
import type { Address } from "viem";
import { formatUnits } from "viem";
import { decimalToFraction, tickToPrice } from "./liquidity-utils";
import { isTwoStringsEqual } from "./quote-utils";

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
  let currentSqrtPriceX96 = BigInt(TickMath.getSqrtRatioAtTick(pool.tick).toString());
  const [num, den] = decimalToFraction(isOutcomeToken0 ? targetPrice : 1 / targetPrice);
  const targetSqrtPriceX96 = BigInt(encodeSqrtRatioX96(num, den).toString());

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

  for (let i = 0; i < relevantTicks.length; i++) {
    const tick = Number(relevantTicks[i].tickIdx);
    const sqrtAtTick = BigInt(TickMath.getSqrtRatioAtTick(tick).toString());

    let targetWithinRange = false;
    if (movingUp) {
      targetWithinRange = targetSqrtPriceX96 <= sqrtAtTick;
    } else {
      targetWithinRange = targetSqrtPriceX96 >= sqrtAtTick;
    }

    if (targetWithinRange) {
      volume += getVolumeWithinRange(currentSqrtPriceX96, targetSqrtPriceX96, liquidity, isOutcomeToken0, swapType);
      break;
    }

    volume += getVolumeWithinRange(currentSqrtPriceX96, sqrtAtTick, liquidity, isOutcomeToken0, swapType);
    currentSqrtPriceX96 = sqrtAtTick;
    liquidity += BigInt(relevantTicks[i].liquidityNet) * (movingUp ? 1n : -1n);
  }

  return volume;
}

export function getPriceFromVolume(
  pool: PoolVolumeInfo,
  ticks: PoolTick[],
  targetVolume: number,
  outcome: Address,
  swapType: "buy" | "sell",
): number {
  const tolerance = 1e-12;
  const isOutcomeToken0 = isTwoStringsEqual(pool.token0, outcome);
  const currentPrice = Number(tickToPrice(pool.tick, 18, true)[isOutcomeToken0 ? 0 : 1]);

  if (targetVolume <= 0) {
    return currentPrice;
  }

  let low = 0.001;
  let high = 1;
  let mid = currentPrice;

  for (let i = 0; i < 60; i++) {
    mid = (low + high) / 2;
    const vol = getVolumeUntilPrice(pool, ticks, mid, outcome, swapType);

    if (Math.abs(vol - targetVolume) <= tolerance) break;

    if (swapType === "buy") {
      if (vol < targetVolume) low = mid;
      else high = mid;
    } else {
      if (vol < targetVolume) high = mid;
      else low = mid;
    }
  }

  return mid;
}

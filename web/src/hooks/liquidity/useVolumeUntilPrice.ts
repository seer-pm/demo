import { Market } from "@/lib/market";
import { isTwoStringsEqual } from "@/lib/utils";
import { TickMath, encodeSqrtRatioX96 } from "@uniswap/v3-sdk";
import { Address, formatUnits } from "viem";
import { useTicksData } from "./useTicksData";
import { decimalToFraction, tickToPrice } from "./utils";

export function getVolumeWithinRange(
  currentSqrtPriceX96: bigint,
  targetSqrtPriceX96: bigint,
  liquidity: bigint,
  isOutcomeToken0: boolean,
  swapType: "buy" | "sell",
): number {
  if (swapType === "buy" && targetSqrtPriceX96 <= currentSqrtPriceX96) return 0;
  if (swapType === "sell" && targetSqrtPriceX96 >= currentSqrtPriceX96) return 0;

  if (swapType === "buy") {
    if (isOutcomeToken0) {
      // Buy token0: price goes UP, we're trading token1 for token0
      // Amount of token0 we get: Δx = L * (√P_target - √P_current) / (√P_target * √P_current)
      const amount0 =
        (liquidity * (1n << 96n) * (targetSqrtPriceX96 - currentSqrtPriceX96)) /
        (targetSqrtPriceX96 * currentSqrtPriceX96);
      return Number(formatUnits(amount0, 18));
    }
    // Buy token1: price goes DOWN, we're trading token0 for token1
    // Amount of token1 we get: Δy = L * (√P_current - √P_target) / (2^96)
    const amount1 = (liquidity * (currentSqrtPriceX96 - targetSqrtPriceX96)) / (1n << 96n);
    return Number(formatUnits(amount1, 18));
  }
  if (isOutcomeToken0) {
    // Sell token0: price goes DOWN, we're trading token0 for token1
    // Amount of token0 we sell: Δx = L * (√P_current - √P_target) / (√P_target * √P_current)
    const amount0 =
      (liquidity * (1n << 96n) * (currentSqrtPriceX96 - targetSqrtPriceX96)) /
      (targetSqrtPriceX96 * currentSqrtPriceX96);
    return Number(formatUnits(amount0, 18));
  }
  // Sell token1: price goes UP, we're trading token1 for token0
  // Amount of token1 we sell: Δy = L * (√P_target - √P_current) / (2^96)
  const amount1 = (liquidity * (targetSqrtPriceX96 - currentSqrtPriceX96)) / (1n << 96n);
  return Number(formatUnits(amount1, 18));
}

export function getVolumeUntilPrice(
  pool: {
    liquidity: bigint;
    tickSpacing: number;
    tick: number;
    token0: Address;
    token1: Address;
  },
  ticks: { liquidityNet: string; tickIdx: string }[],
  targetPrice: number,
  outcome: Address,
  swapType: "buy" | "sell",
): number {
  const isOutcomeToken0 = isTwoStringsEqual(pool.token0, outcome);
  // Exact sqrt prices for current and target
  let currentSqrtPriceX96 = TickMath.getSqrtRatioAtTick(pool.tick);
  const [num, den] = decimalToFraction(isOutcomeToken0 ? targetPrice : 1 / targetPrice);
  const targetSqrtPriceX96 = encodeSqrtRatioX96(num, den);
  if (swapType === "buy" && targetSqrtPriceX96 <= currentSqrtPriceX96) return 0;
  if (swapType === "sell" && targetSqrtPriceX96 >= currentSqrtPriceX96) return 0;

  // Determine direction and filter/sort ticks
  const movingUp = (isOutcomeToken0 && swapType === "buy") || (!isOutcomeToken0 && swapType === "sell");

  let relevantTicks: { liquidityNet: string; tickIdx: string }[];
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
    const sqrtAtTick = TickMath.getSqrtRatioAtTick(tick);

    // Check if target price is between current position and this tick
    let targetWithinRange = false;
    if (movingUp) {
      targetWithinRange = targetSqrtPriceX96 <= sqrtAtTick;
    } else {
      targetWithinRange = targetSqrtPriceX96 >= sqrtAtTick;
    }

    if (targetWithinRange) {
      // Target is within this range, calculate partial volume and stop
      volume += getVolumeWithinRange(
        BigInt(currentSqrtPriceX96.toString()),
        BigInt(targetSqrtPriceX96.toString()),
        liquidity,
        isOutcomeToken0,
        swapType,
      );
      break;
    }

    // Otherwise, swap to tick boundary fully
    volume += getVolumeWithinRange(
      BigInt(currentSqrtPriceX96.toString()),
      BigInt(sqrtAtTick.toString()),
      liquidity,
      isOutcomeToken0,
      swapType,
    );

    // Move state to next tick
    currentSqrtPriceX96 = sqrtAtTick;
    liquidity += BigInt(relevantTicks[i].liquidityNet);
  }

  return volume;
}

export function useVolumeUntilPrice(
  market: Market,
  outcome: Address,
  swapType: "buy" | "sell",
  targetPrice: number | undefined,
) {
  const { data: ticksByPool } = useTicksData(
    market,
    market.wrappedTokens.findIndex((x) => isTwoStringsEqual(x, outcome)),
  );
  if (!ticksByPool || !targetPrice || targetPrice > 1 || targetPrice < 0) {
    return;
  }

  const { ticks, poolInfo } = Object.values(ticksByPool)[0];
  const currentPrice = Number(tickToPrice(poolInfo.tick)[isTwoStringsEqual(poolInfo.token0, outcome) ? 0 : 1]);
  if (currentPrice === targetPrice) {
    return;
  }
  return getVolumeUntilPrice(poolInfo, ticks, targetPrice, outcome, swapType);
}

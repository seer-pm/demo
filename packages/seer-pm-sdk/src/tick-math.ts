/** Wrappers around @uniswap/v3-sdk TickMath (bigint-friendly). */
import {
  FeeAmount,
  TICK_SPACINGS,
  TickMath,
  nearestUsableTick,
  encodeSqrtRatioX96 as uniswapEncodeSqrtRatioX96,
} from "@uniswap/v3-sdk";
import JSBI from "jsbi";
import { sqrtPriceX96ToPrice } from "./liquidity-utils";

export { nearestUsableTick };

export const MIN_TICK = TickMath.MIN_TICK;
export const MAX_TICK = TickMath.MAX_TICK;

export const UNISWAP_V3_TICK_SPACINGS: Record<number, number> = {
  [FeeAmount.LOWEST]: TICK_SPACINGS[FeeAmount.LOWEST],
  [FeeAmount.LOW_200]: TICK_SPACINGS[FeeAmount.LOW_200],
  [FeeAmount.LOW_300]: TICK_SPACINGS[FeeAmount.LOW_300],
  [FeeAmount.LOW_400]: TICK_SPACINGS[FeeAmount.LOW_400],
  [FeeAmount.LOW]: TICK_SPACINGS[FeeAmount.LOW],
  [FeeAmount.MEDIUM]: TICK_SPACINGS[FeeAmount.MEDIUM],
  [FeeAmount.HIGH]: TICK_SPACINGS[FeeAmount.HIGH],
};

export function uniswapV3TickSpacing(feeTier: number): number {
  return UNISWAP_V3_TICK_SPACINGS[feeTier] ?? TICK_SPACINGS[FeeAmount.MEDIUM];
}

export function getSqrtRatioAtTick(tick: number): bigint {
  return BigInt(TickMath.getSqrtRatioAtTick(tick).toString());
}

export function tickToPrice(tick: number, decimals = 18, keepPrecision = false) {
  return sqrtPriceX96ToPrice(getSqrtRatioAtTick(tick), decimals, keepPrecision);
}

export function getTickAtSqrtRatio(sqrtPriceX96: bigint): number {
  return TickMath.getTickAtSqrtRatio(JSBI.BigInt(sqrtPriceX96.toString()));
}

export function encodeSqrtRatioX96(amount1: bigint | string | number, amount0: bigint | string | number): bigint {
  return BigInt(uniswapEncodeSqrtRatioX96(amount1.toString(), amount0.toString()).toString());
}

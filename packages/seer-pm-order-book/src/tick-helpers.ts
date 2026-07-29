/** Wrappers around @uniswap/v3-sdk tick helpers used only by the order book. */
import { TickMath, nearestUsableTick } from "@uniswap/v3-sdk";
import JSBI from "jsbi";

export { nearestUsableTick };

export function getTickAtSqrtRatio(sqrtPriceX96: bigint): number {
  return TickMath.getTickAtSqrtRatio(JSBI.BigInt(sqrtPriceX96.toString()));
}

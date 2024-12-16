import { JSBI } from "@swapr/sdk";
import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { FeeAmount, Pool, TICK_SPACINGS, TickMath } from "@uniswap/v3-sdk";
import { BigNumber } from "ethers";
import { TickProcessed } from "./interfaces";

const MAX_UINT128 = BigNumber.from(2).pow(128).sub(1);
function maxAmount(token: Token) {
  return CurrencyAmount.fromRawAmount(token, MAX_UINT128.toString());
}

/** Calculates tokens locked in the active tick range based on the current tick */
export async function calculateActiveRangeTokensLocked(
  token0: Token,
  token1: Token,
  feeTier: FeeAmount,
  tick: TickProcessed,
  poolData: {
    sqrtPriceX96?: JSBI;
    currentTick?: number;
    liquidity?: JSBI;
  },
): Promise<{ amount0Locked: number; amount1Locked: number } | undefined> {
  if (!poolData.currentTick || !poolData.sqrtPriceX96 || !poolData.liquidity) {
    return undefined;
  }

  try {
    const liqGross = JSBI.greaterThan(tick.liquidityNet, JSBI.BigInt(0))
      ? tick.liquidityNet
      : JSBI.multiply(tick.liquidityNet, JSBI.BigInt("-1"));

    const mockTicks = [
      {
        index: tick.tick,
        liquidityGross: liqGross,
        liquidityNet: JSBI.multiply(tick.liquidityNet, JSBI.BigInt("-1")),
      },
      {
        index: tick.tick + TICK_SPACINGS[feeTier],
        liquidityGross: liqGross,
        liquidityNet: tick.liquidityNet,
      },
    ];
    // Initialize pool containing only the active range
    const pool1 = new Pool(
      token0,
      token1,
      feeTier,
      poolData.sqrtPriceX96,
      tick.liquidityActive,
      poolData.currentTick,
      mockTicks,
    );
    // Calculate amount of token0 that would need to be swapped to reach the bottom of the range
    const bottomOfRangePrice = TickMath.getSqrtRatioAtTick(mockTicks[0].index);
    const token1Amount = (await pool1.getOutputAmount(maxAmount(token0), bottomOfRangePrice))[0];
    const amount0Locked = Number.parseFloat(tick.sdkPrice.invert().quote(token1Amount).toExact());

    // Calculate amount of token1 that would need to be swapped to reach the top of the range
    const topOfRangePrice = TickMath.getSqrtRatioAtTick(mockTicks[1].index);
    const token0Amount = (await pool1.getOutputAmount(maxAmount(token1), topOfRangePrice))[0];
    const amount1Locked = Number.parseFloat(tick.sdkPrice.quote(token0Amount).toExact());

    return { amount0Locked, amount1Locked };
  } catch {
    return { amount0Locked: 0, amount1Locked: 0 };
  }
}
/** Returns amounts of tokens locked in the given tick. Reference: https://docs.uniswap.org/sdk/v3/guides/advanced/active-liquidity */
export async function calculateTokensLocked(
  token0: Token,
  token1: Token,
  feeTier: FeeAmount,
  tick: TickProcessed,
): Promise<{ amount0Locked: number; amount1Locked: number }> {
  try {
    const tickSpacing = TICK_SPACINGS[feeTier];
    const liqGross = JSBI.greaterThan(tick.liquidityNet, JSBI.BigInt(0))
      ? tick.liquidityNet
      : JSBI.multiply(tick.liquidityNet, JSBI.BigInt("-1"));

    const sqrtPriceX96 = TickMath.getSqrtRatioAtTick(tick.tick);
    const mockTicks = [
      {
        index: tick.tick,
        liquidityGross: liqGross,
        liquidityNet: JSBI.multiply(tick.liquidityNet, JSBI.BigInt("-1")),
      },
      {
        index: tick.tick + TICK_SPACINGS[feeTier],
        liquidityGross: liqGross,
        liquidityNet: tick.liquidityNet,
      },
    ];

    // Initialize pool containing only the current range
    const pool = new Pool(token0, token1, Number(feeTier), sqrtPriceX96, tick.liquidityActive, tick.tick, mockTicks);

    // Calculate token amounts that would need to be swapped to reach the next range
    const nextSqrtX96 = TickMath.getSqrtRatioAtTick(tick.tick - tickSpacing);
    const maxAmountToken0 = CurrencyAmount.fromRawAmount(token0, MAX_UINT128.toString());
    const token1Amount = (await pool.getOutputAmount(maxAmountToken0, nextSqrtX96))[0];
    const amount0Locked = Number.parseFloat(tick.sdkPrice.invert().quote(token1Amount).toExact());
    const amount1Locked = Number.parseFloat(token1Amount.toExact());

    return { amount0Locked, amount1Locked };
  } catch {
    return { amount0Locked: 0, amount1Locked: 0 };
  }
}

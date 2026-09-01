import { TickMath } from "@uniswap/v3-sdk";
import { describe, expect, it } from "vitest";
import { getAmountsForLiquidity, getSqrtRatioAtTickX96, sqrtPriceX96FromToken1Price } from "./utils";

const Q96 = 2n ** 96n;

describe("sqrtPriceX96FromToken1Price", () => {
  // Round-tripping is the property that matters: this derivation replaces the subgraph's
  // sqrtPrice, which dex_pool_hour_prices does not store.
  it.each([0.73418934, 0.10559868, 3.515734, 1.3417496, 0.15575135])("round-trips %f", (price) => {
    const sqrtP = sqrtPriceX96FromToken1Price(price);
    const back = (Number(sqrtP) / 2 ** 96) ** 2;
    expect(back).toBeCloseTo(price, 8);
  });

  it("returns 0 for prices that cannot produce a sqrt price", () => {
    expect(sqrtPriceX96FromToken1Price(0)).toBe(0n);
    expect(sqrtPriceX96FromToken1Price(-1)).toBe(0n);
    expect(sqrtPriceX96FromToken1Price(Number.NaN)).toBe(0n);
  });
});

describe("getAmountsForLiquidity", () => {
  const tickLower = -6000;
  const tickUpper = 6000;
  const lo = getSqrtRatioAtTickX96(tickLower);
  const hi = getSqrtRatioAtTickX96(tickUpper);
  const L = 10n ** 18n;

  it("holds only token0 below the range", () => {
    // The replaced calculateBurnAmounts returned only token1 here.
    const { amount0, amount1 } = getAmountsForLiquidity(getSqrtRatioAtTickX96(tickLower - 1000), lo, hi, L);
    expect(amount1).toBe(0n);
    expect(amount0).toBeGreaterThan(0n);
  });

  it("holds only token1 above the range", () => {
    // The replaced calculateBurnAmounts returned only token0 here.
    const { amount0, amount1 } = getAmountsForLiquidity(getSqrtRatioAtTickX96(tickUpper + 1000), lo, hi, L);
    expect(amount0).toBe(0n);
    expect(amount1).toBeGreaterThan(0n);
  });

  it("holds both inside the range", () => {
    const { amount0, amount1 } = getAmountsForLiquidity(getSqrtRatioAtTickX96(0), lo, hi, L);
    expect(amount0).toBeGreaterThan(0n);
    expect(amount1).toBeGreaterThan(0n);
  });

  it("is continuous at the range boundaries", () => {
    // Continuity is what proves the branches are assigned the right way round: at the lower tick
    // the position must equal its all-token0 limit, and one tick inside must be within a hair.
    const atLower = getAmountsForLiquidity(lo, lo, hi, L);
    const justInside = getAmountsForLiquidity(getSqrtRatioAtTickX96(tickLower + 1), lo, hi, L);
    expect(atLower.amount1).toBe(0n);
    expect(Number(justInside.amount0) / Number(atLower.amount0)).toBeCloseTo(1, 3);

    const atUpper = getAmountsForLiquidity(hi, lo, hi, L);
    const justBelow = getAmountsForLiquidity(getSqrtRatioAtTickX96(tickUpper - 1), lo, hi, L);
    expect(atUpper.amount0).toBe(0n);
    expect(Number(justBelow.amount1) / Number(atUpper.amount1)).toBeCloseTo(1, 3);
  });

  it("matches the closed form for an in-range position", () => {
    const sqrtP = getSqrtRatioAtTickX96(0);
    const { amount0, amount1 } = getAmountsForLiquidity(sqrtP, lo, hi, L);
    // amount0 = L * (1/sqrtP - 1/sqrtUpper), amount1 = L * (sqrtP - sqrtLower)
    expect(amount0).toBe((L * Q96 * (hi - sqrtP)) / (sqrtP * hi));
    expect(amount1).toBe((L * (sqrtP - lo)) / Q96);
  });

  it("scales linearly with liquidity", () => {
    const sqrtP = getSqrtRatioAtTickX96(0);
    const one = getAmountsForLiquidity(sqrtP, lo, hi, L);
    const ten = getAmountsForLiquidity(sqrtP, lo, hi, L * 10n);
    expect(ten.amount0 / one.amount0).toBe(10n);
    expect(ten.amount1 / one.amount1).toBe(10n);
  });

  it("tolerates swapped bounds and rejects degenerate input", () => {
    const sqrtP = getSqrtRatioAtTickX96(0);
    expect(getAmountsForLiquidity(sqrtP, hi, lo, L)).toEqual(getAmountsForLiquidity(sqrtP, lo, hi, L));
    expect(getAmountsForLiquidity(sqrtP, lo, hi, 0n)).toEqual({ amount0: 0n, amount1: 0n });
    expect(getAmountsForLiquidity(sqrtP, 0n, hi, L)).toEqual({ amount0: 0n, amount1: 0n });
  });
});

describe("getSqrtRatioAtTickX96", () => {
  it("memoises without changing the value", () => {
    expect(getSqrtRatioAtTickX96(1234)).toBe(getSqrtRatioAtTickX96(1234));
    expect(getSqrtRatioAtTickX96(1234)).toBe(BigInt(TickMath.getSqrtRatioAtTick(1234).toString()));
  });
});

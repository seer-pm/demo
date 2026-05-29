import { buildOrderBookPoolKey, chainSupportsOrderBook, clampProbability } from "@seer-pm/sdk";
import { getSqrtRatioAtTick } from "@seer-pm/sdk";
import {
  computeLimitOrderParams,
  computePositionAmounts,
  formatLimitOrderPriceHint,
  getNearestLimitOrderPrice,
  probabilityRangeToTicks,
  probabilityToTick,
  resolveLimitOrderZeroForOne,
  resolveLiquiditySqrtPriceX96,
} from "@seer-pm/sdk/order-book";
import { describe, expect, it } from "vitest";

describe("order-book", () => {
  it("chainSupportsOrderBook only on Base", () => {
    expect(chainSupportsOrderBook(8453)).toBe(true);
    expect(chainSupportsOrderBook(10)).toBe(false);
  });

  it("clampProbability bounds values", () => {
    expect(clampProbability(0)).toBe(0.01);
    expect(clampProbability(1)).toBe(0.99);
    expect(clampProbability(0.5)).toBe(0.5);
  });

  it("probabilityToTick returns usable ticks for outcome as token0", () => {
    const tick = probabilityToTick(0.5, true);
    expect(Math.abs(tick) % 60).toBe(0);
    expect(tick).toBeLessThanOrEqual(0);
  });

  it("probabilityToTick returns usable ticks for outcome as token1", () => {
    const tick = probabilityToTick(0.5, false);
    expect(tick % 60).toBe(0);
    expect(tick).toBeGreaterThanOrEqual(0);
  });

  it("probabilityRangeToTicks orders tick bounds", () => {
    const { tickLower, tickUpper } = probabilityRangeToTicks(0.2, 0.8, true);
    expect(tickLower).toBeLessThan(tickUpper);
  });

  it("buildOrderBookPoolKey sorts tokens", () => {
    const key = buildOrderBookPoolKey(
      "0x0000000000000000000000000000000000000002",
      "0x0000000000000000000000000000000000000001",
      8453,
    );
    expect(key).not.toBeNull();
    expect(key!.currency0.toLowerCase()).toBe("0x0000000000000000000000000000000000000001");
    expect(key!.currency1.toLowerCase()).toBe("0x0000000000000000000000000000000000000002");
  });

  it("computePositionAmounts derives paired amount from amount1", () => {
    const poolKey = buildOrderBookPoolKey(
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002",
      8453,
    )!;

    const outcomeIsToken0 = false;
    const minPrice = 0.01;
    const maxPrice = 0.99;
    const { tickLower, tickUpper } = probabilityRangeToTicks(minPrice, maxPrice, outcomeIsToken0);
    const sqrtPriceX96 = resolveLiquiditySqrtPriceX96({
      chainId: 8453,
      poolKey,
      outcomeIsToken0,
      minPrice,
      maxPrice,
      amount1: 1000000000000000000n,
    });

    const { amount0, amount1 } = computePositionAmounts({
      chainId: 8453,
      poolKey,
      sqrtPriceX96,
      tickLower,
      tickUpper,
      amount1: 1000000000000000000n,
    });

    expect(amount1).toBeGreaterThan(999000000000000000n);
    expect(amount0).toBeGreaterThan(0n);
  });

  it("resolveLimitOrderZeroForOne maps buy/sell to deposit token", () => {
    expect(resolveLimitOrderZeroForOne("buy", true)).toBe(false);
    expect(resolveLimitOrderZeroForOne("buy", false)).toBe(true);
    expect(resolveLimitOrderZeroForOne("sell", true)).toBe(true);
    expect(resolveLimitOrderZeroForOne("sell", false)).toBe(false);
  });

  it("getNearestLimitOrderPrice returns usable tick and price", () => {
    const { tick, nearestPrice } = getNearestLimitOrderPrice(0.5, true);
    expect(Math.abs(tick) % 60).toBe(0);
    expect(nearestPrice).toBeGreaterThan(0);
    expect(nearestPrice).toBeLessThanOrEqual(1);
  });

  it("computeLimitOrderParams derives liquidity from pay amount", () => {
    const poolKey = buildOrderBookPoolKey(
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002",
      8453,
    )!;

    const outcomeIsToken0 = true;
    const currentTick = probabilityToTick(0.6, outcomeIsToken0);
    const sqrtPriceX96 = getSqrtRatioAtTick(currentTick);

    const result = computeLimitOrderParams({
      chainId: 8453,
      poolKey,
      outcomeIsToken0,
      swapType: "buy",
      limitPrice: 0.4,
      payAmount: 1000000n,
      currentTick,
      sqrtPriceX96,
      payDecimals: 6,
      receiveDecimals: 18,
    });

    expect(result.liquidity).toBeGreaterThan(0n);
    expect(result.zeroForOne).toBe(false);
    expect(result.totalPay.amount1).toBeGreaterThan(0n);
    expect(result.minReceive.amount0).toBeGreaterThan(0n);
  });

  it("computeLimitOrderParams rejects buy above current price for outcome token0", () => {
    const poolKey = buildOrderBookPoolKey(
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002",
      8453,
    )!;

    const outcomeIsToken0 = true;
    const currentTick = probabilityToTick(0.4, outcomeIsToken0);
    const sqrtPriceX96 = getSqrtRatioAtTick(currentTick);

    expect(() =>
      computeLimitOrderParams({
        chainId: 8453,
        poolKey,
        outcomeIsToken0,
        swapType: "buy",
        limitPrice: 0.6,
        payAmount: 1000000n,
        currentTick,
        sqrtPriceX96,
        payDecimals: 6,
        receiveDecimals: 18,
      }),
    ).toThrow(/For a buy order, set a limit price at or below/);
  });

  it("formatLimitOrderPriceHint describes buy below market for outcome token0", () => {
    expect(formatLimitOrderPriceHint("buy", true, 0.6)).toMatch(/at or below 0\.600/);
    expect(formatLimitOrderPriceHint("sell", true, 0.6)).toMatch(/above 0\.600/);
  });
});

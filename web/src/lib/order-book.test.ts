import { buildOrderBookPoolKey, chainSupportsOrderBook, clampProbability } from "@seer-pm/sdk";
import {
  computeLimitOrderParams,
  computePositionAmounts,
  createV4PoolInstance,
  formatLimitOrderPriceHint,
  getNearestLimitOrderPrice,
  probabilityRangeToTicks,
  probabilityToTick,
  resolveLimitOrderZeroForOne,
  resolveLiquiditySqrtPriceX96,
} from "@seer-pm/sdk/order-book";
import { getSqrtRatioAtTick } from "@seer-pm/sdk/tick-math";
import { Position } from "@uniswap/v4-sdk";
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
    expect(tick).toBeLessThan(60000);
  });

  it("probabilityRangeToTicks maps 0.1-0.99 when outcome is token1", () => {
    const { tickLower, tickUpper } = probabilityRangeToTicks(0.1, 0.99, false);
    expect(tickLower).toBeLessThan(tickUpper);
    expect(tickUpper - tickLower).toBeGreaterThan(1000);
  });

  it("computePositionAmounts derives paired amount from amount1 without pool price", () => {
    const poolKey = buildOrderBookPoolKey(
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002",
      8453,
    )!;

    const outcomeIsToken0 = false;
    const minPrice = 0.1;
    const maxPrice = 0.99;
    const initialPrice = 0.5;
    const { tickLower, tickUpper } = probabilityRangeToTicks(minPrice, maxPrice, outcomeIsToken0);
    const sqrtPriceX96 = resolveLiquiditySqrtPriceX96({
      chainId: 8453,
      poolKey,
      outcomeIsToken0,
      minPrice,
      maxPrice,
      initialPrice,
    });

    const { amount0, amount1 } = computePositionAmounts({
      chainId: 8453,
      poolKey,
      sqrtPriceX96,
      tickLower,
      tickUpper,
      amount1: 20000000000000000n,
    });

    expect(amount1).toBeGreaterThan(19900000000000000n);
    expect(amount0).toBeGreaterThan(0n);
    expect(amount0).toBeLessThan(1000000000000000000n);
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
    const initialPrice = 0.5;
    const { tickLower, tickUpper } = probabilityRangeToTicks(minPrice, maxPrice, outcomeIsToken0);
    const sqrtPriceX96 = resolveLiquiditySqrtPriceX96({
      chainId: 8453,
      poolKey,
      outcomeIsToken0,
      minPrice,
      maxPrice,
      initialPrice,
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

  it("resolveLiquiditySqrtPriceX96 uses initialPrice for new pools", () => {
    const poolKey = buildOrderBookPoolKey(
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002",
      8453,
    )!;

    const outcomeIsToken0 = false;
    const initialPrice = 0.65;
    const sqrtPriceX96 = resolveLiquiditySqrtPriceX96({
      chainId: 8453,
      poolKey,
      outcomeIsToken0,
      minPrice: 0.1,
      maxPrice: 0.9,
      initialPrice,
    });

    expect(sqrtPriceX96).toBe(
      getSqrtRatioAtTick(probabilityToTick(initialPrice, outcomeIsToken0, poolKey.tickSpacing)),
    );
  });

  it("resolveLiquiditySqrtPriceX96 throws without initialPrice or pool price", () => {
    const poolKey = buildOrderBookPoolKey(
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002",
      8453,
    )!;

    expect(() =>
      resolveLiquiditySqrtPriceX96({
        chainId: 8453,
        poolKey,
        outcomeIsToken0: false,
        minPrice: 0.1,
        maxPrice: 0.9,
      }),
    ).toThrow(/initialPrice is required/);
  });

  it("resolveLiquiditySqrtPriceX96 prefers pool price when initialized", () => {
    const poolKey = buildOrderBookPoolKey(
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002",
      8453,
    )!;

    const poolSqrtPriceX96 = getSqrtRatioAtTick(probabilityToTick(0.4, false));
    const sqrtPriceX96 = resolveLiquiditySqrtPriceX96({
      chainId: 8453,
      poolKey,
      outcomeIsToken0: false,
      minPrice: 0.1,
      maxPrice: 0.9,
      initialPrice: 0.65,
      poolSqrtPriceX96,
    });

    expect(sqrtPriceX96).toBe(poolSqrtPriceX96);
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

  it("computePositionAmounts matches Position.fromAmount0/1 for pool-sorted tokens", () => {
    const poolKey = buildOrderBookPoolKey(
      "0x5875eee11cf8398102fdad704c9e96607675467a",
      "0xc0ffee0000000000000000000000000000000001",
      8453,
    )!;

    const outcomeIsToken0 = false;
    const { tickLower, tickUpper } = probabilityRangeToTicks(0.49859297, 0.80092425, outcomeIsToken0);
    const sqrtPriceX96 = resolveLiquiditySqrtPriceX96({
      chainId: 8453,
      poolKey,
      outcomeIsToken0,
      minPrice: 0.49859297,
      maxPrice: 0.80092425,
      initialPrice: 0.7,
    });

    const fromYes = computePositionAmounts({
      chainId: 8453,
      poolKey,
      sqrtPriceX96,
      tickLower,
      tickUpper,
      amount1: 20_000_000_000_000_000n,
      token0Decimals: 18,
      token1Decimals: 18,
    });

    const pool = createV4PoolInstance(8453, poolKey, sqrtPriceX96, 0n, undefined, 18, 18);
    const uniswapFromToken1 = Position.fromAmount1({
      pool,
      tickLower,
      tickUpper,
      amount1: 20_000_000_000_000_000n.toString(),
    });

    expect(fromYes.amount0).toBe(BigInt(uniswapFromToken1.mintAmounts.amount0.toString()));
    expect(fromYes.amount1).toBe(BigInt(uniswapFromToken1.mintAmounts.amount1.toString()));

    const fromCollateral = computePositionAmounts({
      chainId: 8453,
      poolKey,
      sqrtPriceX96,
      tickLower,
      tickUpper,
      amount0: 20_000_000_000_000_000n,
      token0Decimals: 18,
      token1Decimals: 18,
    });

    const uniswapFromToken0 = Position.fromAmount0({
      pool,
      tickLower,
      tickUpper,
      amount0: 20_000_000_000_000_000n.toString(),
      useFullPrecision: true,
    });

    expect(fromCollateral.amount0).toBe(BigInt(uniswapFromToken0.mintAmounts.amount0.toString()));
    expect(fromCollateral.amount1).toBe(BigInt(uniswapFromToken0.mintAmounts.amount1.toString()));
  });
});

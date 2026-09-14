import {
  buildOrderBookPoolKey,
  chainSupportsOrderBook,
  clampProbability,
  computeLimitOrderParams,
  computePositionAmounts,
  createV4PoolInstance,
  formatLimitOrderPriceError,
  formatLimitOrderPriceHint,
  formatStartingPriceError,
  getAmountInAtTick,
  getAmountOutAtTick,
  getNearestLimitOrderPrice,
  getOutcomePriceAtTick,
  getStartingPoolState,
  getValidLimitOrderBoundaryPrice,
  probabilityRangeToTicks,
  probabilityToTick,
  resolveLimitOrderZeroForOne,
  resolveLiquiditySqrtPriceX96,
  snapToNearestTickPrice,
  toDecimalPrice,
} from "@seer-pm/order-book/v4";
import { getSqrtRatioAtTick } from "@seer-pm/sdk/tick-math";
import { Position } from "@uniswap/v4-sdk";
import { describe, expect, it } from "vitest";

describe("order-book", () => {
  it("chainSupportsOrderBook on Ethereum, Optimism, and Base", () => {
    expect(chainSupportsOrderBook(1)).toBe(true);
    expect(chainSupportsOrderBook(10)).toBe(true);
    expect(chainSupportsOrderBook(8453)).toBe(true);
    expect(chainSupportsOrderBook(100)).toBe(false);
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
      poolKey,
      outcomeIsToken0,
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
      poolKey,
      outcomeIsToken0,
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
      poolKey,
      outcomeIsToken0,
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
        poolKey,
        outcomeIsToken0: false,
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
      poolKey,
      outcomeIsToken0: false,
      initialPrice: 0.65,
      poolSqrtPriceX96,
    });

    expect(sqrtPriceX96).toBe(poolSqrtPriceX96);
  });

  it("getStartingPoolState snaps the price to a usable tick that round-trips through sqrtPrice", () => {
    for (const outcomeIsToken0 of [true, false]) {
      const { tick, sqrtPriceX96 } = getStartingPoolState(0.65, outcomeIsToken0);
      expect(tick).toBe(probabilityToTick(0.65, outcomeIsToken0));
      expect(Math.abs(tick) % 60).toBe(0);
      expect(sqrtPriceX96).toBe(getSqrtRatioAtTick(tick));
      expect(getOutcomePriceAtTick(tick, outcomeIsToken0)).toBeCloseTo(0.65, 2);
    }
  });

  it("snapToNearestTickPrice rewrites the price as its nearest tick price", () => {
    const snapped = snapToNearestTickPrice("0.65", true);
    expect(Number(snapped)).toBeCloseTo(getNearestLimitOrderPrice(0.65, true).nearestPrice, 8);
    expect(snapToNearestTickPrice(snapped, true)).toBe(snapped);
    expect(snapToNearestTickPrice("", true)).toBe("");
    expect(snapToNearestTickPrice("1.5", true)).toBe("1.5");
    expect(snapToNearestTickPrice("abc", true)).toBe("abc");
  });

  it("toDecimalPrice reads a price typed without a decimal point as cents", () => {
    expect(toDecimalPrice("80")).toBe("0.80");
    expect(toDecimalPrice("5")).toBe("0.5");
    expect(toDecimalPrice("0.8")).toBeUndefined();
    expect(toDecimalPrice("0,8")).toBeUndefined();
    expect(toDecimalPrice("0")).toBeUndefined();
    expect(toDecimalPrice("")).toBeUndefined();
  });

  describe("formatStartingPriceError", () => {
    it.each([true, false])("buy needs the starting price above the limit (outcomeIsToken0=%s)", (outcomeIsToken0) => {
      const limitTick = getNearestLimitOrderPrice(0.6, outcomeIsToken0).tick;
      const above = getStartingPoolState(0.65, outcomeIsToken0).tick;
      const same = getStartingPoolState(0.6, outcomeIsToken0).tick;
      const below = getStartingPoolState(0.55, outcomeIsToken0).tick;

      expect(formatStartingPriceError("buy", outcomeIsToken0, above, limitTick)).toBeUndefined();
      expect(formatStartingPriceError("buy", outcomeIsToken0, same, limitTick)).toBe(
        "Starting price must be above your buy price.",
      );
      expect(formatStartingPriceError("buy", outcomeIsToken0, below, limitTick)).toBe(
        "Starting price must be above your buy price.",
      );
    });

    it.each([true, false])("sell needs the starting price below the limit (outcomeIsToken0=%s)", (outcomeIsToken0) => {
      const limitTick = getNearestLimitOrderPrice(0.6, outcomeIsToken0).tick;
      const above = getStartingPoolState(0.65, outcomeIsToken0).tick;
      const same = getStartingPoolState(0.6, outcomeIsToken0).tick;
      const below = getStartingPoolState(0.55, outcomeIsToken0).tick;

      expect(formatStartingPriceError("sell", outcomeIsToken0, below, limitTick)).toBeUndefined();
      expect(formatStartingPriceError("sell", outcomeIsToken0, same, limitTick)).toBe(
        "Starting price must be below your sell price.",
      );
      expect(formatStartingPriceError("sell", outcomeIsToken0, above, limitTick)).toBe(
        "Starting price must be below your sell price.",
      );
    });

    it("agrees with computeLimitOrderParams on the boundary", () => {
      const poolKey = buildOrderBookPoolKey(
        "0x0000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000002",
        8453,
      )!;
      const outcomeIsToken0 = true;
      const limitTick = getNearestLimitOrderPrice(0.6, outcomeIsToken0).tick;

      for (const startingPrice of [0.58, 0.6, 0.62, 0.7]) {
        const state = getStartingPoolState(startingPrice, outcomeIsToken0, poolKey.tickSpacing);
        const error = formatStartingPriceError("buy", outcomeIsToken0, state.tick, limitTick, poolKey.tickSpacing);
        const place = () =>
          computeLimitOrderParams({
            chainId: 8453,
            poolKey,
            outcomeIsToken0,
            swapType: "buy",
            limitPrice: 0.6,
            payAmount: 10n ** 18n,
            currentTick: state.tick,
            sqrtPriceX96: state.sqrtPriceX96,
          });
        if (error) {
          expect(place).toThrow();
        } else {
          expect(place).not.toThrow();
        }
      }
    });
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
    });

    expect(result.liquidity).toBeGreaterThan(0n);
    expect(result.zeroForOne).toBe(false);
    expect(result.totalPay.amount1).toBeGreaterThan(0n);
    expect(result.minReceive.amount0).toBeGreaterThan(0n);
    // Min receive is the exact conversion of the paid amount at the order tick.
    expect(result.minReceive.amount0).toBe(getAmountOutAtTick(result.totalPay.amount1, result.tick, false));
  });

  describe("getAmountOutAtTick / getAmountInAtTick", () => {
    it("converts exactly at tick 0 (price 1) in both directions", () => {
      expect(getAmountOutAtTick(10n ** 18n, 0, true)).toBe(10n ** 18n);
      expect(getAmountOutAtTick(10n ** 18n, 0, false)).toBe(10n ** 18n);
      expect(getAmountInAtTick(10n ** 18n, 0, true)).toBe(10n ** 18n);
    });

    it("matches the float price at the tick and keeps full precision on large amounts", () => {
      const tick = probabilityToTick(0.37, true);
      const price = getOutcomePriceAtTick(tick, true); // token1 per token0
      const amountIn = 123_456_789n * 10n ** 18n;
      const out = getAmountOutAtTick(amountIn, tick, true);
      const expected = Number(amountIn) * price;
      expect(Math.abs(Number(out) - expected) / expected).toBeLessThan(1e-12);
      // The bigint result is exact: it is not a float rounded to a multiple of 2^k.
      expect(out % 1000n).not.toBe(0n);
    });

    it("amountIn is the smallest input that yields at least amountOut", () => {
      const tick = probabilityToTick(0.63, false);
      const amountOut = 5n * 10n ** 18n;
      for (const zeroForOne of [true, false]) {
        const amountIn = getAmountInAtTick(amountOut, tick, zeroForOne);
        expect(getAmountOutAtTick(amountIn, tick, zeroForOne)).toBeGreaterThanOrEqual(amountOut);
        expect(getAmountOutAtTick(amountIn - 1n, tick, zeroForOne)).toBeLessThan(amountOut);
      }
    });

    it("returns 0 for non-positive amounts", () => {
      expect(getAmountOutAtTick(0n, 100, true)).toBe(0n);
      expect(getAmountInAtTick(-1n, 100, false)).toBe(0n);
    });
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
    const { price: boundaryPrice } = getValidLimitOrderBoundaryPrice("buy", outcomeIsToken0, currentTick);
    const marketPrice = getOutcomePriceAtTick(currentTick, outcomeIsToken0);

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
      }),
    ).toThrow(
      new RegExp(
        `For a buy order, set a limit price at or below ${boundaryPrice.toFixed(3)} \\(market ${marketPrice.toFixed(3)}\\)`,
      ),
    );
  });

  it("getValidLimitOrderBoundaryPrice for buy near 0.454 requires ~0.450", () => {
    const outcomeIsToken0 = true;
    // Mid-spacing tick whose displayed market price is ~0.454
    const currentTick = -7896;
    const marketPrice = getOutcomePriceAtTick(currentTick, outcomeIsToken0);
    expect(marketPrice.toFixed(3)).toBe("0.454");

    const { tick, price } = getValidLimitOrderBoundaryPrice("buy", outcomeIsToken0, currentTick);
    expect(tick).toBe(-7980);
    expect(price.toFixed(3)).toBe("0.450");

    const poolKey = buildOrderBookPoolKey(
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002",
      8453,
    )!;
    const sqrtPriceX96 = getSqrtRatioAtTick(currentTick);

    expect(() =>
      computeLimitOrderParams({
        chainId: 8453,
        poolKey,
        outcomeIsToken0,
        swapType: "buy",
        limitPrice: 0.453,
        payAmount: 1000000n,
        currentTick,
        sqrtPriceX96,
      }),
    ).toThrow(/at or below 0\.450 \(market 0\.454\)/);

    const accepted = computeLimitOrderParams({
      chainId: 8453,
      poolKey,
      outcomeIsToken0,
      swapType: "buy",
      limitPrice: price,
      payAmount: 1000000n,
      currentTick,
      sqrtPriceX96,
    });
    expect(accepted.tick).toBe(tick);
    expect(accepted.liquidity).toBeGreaterThan(0n);
  });

  it("formatLimitOrderPriceHint describes buy below boundary for outcome token0", () => {
    expect(formatLimitOrderPriceHint("buy", true, 0.45)).toMatch(/at or below 0\.450/);
    expect(formatLimitOrderPriceHint("sell", true, 0.45)).toMatch(/at or above 0\.450/);
  });

  it("formatLimitOrderPriceError includes boundary and market", () => {
    expect(formatLimitOrderPriceError("buy", true, 0.45, 0.454)).toBe(
      "For a buy order, set a limit price at or below 0.450 (market 0.454).",
    );
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
      poolKey,
      outcomeIsToken0,
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

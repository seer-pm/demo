import { getOrderBookPoolParams } from "@seer-pm/order-book";
import type { Market } from "@seer-pm/sdk";
import { base } from "viem/chains";
import { describe, expect, it } from "vitest";
import {
  type PoolMeta,
  formatPriceCents,
  getOrderPayAmount,
  getOrderSideLabel,
  getOutcomeMarketPrice,
  getPriceToFill,
} from "./ordersShared";

const market = {
  chainId: base.id,
  type: "Generic",
  collateralToken: "0x0000000000000000000000000000000000000003",
  wrappedTokens: ["0x0000000000000000000000000000000000000002", "0x0000000000000000000000000000000000000001"],
  outcomes: ["Yes", "No"],
} as unknown as Market;

function poolMeta(outcomeIndex: number): PoolMeta {
  const params = getOrderBookPoolParams(market, outcomeIndex);
  return { outcomeIndex, outcomeIsToken0: params.outcomeIsToken0, poolKey: params.poolKey, market };
}

describe("getOrderPayAmount", () => {
  const pool = poolMeta(0);
  const tickSpacing = pool.poolKey.tickSpacing;
  const buy = !pool.outcomeIsToken0; // zeroForOne that buys the outcome
  const liquidity = 10n ** 18n;

  it("buys pay collateral and sells pay the outcome token", () => {
    const buyPay = getOrderPayAmount(liquidity, -tickSpacing * 10, buy, pool, market);
    const sellPay = getOrderPayAmount(liquidity, tickSpacing * 10, !buy, pool, market);
    expect(getOrderSideLabel(buy, pool.outcomeIsToken0)).toBe("Buy");
    expect(buyPay?.symbol).not.toBe("Yes");
    expect(sellPay?.symbol).toBe("Yes");
    expect(buyPay?.amount).toBeGreaterThan(0n);
    expect(sellPay?.amount).toBeGreaterThan(0n);
  });

  it("returns null for zero liquidity", () => {
    expect(getOrderPayAmount(0n, 0, buy, pool, market)).toBeNull();
  });
});

describe("formatPriceCents", () => {
  it("reads prices as cents with one decimal, two below 10¢", () => {
    expect(formatPriceCents(0.4017)).toBe("40.2¢");
    expect(formatPriceCents(0.4)).toBe("40¢");
    expect(formatPriceCents(0.0999)).toBe("9.99¢");
    expect(formatPriceCents(0.0035)).toBe("0.35¢");
  });

  it("renders unknown prices as a dash", () => {
    expect(formatPriceCents(undefined)).toBe("—");
    expect(formatPriceCents(Number.NaN)).toBe("—");
    expect(formatPriceCents(-1)).toBe("—");
  });
});

describe("getOutcomeMarketPrice", () => {
  it("converts the market's percentage odds to a price", () => {
    const withOdds = { ...market, odds: [35.2, null] } as unknown as Market;
    expect(getOutcomeMarketPrice(withOdds, 0)).toBeCloseTo(0.352);
    expect(getOutcomeMarketPrice(withOdds, 1)).toBeUndefined();
    expect(getOutcomeMarketPrice(undefined, 0)).toBeUndefined();
  });
});

describe("getPriceToFill", () => {
  it("measures buys down to the limit and sells up to it", () => {
    expect(getPriceToFill("Buy", 0.3, 0.35)).toBeCloseTo(0.05);
    expect(getPriceToFill("Sell", 0.4, 0.35)).toBeCloseTo(0.05);
    expect(getPriceToFill("Buy", 0.4, 0.35)).toBeLessThan(0);
  });
});

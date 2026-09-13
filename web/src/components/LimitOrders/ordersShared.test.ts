import { getOrderBookPoolParams } from "@seer-pm/order-book";
import type { Market } from "@seer-pm/sdk";
import { base } from "viem/chains";
import { describe, expect, it } from "vitest";
import { type PoolMeta, getOrderPayAmount, getOrderSideLabel } from "./ordersShared";

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

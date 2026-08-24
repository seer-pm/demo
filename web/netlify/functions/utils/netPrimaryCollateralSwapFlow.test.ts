import type { Token, TransactionData } from "@seer-pm/sdk";
import { parseUnits, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";
import {
  type CollateralPriceByMarketId,
  computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents,
} from "./netPrimaryCollateralSwapFlow";

const PRIMARY = "0x00000000000000000000000000000000000000aa";
const PARENT_OUTCOME = "0x00000000000000000000000000000000000000bb";
const CHILD_OUTCOME = "0x00000000000000000000000000000000000000cc";
const MARKET_ROOT = "0x0000000000000000000000000000000000000001";
const MARKET_CHILD = "0x0000000000000000000000000000000000000002";

const primary: Token = {
  address: PRIMARY,
  symbol: "USDC",
  decimals: 6,
  chainId: 10,
};

function swap(
  partial: Partial<TransactionData> &
    Pick<TransactionData, "tokenIn" | "tokenOut" | "amountIn" | "amountOut" | "collateral" | "marketId">,
): TransactionData {
  return {
    marketName: "test",
    type: "swap",
    blockNumber: 1,
    timestamp: 100,
    ...partial,
  };
}

describe("computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents", () => {
  const startTimes = [0];
  const endTime = 1000;

  it("counts primary buy/sell volume and netOut like before", () => {
    const prices: CollateralPriceByMarketId = new Map([[MARKET_ROOT, 1]]);
    const swaps = [
      swap({
        marketId: MARKET_ROOT,
        collateral: PRIMARY as `0x${string}`,
        tokenIn: PRIMARY,
        tokenOut: CHILD_OUTCOME,
        amountIn: parseUnits("10", 6).toString(),
        amountOut: parseUnits("5", 18).toString(),
      }),
      swap({
        marketId: MARKET_ROOT,
        collateral: PRIMARY as `0x${string}`,
        tokenIn: CHILD_OUTCOME,
        tokenOut: PRIMARY,
        amountIn: parseUnits("2", 18).toString(),
        amountOut: parseUnits("3", 6).toString(),
        timestamp: 200,
      }),
    ];

    const flow = computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents(swaps, startTimes, endTime, primary, prices);

    expect(flow.volumeByStartTime.get(0)).toBe(13);
    expect(flow.netOutByStartTime.get(0)).toBe(7);
    expect(flow.buysByStartTime.get(0)).toBe(10);
    expect(flow.marketCountByStartTime.get(0)).toBe(1);
  });

  it("prices conditional child volume at 1/N (e.g. 1/15)", () => {
    const prices: CollateralPriceByMarketId = new Map([[MARKET_CHILD.toLowerCase(), 1 / 15]]);
    const swaps = [
      swap({
        marketId: MARKET_CHILD,
        collateral: PARENT_OUTCOME as `0x${string}`,
        tokenIn: PARENT_OUTCOME,
        tokenOut: CHILD_OUTCOME,
        amountIn: parseUnits("10", 18).toString(),
        amountOut: parseUnits("4", 18).toString(),
      }),
    ];

    const flow = computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents(swaps, startTimes, endTime, primary, prices);

    expect(flow.volumeByStartTime.get(0)).toBeCloseTo(10 / 15, 10);
    expect(flow.netOutByStartTime.get(0)).toBe(0);
    expect(flow.buysByStartTime.get(0)).toBe(0);
    expect(flow.marketCountByStartTime.get(0)).toBe(1);
  });

  it("counts market when collateral price is 0 but still had a collateral leg", () => {
    const prices: CollateralPriceByMarketId = new Map([[MARKET_CHILD.toLowerCase(), 0]]);
    const swaps = [
      swap({
        marketId: MARKET_CHILD,
        collateral: PARENT_OUTCOME as `0x${string}`,
        tokenIn: PARENT_OUTCOME,
        tokenOut: CHILD_OUTCOME,
        amountIn: parseUnits("10", 18).toString(),
        amountOut: parseUnits("4", 18).toString(),
      }),
    ];

    const flow = computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents(swaps, startTimes, endTime, primary, prices);

    expect(flow.volumeByStartTime.get(0)).toBe(0);
    expect(flow.marketCountByStartTime.get(0)).toBe(1);
    expect(flow.buysByStartTime.get(0)).toBe(0);
  });

  it("does not double-count root markets where collateral is primary", () => {
    const prices: CollateralPriceByMarketId = new Map([[MARKET_ROOT.toLowerCase(), 1]]);
    const swaps = [
      swap({
        marketId: MARKET_ROOT,
        collateral: PRIMARY as `0x${string}`,
        tokenIn: PRIMARY,
        tokenOut: CHILD_OUTCOME,
        amountIn: parseUnits("5", 6).toString(),
        amountOut: parseUnits("1", 18).toString(),
      }),
    ];

    const flow = computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents(swaps, startTimes, endTime, primary, prices);

    expect(flow.volumeByStartTime.get(0)).toBe(5);
    expect(flow.buysByStartTime.get(0)).toBe(5);
  });

  it("falls back to primary when swap.collateral is missing", () => {
    const prices: CollateralPriceByMarketId = new Map();
    const swaps = [
      swap({
        marketId: MARKET_ROOT,
        collateral: zeroAddress,
        tokenIn: PRIMARY,
        tokenOut: CHILD_OUTCOME,
        amountIn: parseUnits("2", 6).toString(),
        amountOut: parseUnits("1", 18).toString(),
      }),
    ];
    // Explicitly clear collateral to exercise the fallback path.
    const withoutCollateral = { ...swaps[0], collateral: undefined as unknown as `0x${string}` };

    const flow = computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents(
      [withoutCollateral],
      startTimes,
      endTime,
      primary,
      prices,
    );

    expect(flow.volumeByStartTime.get(0)).toBe(2);
    expect(flow.buysByStartTime.get(0)).toBe(2);
  });
});

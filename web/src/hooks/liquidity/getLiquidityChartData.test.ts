import { describe, expect, it } from "vitest";
import { getLiquidityChartData, getRangeAmounts } from "./getLiquidityChartData";

const OUTCOME = "0x0000000000000000000000000000000000000001";
const COLLATERAL = "0x0000000000000000000000000000000000000002";
const LIQUIDITY = 10n ** 21n;

// Outcome is token0 (prices below tick 0 are outcome prices under 1.0), the pool sits at tick -6000
// and one LP range covers [-12000, 0], so the chart has a buy range [-12000, -6000] and a sell
// range [-6000, 0]. The chart pads the LP range with filler ticks every 120 ticks, so with zoom 1
// it draws one range per side: [-6120, -6000] and [-6000, -5880]. Amount lists have one entry per
// range; the price list has one per boundary.
const pool = { liquidity: LIQUIDITY, tickSpacing: 60, tick: -6000, token0: OUTCOME as `0x${string}` };
const ticks = [
  { tickIdx: "-12000", liquidityNet: LIQUIDITY.toString() },
  { tickIdx: "0", liquidityNet: (-LIQUIDITY).toString() },
];
const SELL_RANGE = 1;
const BUY_RANGE = 0;

const values = (series: (number | undefined)[][]) => series.map((point) => point[1] as number);

describe("getLiquidityChartData", () => {
  it("splits a bar into its liquidity and limit-order portions without changing the total", () => {
    const base = getLiquidityChartData(pool, ticks, true, 1, OUTCOME);
    const orderLiquidity = LIQUIDITY / 4n;
    const withOrders = getLiquidityChartData(pool, ticks, true, 1, OUTCOME, [
      { tickLower: -6000, liquidity: orderLiquidity, orders: 2 },
    ]);

    expect(base.priceList).toHaveLength(3);
    expect(values(base.sellBarsData)[SELL_RANGE]).toBeGreaterThan(0);
    expect(values(base.buyBarsData)[BUY_RANGE]).toBeGreaterThan(0);

    const expectedOrder = Number(getRangeAmounts(orderLiquidity, -6000, -5940).amount0) / 1e18;
    expect(values(withOrders.sellOrderBarsData)[SELL_RANGE]).toBeCloseTo(expectedOrder, 9);
    expect(values(withOrders.sellOrderBarsData)[BUY_RANGE]).toBe(0);
    expect(values(withOrders.buyOrderBarsData).filter(Boolean)).toEqual([]);
    expect(withOrders.orderCounts).toEqual([0, 2]);

    for (const i of [BUY_RANGE, SELL_RANGE]) {
      const baseTotal = values(base.sellBarsData)[i] + values(base.buyBarsData)[i];
      const splitTotal =
        values(withOrders.sellBarsData)[i] +
        values(withOrders.sellOrderBarsData)[i] +
        values(withOrders.buyBarsData)[i] +
        values(withOrders.buyOrderBarsData)[i];
      expect(splitTotal).toBeCloseTo(baseTotal, 9);
    }
    expect(withOrders.sellLineData).toEqual(base.sellLineData);
    expect(withOrders.buyLineData).toEqual(base.buyLineData);
  });

  it("attributes buy-side orders to the buy bars", () => {
    const withOrders = getLiquidityChartData(pool, ticks, true, 1, OUTCOME, [
      { tickLower: -6060, liquidity: LIQUIDITY / 2n, orders: 1 },
    ]);
    expect(values(withOrders.buyOrderBarsData)[BUY_RANGE]).toBeGreaterThan(0);
    expect(values(withOrders.sellOrderBarsData).filter(Boolean)).toEqual([]);
    expect(withOrders.orderCounts).toEqual([1, 0]);
  });

  it("ignores levels outside the charted ranges and caps the order portion at the bar", () => {
    const withOrders = getLiquidityChartData(pool, ticks, true, 1, OUTCOME, [
      { tickLower: 600, liquidity: LIQUIDITY, orders: 3 },
      { tickLower: -5940, liquidity: LIQUIDITY * 10n, orders: 1 },
    ]);
    expect(withOrders.orderCounts).toEqual([0, 1]);
    expect(values(withOrders.sellBarsData)[SELL_RANGE]).toBe(0);
    expect(values(withOrders.sellOrderBarsData)[SELL_RANGE]).toBeGreaterThan(0);
  });

  it("returns the previous series when there are no levels", () => {
    const base = getLiquidityChartData(pool, ticks, true, 1, OUTCOME);
    expect(values(base.sellOrderBarsData).filter(Boolean)).toEqual([]);
    expect(values(base.buyOrderBarsData).filter(Boolean)).toEqual([]);
    expect(base.orderCounts).toEqual([0, 0]);
    expect(values(base.sellBarsData)[base.priceList.length - 1]).toBeUndefined();
  });

  it("activates a position ending at the current tick when walking down", () => {
    // A limit order at [-6060, -6000] with the pool at tick -6000: not active, so its liquidity is
    // not in pool.liquidity, and its -L net sits exactly at the current tick.
    const orderLiquidity = LIQUIDITY / 2n;
    const ticksWithOrder = [
      { tickIdx: "-12000", liquidityNet: LIQUIDITY.toString() },
      { tickIdx: "-6060", liquidityNet: orderLiquidity.toString() },
      { tickIdx: "-6000", liquidityNet: (-orderLiquidity).toString() },
      { tickIdx: "0", liquidityNet: (-LIQUIDITY).toString() },
    ];
    const data = getLiquidityChartData(pool, ticksWithOrder, true, 1, OUTCOME, [
      { tickLower: -6060, liquidity: orderLiquidity, orders: 1 },
    ]);
    // Buy range is [-6060, -6000] (the order tick is the nearest lower tick).
    const buyTotal = values(data.buyBarsData)[BUY_RANGE] + values(data.buyOrderBarsData)[BUY_RANGE];
    const expectedTotal = Number(getRangeAmounts(LIQUIDITY + orderLiquidity, -6060, -6000).amount0) / 1e18;
    expect(buyTotal).toBeCloseTo(expectedTotal, 9);
    expect(values(data.buyOrderBarsData)[BUY_RANGE]).toBeCloseTo(
      Number(getRangeAmounts(orderLiquidity, -6060, -6000).amount0) / 1e18,
      9,
    );
    expect(values(data.buyBarsData)[BUY_RANGE]).toBeGreaterThan(0);
  });

  it("keeps order data aligned with the price list in the token1 view", () => {
    // Outcome is token1: outcome prices under 1.0 are ticks above 0. Mirror of the token0 fixture.
    const token1Pool = { ...pool, tick: 6000, token0: COLLATERAL as `0x${string}` };
    const token1Ticks = [
      { tickIdx: "0", liquidityNet: LIQUIDITY.toString() },
      { tickIdx: "12000", liquidityNet: (-LIQUIDITY).toString() },
    ];
    // A sell of the outcome (token1) sits below the current tick, at [5940, 6000].
    const withOrders = getLiquidityChartData(token1Pool, token1Ticks, false, 1, OUTCOME, [
      { tickLower: 5940, liquidity: LIQUIDITY / 4n, orders: 2 },
    ]);
    // The token1 view reverses the ranges, so [6000, 6120] (buy side) comes first.
    expect(withOrders.orderCounts).toEqual([0, 2]);
    expect(values(withOrders.sellOrderBarsData)[1]).toBeGreaterThan(0);
    expect(values(withOrders.buyOrderBarsData)[1]).toBe(0);
    const expectedOrder = Number(getRangeAmounts(LIQUIDITY / 4n, 5940, 6000).amount1) / 1e18;
    expect(values(withOrders.sellOrderBarsData)[1]).toBeCloseTo(expectedOrder, 9);
  });
});

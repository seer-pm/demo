import { describe, expect, it } from "vitest";
import { cumulativeCostRows } from "./cumulativeCostRows";
describe("cumulative pool cost", () => {
  it("adds each ask at its own price from best to worst, then reverses for display", () => {
    const rows = cumulativeCostRows(
      [
        { price: 0.4, shares: 10 },
        { price: 0.3, shares: 20 },
      ],
      "sell",
    );
    expect(rows.map((r) => r.total)).toEqual([10, 6]);
    expect(rows.map((r) => r.pct)).toEqual([1, 0.6]);
  });
  it("starts bids independently at the highest price and keeps full precision", () => {
    const rows = cumulativeCostRows(
      [
        { price: 0.2, shares: 1.234 },
        { price: 0.3, shares: 2.345 },
      ],
      "buy",
    );
    expect(rows[0].total).toBeCloseTo(0.7035);
    expect(rows[1].total).toBeCloseTo(0.9503);
  });
  it("omits missing and empty levels without poisoning totals", () => {
    expect(
      cumulativeCostRows(
        [
          { price: Number.NaN, shares: 3 },
          { price: 0.3, shares: 0 },
        ],
        "sell",
      ),
    ).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { volumePriceForParentOutcome } from "./volumeCollateralPrice";

function numerators(count: number): bigint[] {
  return Array.from({ length: count }, () => 1n);
}

describe("volumePriceForParentOutcome", () => {
  it("returns 1/N for an unresolved parent", () => {
    expect(volumePriceForParentOutcome(numerators(15))).toBeCloseTo(1 / 15, 10);
  });

  it("returns 1/N for a resolved winning outcome", () => {
    const payoutNumerators = [...numerators(14), 0n];
    payoutNumerators[3] = 1n;
    expect(volumePriceForParentOutcome(payoutNumerators)).toBeCloseTo(1 / 15, 10);
  });

  it("returns 1/N for a resolved losing outcome", () => {
    const payoutNumerators = [...numerators(14), 0n];
    payoutNumerators[3] = 1n;
    expect(volumePriceForParentOutcome(payoutNumerators)).toBeCloseTo(1 / 15, 10);
  });

  it("returns 0 when there are no payout numerators", () => {
    expect(volumePriceForParentOutcome([])).toBe(0);
  });
});

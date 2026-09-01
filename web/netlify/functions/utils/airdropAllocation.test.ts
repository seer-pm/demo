import { describe, expect, it } from "vitest";
import {
  HOLDINGS_SHARE_FACTOR,
  SEER_PER_DAY,
  holdingsSeerFromShare,
  pohSeerFromShare,
  projectedSeerFromShare,
} from "./airdropAllocation";

describe("airdropAllocation", () => {
  it("emits 200M SEER over 30 days", () => {
    expect(SEER_PER_DAY * 30).toBe(200_000_000);
  });

  it("converts a summed holdings share to SEER", () => {
    // A wallet holding the entire supply for a single day earns one day's holdings pool.
    expect(holdingsSeerFromShare(1)).toBe(SEER_PER_DAY * HOLDINGS_SHARE_FACTOR);
    expect(holdingsSeerFromShare(0)).toBe(0);
  });

  it("uses the same conversion for the PoH pool", () => {
    expect(pohSeerFromShare(0.37)).toBe(holdingsSeerFromShare(0.37));
  });

  it("is linear, so ordering by raw share matches ordering by SEER", () => {
    // The leaderboard endpoint relies on this: it sorts in Postgres on the raw share sums and
    // presents the converted SEER amounts.
    const shares = [0, 0.001, 0.5, 12.75, 900];
    const converted = shares.map(holdingsSeerFromShare);
    expect(converted).toEqual([...converted].sort((a, b) => a - b));
    expect(holdingsSeerFromShare(2)).toBeCloseTo(2 * holdingsSeerFromShare(1), 6);
  });

  it("projects forward over N days", () => {
    // toBeCloseTo, not toBe: the projection multiplies in a different order than
    // 30 * holdingsSeerFromShare(...), so the two differ in the last float ulp.
    expect(projectedSeerFromShare(0.1, 30)).toBeCloseTo(30 * holdingsSeerFromShare(0.1), 6);
  });
});

import { describe, expect, it } from "vitest";
import {
  GENESIS_TIMESTAMP,
  POOL_SHARE_FACTOR,
  SEER_PER_DAY,
  computePctOfAirdrop,
  computePctOfPool,
  countSnapshotDays,
} from "./constants";

const DAY = 86400;

describe("countSnapshotDays", () => {
  it("counts genesis itself as one snapshot", () => {
    expect(countSnapshotDays(GENESIS_TIMESTAMP)).toBe(1);
  });

  it("ignores the random-in-day offset of a snapshot timestamp", () => {
    // getRandomNextDayTimestamp samples a random second inside the day, so any offset under a full
    // day must land on the same count.
    expect(countSnapshotDays(GENESIS_TIMESTAMP + DAY)).toBe(2);
    expect(countSnapshotDays(GENESIS_TIMESTAMP + DAY + 1)).toBe(2);
    expect(countSnapshotDays(GENESIS_TIMESTAMP + 2 * DAY - 1)).toBe(2);
  });

  it("returns 0 before genesis rather than a negative count", () => {
    expect(countSnapshotDays(GENESIS_TIMESTAMP - 1)).toBe(0);
    expect(countSnapshotDays(0)).toBe(0);
  });

  it("returns 0 for a missing or malformed timestamp", () => {
    expect(countSnapshotDays(Number.NaN)).toBe(0);
  });
});

describe("computePctOfAirdrop", () => {
  /** What a user accruing `shareOfPool` of one pool every day ends up holding. */
  const accrue = (shareOfPool: number, days: number) => days * SEER_PER_DAY * POOL_SHARE_FACTOR * shareOfPool;

  it("reports a tenth of the PoH pool as 2.5% of the whole airdrop", () => {
    const days = 690;
    expect(computePctOfAirdrop(accrue(0.1, days), days)).toBeCloseTo(2.5, 10);
  });

  it("is independent of how many days the program has run", () => {
    for (const days of [1, 30, 690, 5000]) {
      expect(computePctOfAirdrop(accrue(0.1, days), days)).toBeCloseTo(2.5, 10);
    }
  });

  it("tops out at 50% for someone taking both pools entirely — LP is the other half", () => {
    const days = 690;
    expect(computePctOfAirdrop(accrue(1, days) * 2, days)).toBeCloseTo(50, 10);
  });

  it("returns 0 before any snapshot exists instead of dividing by zero", () => {
    expect(computePctOfAirdrop(1234, 0)).toBe(0);
    expect(Number.isFinite(computePctOfAirdrop(1234, 0))).toBe(true);
  });
});

describe("computePctOfPool", () => {
  /** What a user accruing `shareOfPool` of one pool every day ends up holding. */
  const accrue = (shareOfPool: number, days: number) => days * SEER_PER_DAY * POOL_SHARE_FACTOR * shareOfPool;

  it("reports a tenth of a pool as 10% of that pool", () => {
    const days = 690;
    expect(computePctOfPool(accrue(0.1, days), days)).toBeCloseTo(10, 10);
  });

  it("is independent of how many days the program has run", () => {
    for (const days of [1, 30, 690, 5000]) {
      expect(computePctOfPool(accrue(0.1, days), days)).toBeCloseTo(10, 10);
    }
  });

  it("tops out at 100% for someone taking a pool entirely", () => {
    const days = 690;
    expect(computePctOfPool(accrue(1, days), days)).toBeCloseTo(100, 10);
  });

  it("is the whole-airdrop percentage scaled up by the pool's share of it", () => {
    // The two functions differ only by POOL_SHARE_FACTOR, which is what keeps the leaderboard's
    // per-pool columns and the portfolio tab's single figure describing the same allocation.
    const days = 690;
    const allocation = accrue(0.37, days);
    expect(computePctOfPool(allocation, days)).toBeCloseTo(
      computePctOfAirdrop(allocation, days) / POOL_SHARE_FACTOR,
      10,
    );
  });

  it("returns 0 before any snapshot exists instead of dividing by zero", () => {
    expect(computePctOfPool(1234, 0)).toBe(0);
    expect(Number.isFinite(computePctOfPool(1234, 0))).toBe(true);
  });
});

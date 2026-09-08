import { describe, expect, it } from "vitest";
import {
  GENESIS_TIMESTAMP,
  LP_POOL_SHARE_FACTOR,
  POOL_SHARE_FACTOR,
  SEER_PER_DAY,
  computePctOfAirdrop,
  computePctOfLpp,
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

  it("tops out at 25% for one pool taken entirely", () => {
    // The leaderboard scores holdings and PoH separately against this same denominator, so each
    // of its two percentage columns caps at a quarter and the pair adds to the wallet's share of
    // everything emitted.
    const days = 690;
    expect(computePctOfAirdrop(accrue(1, days), days)).toBeCloseTo(25, 10);
  });

  it("is additive across the two pools", () => {
    const days = 690;
    const holdings = accrue(0.4, days);
    const poh = accrue(0.1, days);
    expect(computePctOfAirdrop(holdings, days) + computePctOfAirdrop(poh, days)).toBeCloseTo(
      computePctOfAirdrop(holdings + poh, days),
      10,
    );
  });

  it("returns 0 before any snapshot exists instead of dividing by zero", () => {
    expect(computePctOfAirdrop(1234, 0)).toBe(0);
    expect(Number.isFinite(computePctOfAirdrop(1234, 0))).toBe(true);
  });
});

describe("computePctOfLpp", () => {
  it("splits the airdrop into three shares that add up to the whole", () => {
    expect(2 * POOL_SHARE_FACTOR + LP_POOL_SHARE_FACTOR).toBe(1);
  });

  it("reports the whole LP supply as the programme's 50%", () => {
    expect(computePctOfLpp(1_000, 1_000)).toBeCloseTo(50, 10);
  });

  it("reports a tenth of the LP supply as 5% of the whole airdrop", () => {
    // Half the programme, a tenth of it held: on the same scale as computePctOfAirdrop, so the
    // board's three percentage columns can be read side by side.
    expect(computePctOfLpp(100, 1_000)).toBeCloseTo(5, 10);
  });

  it("depends only on the ratio, not the size of the pool", () => {
    for (const total of [1, 1_000, 4.2e21]) {
      expect(computePctOfLpp(total / 4, total)).toBeCloseTo(12.5, 10);
    }
  });

  it("sums to the programme's whole share across the board", () => {
    // Which is what the excluded-contract filter protects: a numerator dropped from the board
    // while its balance stayed in the denominator would leave this short of 50%.
    const balances = [500, 300, 150, 50];
    const total = balances.reduce((a, b) => a + b, 0);
    const summed = balances.reduce((acc, b) => acc + computePctOfLpp(b, total), 0);
    expect(summed).toBeCloseTo(50, 10);
  });

  it("adds to computePctOfAirdrop on the same scale, capping a wallet at 100%", () => {
    const days = 690;
    const wholePool = days * SEER_PER_DAY * POOL_SHARE_FACTOR;
    const everything = computePctOfAirdrop(wholePool * 2, days) + computePctOfLpp(1, 1);
    expect(everything).toBeCloseTo(100, 10);
  });

  it("returns 0 rather than dividing by zero when the board holds no LP", () => {
    expect(computePctOfLpp(0, 0)).toBe(0);
    expect(computePctOfLpp(1234, 0)).toBe(0);
    // A malformed total falls into the same guard: `> 0` is false for NaN.
    expect(computePctOfLpp(1234, Number.NaN)).toBe(0);
    expect(computePctOfLpp(1234, -5)).toBe(0);
  });
});

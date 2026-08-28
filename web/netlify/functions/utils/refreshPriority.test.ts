import { describe, expect, it } from "vitest";
import { type LeaderboardCandidate, rankRefreshCandidates, refreshPriority } from "./pnlLeaderboardRollup";

const DAY = 86_400;
const day = (d: number) => d * DAY;
const ms = (d: number) => d * DAY * 1000;

describe("refreshPriority", () => {
  it("puts a wallet that was never materialized first", () => {
    expect(refreshPriority({ lastActivityDay: 0, lastUpdatedMs: null })).toBe(0);
  });

  it("marks a wallet dirty when it acted on or after the day it was last computed", () => {
    expect(refreshPriority({ lastActivityDay: day(100), lastUpdatedMs: ms(100) })).toBe(1);
    expect(refreshPriority({ lastActivityDay: day(101), lastUpdatedMs: ms(100) })).toBe(1);
  });

  it("leaves a wallet computed after its last activity in the trailing tier", () => {
    expect(refreshPriority({ lastActivityDay: day(99), lastUpdatedMs: ms(100) })).toBe(2);
  });

  it("does not drop old wallets — MTM drifts without activity, so they only lose priority", () => {
    // Activity two years ago, computed yesterday: still queued, just last.
    expect(refreshPriority({ lastActivityDay: day(1), lastUpdatedMs: ms(900) })).toBe(2);
  });
});

describe("rankRefreshCandidates", () => {
  const c = (address: string, lastActivityDay: number): LeaderboardCandidate => ({ address, lastActivityDay });

  it("orders never-materialized, then dirty, then oldest computed", () => {
    const candidates = [
      c("0xc", day(99)), // computed after activity -> trailing
      c("0xb", day(101)), // dirty
      c("0xa", 0), // never materialized
    ];
    const updated = new Map<string, number | null>([
      ["0xc", ms(100)],
      ["0xb", ms(100)],
      ["0xa", null],
    ]);

    expect(rankRefreshCandidates(candidates, updated).map((x) => x.address)).toEqual(["0xa", "0xb", "0xc"]);
  });

  it("breaks ties within a tier by oldest computation", () => {
    const candidates = [c("0xnew", day(50)), c("0xold", day(50))];
    const updated = new Map<string, number | null>([
      ["0xnew", ms(90)],
      ["0xold", ms(10)],
    ]);
    expect(rankRefreshCandidates(candidates, updated).map((x) => x.address)).toEqual(["0xold", "0xnew"]);
  });

  it("is deterministic when everything else ties", () => {
    const candidates = [c("0xb", 0), c("0xa", 0)];
    const updated = new Map<string, number | null>([
      ["0xa", ms(5)],
      ["0xb", ms(5)],
    ]);
    expect(rankRefreshCandidates(candidates, updated).map((x) => x.address)).toEqual(["0xa", "0xb"]);
  });

  it("matches addresses case-insensitively against the lookup", () => {
    const candidates = [c("0xABC", day(200))];
    const updated = new Map<string, number | null>([["0xabc", ms(100)]]);
    // Dirty (tier 1), not treated as never-materialized.
    expect(rankRefreshCandidates(candidates, updated)).toHaveLength(1);
    expect(refreshPriority({ lastActivityDay: day(200), lastUpdatedMs: ms(100) })).toBe(1);
  });

  it("keeps every candidate — ranking reorders, it never filters", () => {
    const candidates = [c("0xa", 0), c("0xb", day(1)), c("0xc", day(2))];
    expect(rankRefreshCandidates(candidates, new Map())).toHaveLength(3);
  });
});

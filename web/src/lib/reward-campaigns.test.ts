import { describe, expect, it } from "vitest";
import { campaignStatus, refundState } from "./reward-campaigns";

describe("campaignStatus", () => {
  it("reads an ended campaign's end and the rate it paid last", () => {
    const rates = [
      { from: 100n, perSecond: 5n },
      { from: 200n, perSecond: 3n },
      { from: 300n, perSecond: 0n },
    ];
    expect(campaignStatus(rates)).toEqual({ ended: true, current: rates[2], lastPaid: rates[1], start: 100, end: 300 });
  });
});

describe("refundState", () => {
  const ended = [
    { from: 100n, perSecond: 5n },
    { from: 300n, perSecond: 0n },
  ];

  it("holds back what the rates since the last release can emit and refunds the rest now", () => {
    expect(refundState({ rates: ended, budget: 3000n, released: 400n, releasedUpTo: 250 })).toEqual({
      kind: "ready",
      amount: 2350n,
      held: 250n,
    });
    // The last release covers the end, so the emission is final and nothing is held.
    expect(refundState({ rates: ended, budget: 1000n, released: 600n, releasedUpTo: 300 })).toEqual({
      kind: "ready",
      amount: 400n,
      held: 0n,
    });
  });

  it("counts each rate only from the last release on", () => {
    const rates = [
      { from: 100n, perSecond: 5n },
      { from: 200n, perSecond: 3n },
      { from: 300n, perSecond: 0n },
    ];
    // 5/s over 150..200, then 3/s over 200..300.
    expect(refundState({ rates, budget: 10_000n, released: 0n, releasedUpTo: 150 })).toEqual({
      kind: "ready",
      amount: 10_000n - 550n,
      held: 550n,
    });
  });

  it("holds the whole rest when the campaign may have emitted it all", () => {
    expect(refundState({ rates: ended, budget: 1000n, released: 0n, releasedUpTo: 0 })).toEqual({
      kind: "held",
      held: 1000n,
    });
  });

  it("has nothing to refund while running, once refunded, or when the budget was spent", () => {
    expect(refundState({ rates: ended.slice(0, 1), budget: 1000n, released: 0n, releasedUpTo: 0 })).toEqual({
      kind: "none",
    });
    expect(refundState({ rates: ended, budget: 600n, released: 600n, releasedUpTo: 300 })).toEqual({ kind: "none" });
  });
});

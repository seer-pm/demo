import { describe, expect, it } from "vitest";
import { campaignStatus, refundShares, refundState } from "./reward-campaigns";

describe("campaignStatus", () => {
  it("reads an ended campaign's end and the rate it paid last", () => {
    const rates = [
      { from: 100n, perSecond: 5n },
      { from: 200n, perSecond: 3n },
      { from: 300n, perSecond: 0n },
    ];
    expect(campaignStatus(rates)).toEqual({ ended: true, current: rates[2], lastPaid: rates[1], start: 100, end: 300 });
  });

  it("treats a campaign restarted after a zero rate as active", () => {
    const rates = [
      { from: 100n, perSecond: 5n },
      { from: 300n, perSecond: 0n },
      { from: 400n, perSecond: 2n },
    ];
    expect(campaignStatus(rates)).toEqual({
      ended: false,
      current: rates[2],
      lastPaid: rates[2],
      start: 100,
      end: undefined,
    });
  });
});

describe("refundState", () => {
  const ended = [
    { from: 100n, perSecond: 5n },
    { from: 300n, perSecond: 0n },
  ];

  it("waits for a release whose cutoff covers the end, then refunds what was not released", () => {
    expect(refundState({ rates: ended, budget: 1000n, released: 400n, releasedUpTo: 299 })).toEqual({
      kind: "waiting",
    });
    expect(refundState({ rates: ended, budget: 1000n, released: 600n, releasedUpTo: 300 })).toEqual({
      kind: "ready",
      amount: 400n,
    });
  });

  it("has nothing to refund while running, once refunded, or when the budget was spent", () => {
    expect(refundState({ rates: ended.slice(0, 1), budget: 1000n, released: 0n, releasedUpTo: 0 })).toEqual({
      kind: "none",
    });
    expect(refundState({ rates: ended, budget: 600n, released: 600n, releasedUpTo: 300 })).toEqual({ kind: "none" });
  });
});

describe("refundShares", () => {
  it("splits in proportion to the deposits, adding up to the unspent amount", () => {
    const shares = refundShares(2000n, [{ amount: 1001n }, { amount: 3000n }]);
    expect(shares.map((d) => d.share)).toEqual([500n, 1500n]);
  });

  it("never gives a depositor more than it deposited when the shares round", () => {
    const shares = refundShares(200n, [{ amount: 100n }, { amount: 100n }, { amount: 1n }]);
    expect(shares.map((d) => d.share)).toEqual([99n, 100n, 1n]);
  });
});

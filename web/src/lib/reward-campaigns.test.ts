import { describe, expect, it } from "vitest";
import { campaignStatus } from "./reward-campaigns";

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

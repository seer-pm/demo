import type { Token, TransactionData } from "@seer-pm/sdk";
import type { Address } from "viem";
import { describe, expect, it } from "vitest";
import { peakCapitalDeployedByMarket } from "./peakCapitalDeployed";
import type { ConditionalEventRow } from "./seerIndexerPortfolio";

const PRIMARY = {
  address: "0xaf204776c7245bf4147c2612bf6e5972ee483701" as Address,
  decimals: 18,
  symbol: "sDAI",
  name: "sDAI",
} as Token;

const MARKET_A = "0xaaaa000000000000000000000000000000000001";
const MARKET_B = "0xbbbb000000000000000000000000000000000002";
const OUTCOME = "0x1111000000000000000000000000000000000001";
const PARENT_OUTCOME = "0x9c58bacc331c9aa871afd802db6379a98e80cedb";

const one = 10n ** 18n;
const wei = (n: number) => (BigInt(Math.round(n * 1e6)) * 10n ** 12n).toString();

function buy(marketId: string, amount: number, timestamp: number): TransactionData {
  return {
    type: "swap",
    marketId,
    marketName: marketId,
    timestamp,
    blockNumber: 1,
    transactionHash: "0xs",
    collateral: PRIMARY.address,
    tokenIn: PRIMARY.address,
    tokenOut: OUTCOME,
    amountIn: wei(amount),
    amountOut: wei(amount * 2),
  } as TransactionData;
}

function sell(marketId: string, amount: number, timestamp: number): TransactionData {
  return {
    type: "swap",
    marketId,
    marketName: marketId,
    timestamp,
    blockNumber: 1,
    transactionHash: "0xs",
    collateral: PRIMARY.address,
    tokenIn: OUTCOME,
    tokenOut: PRIMARY.address,
    amountIn: wei(amount * 2),
    amountOut: wei(amount),
  } as TransactionData;
}

function ev(
  eventType: ConditionalEventRow["eventType"],
  amount: bigint,
  timestamp: number,
  over: Partial<ConditionalEventRow> = {},
): ConditionalEventRow {
  const marketId = over.marketId ?? MARKET_A;
  return {
    id: `100:0xtx-${timestamp}-100:${marketId}`,
    marketId,
    marketEntityId: `100:${marketId}`,
    marketName: marketId,
    eventType,
    amount,
    collateral: PRIMARY.address,
    timestamp,
    blockNumber: 1,
    transactionHash: "0xtx",
    ...over,
  };
}

const run = (
  swaps: TransactionData[],
  conditionalEvents: ConditionalEventRow[],
  opening: Record<string, number> = {},
  startTime = 0,
  endTime = 1_000,
) =>
  peakCapitalDeployedByMarket({
    swaps,
    conditionalEvents,
    openingCapitalByMarket: new Map(Object.entries(opening)),
    primaryCollateral: PRIMARY,
    startTime,
    endTime,
  });

describe("peakCapitalDeployedByMarket", () => {
  it("is invariant to recycling — the whole point of not using the gross sum", () => {
    // Split 1, redeem 1, ten times over. Gross would be 10; the wallet never risked more than 1.
    const events: ConditionalEventRow[] = [];
    for (let i = 0; i < 10; i++) {
      events.push(ev("split", one, 10 + i * 10));
      events.push(ev("redeem", one, 15 + i * 10));
    }
    expect(run([], events).get(MARKET_A)).toBe(1);
  });

  it("matches the gross sum when capital is committed once and held", () => {
    const events = [ev("split", 100n * one, 10)];
    expect(run([], events).get(MARKET_A)).toBe(100);
  });

  it("adds up positions built in stages", () => {
    expect(run([buy(MARKET_A, 10, 10), buy(MARKET_A, 10, 20)], []).get(MARKET_A)).toBe(20);
  });

  it("does not count capital that was returned before being committed again", () => {
    const swaps = [buy(MARKET_A, 10, 10), sell(MARKET_A, 10, 20), buy(MARKET_A, 10, 30)];
    expect(run(swaps, []).get(MARKET_A)).toBe(10);
  });

  it("takes the peak, not the closing balance", () => {
    const swaps = [buy(MARKET_A, 30, 10), sell(MARKET_A, 25, 20)];
    expect(run(swaps, []).get(MARKET_A)).toBe(30);
  });

  it("mixes swap and router legs on the same running balance, ordered by time", () => {
    // split 5 → 5; buy 3 → 8; redeem 5 → 3. Peak 8.
    const swaps = [buy(MARKET_A, 3, 20)];
    const events = [ev("split", 5n * one, 10), ev("redeem", 5n * one, 30)];
    expect(run(swaps, events).get(MARKET_A)).toBe(8);
  });

  it("keeps markets independent", () => {
    const swaps = [buy(MARKET_A, 7, 10), buy(MARKET_B, 4, 20)];
    const peaks = run(swaps, []);
    expect(peaks.get(MARKET_A)).toBe(7);
    expect(peaks.get(MARKET_B)).toBe(4);
  });

  it("floors at zero when the window opens with no recorded position", () => {
    // Selling first with no opening capital must not produce a negative balance.
    const swaps = [sell(MARKET_A, 10, 10), buy(MARKET_A, 2, 20)];
    expect(run(swaps, []).get(MARKET_A)).toBe(2);
  });

  it("starts from the position already open when the window began", () => {
    // Held 12 at the boundary and sold it: the capital at risk was 12, not 0.
    expect(run([sell(MARKET_A, 12, 20)], [], { [MARKET_A]: 12 }).get(MARKET_A)).toBe(12);
  });

  it("adds capital committed during the window to the opening position", () => {
    expect(run([buy(MARKET_A, 8, 20)], [], { [MARKET_A]: 5 }).get(MARKET_A)).toBe(13);
  });

  it("keeps a market whose only capital is the opening position", () => {
    expect(run([], [], { [MARKET_A]: 4 }).get(MARKET_A)).toBe(4);
  });

  it("ignores events outside the window", () => {
    const swaps = [buy(MARKET_A, 50, 5), buy(MARKET_A, 3, 500), buy(MARKET_A, 90, 5_000)];
    expect(run(swaps, [], {}, 10, 1_000).get(MARKET_A)).toBe(3);
  });

  it("ignores legs collateralised in a parent outcome token", () => {
    const events = [ev("split", 40n * one, 10, { collateral: PARENT_OUTCOME as Address })];
    expect(run([], events).has(MARKET_A)).toBe(false);
  });

  it("omits markets that never committed capital", () => {
    expect(run([sell(MARKET_A, 10, 10)], []).has(MARKET_A)).toBe(false);
  });

  it("orders same-second legs by block, not by which array they came from", () => {
    // One second, three blocks: buy 60, redeem 60, split 100. Chain order peaks at 100. Sorting on
    // the timestamp alone left the ties in insertion order — every swap ahead of every event — so
    // the split landed on top of the un-redeemed buy and the peak came out 160.
    const swaps = [{ ...buy(MARKET_A, 60, 100), blockNumber: 10 } as TransactionData];
    const events = [
      ev("split", 100n * one, 100, { blockNumber: 12, id: "100:0xtx-1-split" }),
      ev("redeem", 60n * one, 100, { blockNumber: 11, id: "100:0xtx-0-redeem" }),
    ];
    expect(run(swaps, events).get(MARKET_A)).toBe(100);
  });

  it("orders legs inside one block by log index", () => {
    // Opening 50, then redeem 40 and split 40 in the same block. In chain order the balance dips to
    // 10 and returns to 50, so the peak is the opening 50. Replaying them backwards would invent a
    // 90 that the wallet never had at risk.
    const events = [
      ev("split", 40n * one, 100, { id: "100:0xtx-7-split" }),
      ev("redeem", 40n * one, 100, { id: "100:0xtx-6-redeem" }),
    ];
    expect(run([], events, { [MARKET_A]: 50 }).get(MARKET_A)).toBe(50);
  });
});

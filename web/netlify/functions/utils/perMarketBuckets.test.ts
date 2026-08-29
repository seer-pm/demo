import type { PortfolioPosition, Token, TransactionData } from "@seer-pm/sdk";
import type { Address } from "viem";
import { describe, expect, it } from "vitest";
import { computeLpPrimaryCollateralNetOutForPeriodsFromEvents } from "./lpPrimaryCollateralFlow";
import { computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents } from "./netPrimaryCollateralSwapFlow";
import {
  groupPortfolioValueAtReferenceByMarket,
  groupPortfolioValueCurrentByMarket,
  sumPortfolioValueAtReference,
  sumPortfolioValueCurrent,
} from "./portfolioValuation";
import { type ConditionalEventRow, routerPrimaryCumulativeByMarketAtTimes } from "./seerIndexerPortfolio";

const PRIMARY: Token = {
  address: "0xaf204776c7245bf4147c2612bf6e5972ee483701" as Address,
  decimals: 18,
  symbol: "sDAI",
  name: "sDAI",
  chainId: 100,
} as Token;

const MARKET_A = "0xaaaa000000000000000000000000000000000001";
const MARKET_B = "0xbbbb000000000000000000000000000000000002";
const TOKEN_A1 = "0x1111000000000000000000000000000000000001";
const TOKEN_A2 = "0x1111000000000000000000000000000000000002";
const TOKEN_B1 = "0x2222000000000000000000000000000000000001";

const wei = (n: number) => (BigInt(Math.round(n * 1e6)) * 10n ** 12n).toString();

function position(over: Partial<PortfolioPosition>): PortfolioPosition {
  return {
    tokenId: TOKEN_A1 as Address,
    tokenIndex: 0,
    marketId: MARKET_A as Address,
    marketName: "A",
    marketStatus: "open",
    tokenBalance: 0,
    rawBalance: "0",
    tokenValue: 0,
    tokenPrice: 0,
    outcome: "yes",
    chainId: 100,
    collateralToken: PRIMARY.address,
    redeemedPrice: 0,
    marketFinalizeTs: Number.MAX_SAFE_INTEGER,
    isInvalidOutcome: false,
    ...over,
  } as PortfolioPosition;
}

function swap(over: Partial<TransactionData>): TransactionData {
  return {
    type: "swap",
    marketId: MARKET_A,
    marketName: "A",
    timestamp: 50,
    blockNumber: 1,
    transactionHash: "0xdead",
    collateral: PRIMARY.address,
    tokenIn: PRIMARY.address,
    tokenOut: TOKEN_A1,
    amountIn: wei(0),
    amountOut: wei(0),
    ...over,
  } as TransactionData;
}

function lp(type: "lp" | "lp-burn", marketId: string, primaryAmount: number, timestamp = 50): TransactionData {
  return {
    type,
    marketId,
    marketName: marketId,
    timestamp,
    blockNumber: 1,
    transactionHash: "0xbeef",
    token0: PRIMARY.address,
    token1: TOKEN_A1,
    amount0: wei(primaryAmount),
    amount1: wei(1),
  } as TransactionData;
}

function conditional(over: Partial<ConditionalEventRow> & Pick<ConditionalEventRow, "eventType">): ConditionalEventRow {
  const marketId = over.marketId ?? MARKET_A;
  return {
    id: `100:0xtx-${over.timestamp ?? 0}-100:${marketId}`,
    marketId,
    marketEntityId: `100:${marketId}`,
    marketName: "m",
    amount: 10n ** 18n,
    collateral: PRIMARY.address,
    timestamp: 10,
    blockNumber: 1,
    transactionHash: "0xtx",
    ...over,
  };
}

describe("per-market valuation buckets", () => {
  const positions = [
    position({ tokenId: TOKEN_A1 as Address, marketId: MARKET_A as Address, tokenBalance: 10, tokenPrice: 0.4 }),
    position({ tokenId: TOKEN_A2 as Address, marketId: MARKET_A as Address, tokenBalance: 5, tokenPrice: 0.6 }),
    position({ tokenId: TOKEN_B1 as Address, marketId: MARKET_B as Address, tokenBalance: 2, tokenPrice: 0.25 }),
  ];

  it("splits current MTM by market and folds back to the scalar", () => {
    const byMarket = groupPortfolioValueCurrentByMarket(positions);

    expect(byMarket.get(MARKET_A)).toBeCloseTo(10 * 0.4 + 5 * 0.6, 12);
    expect(byMarket.get(MARKET_B)).toBeCloseTo(2 * 0.25, 12);
    const folded = [...byMarket.values()].reduce((a, b) => a + b, 0);
    expect(folded).toBeCloseTo(sumPortfolioValueCurrent(positions), 12);
  });

  it("splits reference MTM by market and folds back to the scalar", () => {
    const prices = { [TOKEN_A1]: 0.9, [TOKEN_B1]: 0.1 };
    const byMarket = groupPortfolioValueAtReferenceByMarket(positions, prices, 100);

    // TOKEN_A2 has no history price, so it falls back to its current price — same rule as the scalar.
    expect(byMarket.get(MARKET_A)).toBeCloseTo(10 * 0.9 + 5 * 0.6, 12);
    const folded = [...byMarket.values()].reduce((a, b) => a + b, 0);
    expect(folded).toBeCloseTo(sumPortfolioValueAtReference(positions, prices, 100), 12);
  });

  it("uses the redeemed price for markets settled before the reference time", () => {
    const settled = [position({ tokenBalance: 3, tokenPrice: 0.5, redeemedPrice: 1, marketFinalizeTs: 10 })];
    expect(groupPortfolioValueAtReferenceByMarket(settled, {}, 100).get(MARKET_A)).toBe(3);
  });
});

describe("per-market swap buckets", () => {
  it("attributes each swap to its market and folds exactly back to the window totals", () => {
    const swaps = [
      swap({ marketId: MARKET_A, tokenIn: PRIMARY.address, tokenOut: TOKEN_A1, amountIn: wei(10), amountOut: wei(20) }),
      swap({ marketId: MARKET_B, tokenIn: TOKEN_B1, tokenOut: PRIMARY.address, amountIn: wei(4), amountOut: wei(3) }),
    ];

    const flow = computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents(
      swaps,
      [0],
      100,
      PRIMARY,
      new Map(),
      undefined,
      {
        limitRows: 0,
      },
    );
    const buckets = flow.byStartTimeAndMarket.get(0)!;

    expect(buckets.get(MARKET_A)!.buysWei).toBe(10n ** 19n);
    expect(buckets.get(MARKET_B)!.netOutWei).toBe(-3n * 10n ** 18n);

    let netOut = 0n;
    let buys = 0n;
    for (const b of buckets.values()) {
      netOut += b.netOutWei;
      buys += b.buysWei;
    }
    expect(Number(netOut) / 1e18).toBeCloseTo(flow.netOutByStartTime.get(0)!, 12);
    expect(Number(buys) / 1e18).toBeCloseTo(flow.buysByStartTime.get(0)!, 12);
  });

  it("marketCount is the number of buckets flagged as traded", () => {
    const swaps = [
      swap({ marketId: MARKET_A, amountIn: wei(5), amountOut: wei(9) }),
      swap({ marketId: MARKET_B, amountIn: wei(2), amountOut: wei(3) }),
    ];
    const flow = computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents(
      swaps,
      [0],
      100,
      PRIMARY,
      new Map(),
      undefined,
      {
        limitRows: 0,
      },
    );

    const traded = [...flow.byStartTimeAndMarket.get(0)!.values()].filter((b) => b.traded).length;
    expect(traded).toBe(flow.marketCountByStartTime.get(0));
    expect(traded).toBe(2);
  });

  it("keeps a swap out of a window it predates", () => {
    const swaps = [swap({ timestamp: 10, amountIn: wei(5), amountOut: wei(9) })];
    const flow = computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents(
      swaps,
      [50],
      100,
      PRIMARY,
      new Map(),
      undefined,
      {
        limitRows: 0,
      },
    );
    expect(flow.byStartTimeAndMarket.get(50)!.size).toBe(0);
  });
});

describe("per-market LP buckets", () => {
  it("splits mints and burns by market and folds back to the window total", () => {
    const flow = computeLpPrimaryCollateralNetOutForPeriodsFromEvents(
      [lp("lp", MARKET_A, 10), lp("lp", MARKET_B, 4)],
      [lp("lp-burn", MARKET_A, 3)],
      [0],
      100,
      PRIMARY,
    );
    const buckets = flow.netOutWeiByStartTimeAndMarket.get(0)!;

    expect(buckets.get(MARKET_A)).toBe(7n * 10n ** 18n);
    expect(buckets.get(MARKET_B)).toBe(4n * 10n ** 18n);

    let total = 0n;
    for (const v of buckets.values()) total += v;
    expect(Number(total) / 1e18).toBeCloseTo(flow.netOutByStartTime.get(0)!, 12);
  });
});

describe("routerPrimaryCumulativeByMarketAtTimes", () => {
  it("samples the running total per market at each requested time", () => {
    const events = [
      conditional({ eventType: "split", timestamp: 10, marketId: MARKET_A, amount: 5n * 10n ** 18n }),
      conditional({ eventType: "split", timestamp: 20, marketId: MARKET_B, amount: 2n * 10n ** 18n }),
      conditional({ eventType: "redeem", timestamp: 30, marketId: MARKET_A, amount: 8n * 10n ** 18n }),
    ];

    const { byTime } = routerPrimaryCumulativeByMarketAtTimes(events, PRIMARY, [15, 25, 40]);

    expect(byTime.get(15)!.get(MARKET_A)!.netWei).toBe(-5n * 10n ** 18n);
    expect(byTime.get(15)!.has(MARKET_B)).toBe(false);
    expect(byTime.get(25)!.get(MARKET_B)!.netWei).toBe(-2n * 10n ** 18n);
    // A: split −5 then redeem +8 → +3, with gross deployment still 5.
    expect(byTime.get(40)!.get(MARKET_A)!.netWei).toBe(3n * 10n ** 18n);
    expect(byTime.get(40)!.get(MARKET_A)!.splitGrossWei).toBe(5n * 10n ** 18n);
  });

  it("gives each sample its own snapshot rather than a shared reference", () => {
    const events = [conditional({ eventType: "split", timestamp: 10, amount: 10n ** 18n })];
    const { byTime } = routerPrimaryCumulativeByMarketAtTimes(events, PRIMARY, [20, 30]);
    expect(byTime.get(20)!.get(MARKET_A)).not.toBe(byTime.get(30)!.get(MARKET_A));
  });

  it("in-window net equals cum(end) − cum(start), which is what unifies the two formulas", () => {
    const events = [
      conditional({ eventType: "split", timestamp: 10, amount: 5n * 10n ** 18n }),
      conditional({ eventType: "merge", timestamp: 60, amount: 4n * 10n ** 18n }),
    ];
    const { byTime } = routerPrimaryCumulativeByMarketAtTimes(events, PRIMARY, [30, 100]);

    const start = byTime.get(30)!.get(MARKET_A)!.netWei;
    const end = byTime.get(100)!.get(MARKET_A)!.netWei;
    expect(end - start).toBe(4n * 10n ** 18n);
  });

  it("counts a fanned-out leg once", () => {
    const events = [MARKET_A, MARKET_B].map((marketId) =>
      conditional({ eventType: "split", timestamp: 10, marketId, amount: 10n ** 18n, id: "100:0xtx-7-shared" }),
    );
    const { byTime, fannedOutLegs } = routerPrimaryCumulativeByMarketAtTimes(events, PRIMARY, [50]);

    expect(fannedOutLegs).toBe(1);
    let total = 0n;
    for (const v of byTime.get(50)!.values()) total += v.netWei;
    expect(total).toBe(-(10n ** 18n));
  });

  it("ignores legs collateralised in a parent outcome token", () => {
    const events = [conditional({ eventType: "split", timestamp: 10, collateral: TOKEN_B1 as Address })];
    const { byTime } = routerPrimaryCumulativeByMarketAtTimes(events, PRIMARY, [50]);
    expect(byTime.get(50)!.size).toBe(0);
  });
});

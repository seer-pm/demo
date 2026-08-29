import type { PortfolioPosition, Token, TransactionData } from "@seer-pm/sdk";
import type { Address } from "viem";
import { describe, expect, it } from "vitest";
import { computeLpPrimaryCollateralNetOutForPeriodsFromEvents } from "./lpPrimaryCollateralFlow";
import { buildMarketPeriodBuckets } from "./marketPeriodBuckets";
import { computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents } from "./netPrimaryCollateralSwapFlow";
import { sumPortfolioValueAtReference, sumPortfolioValueCurrent } from "./portfolioValuation";
import { PORTFOLIO_PL_PERIODS, type PortfolioPlPeriod } from "./seerIndexerPortfolio";
import { type ConditionalEventRow, routerPrimaryNetFromConditionalEvents } from "./seerIndexerPortfolio";

const PRIMARY = {
  address: "0xaf204776c7245bf4147c2612bf6e5972ee483701" as Address,
  decimals: 18,
  symbol: "sDAI",
  name: "sDAI",
  chainId: 100,
} as Token;

const M_TRADED = "0xaaaa000000000000000000000000000000000001";
const M_SPLIT_ONLY = "0xbbbb000000000000000000000000000000000002";
const M_LP_ONLY = "0xcccc000000000000000000000000000000000003";
const TOKEN = "0x1111000000000000000000000000000000000001";

const START = 1_000;
const END = 2_000;
const wei = (n: number) => (BigInt(Math.round(n * 1e6)) * 10n ** 12n).toString();

const perPeriod = <T>(value: T): Record<PortfolioPlPeriod, T> =>
  Object.fromEntries(PORTFOLIO_PL_PERIODS.map((p) => [p, value])) as Record<PortfolioPlPeriod, T>;

function position(marketId: string, balance: number, price: number): PortfolioPosition {
  return {
    tokenId: TOKEN as Address,
    tokenIndex: 0,
    marketId: marketId as Address,
    marketName: marketId,
    marketStatus: "open",
    tokenBalance: balance,
    rawBalance: "0",
    tokenValue: 0,
    tokenPrice: price,
    outcome: "yes",
    chainId: 100,
    collateralToken: PRIMARY.address,
    redeemedPrice: 0,
    marketFinalizeTs: Number.MAX_SAFE_INTEGER,
    isInvalidOutcome: false,
  } as PortfolioPosition;
}

// End state: 20 units at 0.75 on the traded market; start state: 4 units at 0.5.
const positions = [position(M_TRADED, 20, 0.75)];
const positionsAtStart = [position(M_TRADED, 4, 0.5)];

const swaps: TransactionData[] = [
  {
    type: "swap",
    marketId: M_TRADED,
    marketName: M_TRADED,
    timestamp: 1_500,
    blockNumber: 1,
    transactionHash: "0xs",
    collateral: PRIMARY.address,
    tokenIn: PRIMARY.address,
    tokenOut: TOKEN,
    amountIn: wei(9),
    amountOut: wei(16),
  } as TransactionData,
];

const mints: TransactionData[] = [
  {
    type: "lp",
    marketId: M_LP_ONLY,
    marketName: M_LP_ONLY,
    timestamp: 1_600,
    blockNumber: 1,
    transactionHash: "0xl",
    token0: PRIMARY.address,
    token1: TOKEN,
    amount0: wei(6),
    amount1: wei(1),
  } as TransactionData,
];

const conditionalEvents: ConditionalEventRow[] = [
  {
    id: `100:0xtx-1-100:${M_SPLIT_ONLY}`,
    marketId: M_SPLIT_ONLY,
    marketEntityId: `100:${M_SPLIT_ONLY}`,
    marketName: M_SPLIT_ONLY,
    eventType: "split",
    amount: 12n * 10n ** 18n,
    collateral: PRIMARY.address,
    timestamp: 1_700,
    blockNumber: 1,
    transactionHash: "0xtx",
  },
];

function buildAll() {
  const startTimes = [START];
  const swapFlow = computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents(
    swaps,
    startTimes,
    END,
    PRIMARY,
    new Map(),
    undefined,
    { limitRows: 0 },
  );
  const lpFlow = computeLpPrimaryCollateralNetOutForPeriodsFromEvents(mints, [], startTimes, END, PRIMARY);
  const byMarketPeriod = buildMarketPeriodBuckets({
    positions,
    positionsAtStartByPeriod: perPeriod(positionsAtStart),
    historyPrices: perPeriod({} as Record<string, number | undefined>),
    swapFlow,
    swaps,
    lpFlow,
    conditionalEvents,
    primaryCollateral: PRIMARY,
    startTimeByPeriod: perPeriod(START),
    endTime: END,
  });
  return { swapFlow, lpFlow, buckets: byMarketPeriod["1d"] };
}

describe("buildMarketPeriodBuckets", () => {
  it("covers markets that have flow but no position", () => {
    const { buckets } = buildAll();
    expect(new Set(buckets.map((b) => b.marketId))).toEqual(new Set([M_TRADED, M_SPLIT_ONLY, M_LP_ONLY]));
  });

  it("sums to the scoped scalar formula", () => {
    const { swapFlow, lpFlow, buckets } = buildAll();

    const valueEnd = sumPortfolioValueCurrent(positions);
    const valueStart = sumPortfolioValueAtReference(positionsAtStart, {}, START);
    const { netHuman } = routerPrimaryNetFromConditionalEvents(conditionalEvents, PRIMARY);
    const tradingCollateralNetOut = swapFlow.netOutByStartTime.get(START)!;
    const lpCollateralNetOut = lpFlow.netOutByStartTime.get(START)!;

    // The scalar the scoped path produces today.
    const scalarPnl = valueEnd - valueStart + netHuman - tradingCollateralNetOut - lpCollateralNetOut;

    const folded = buckets.reduce((acc, b) => acc + b.pnl, 0);
    expect(folded).toBeCloseTo(scalarPnl, 10);
    // Sanity: 15 − 2 + (−12) − 9 − 6
    expect(folded).toBeCloseTo(-14, 10);
  });

  it("folds each component back to its scalar", () => {
    const { swapFlow, lpFlow, buckets } = buildAll();
    const sum = (f: (b: (typeof buckets)[number]) => number) => buckets.reduce((a, b) => a + f(b), 0);

    expect(sum((b) => b.tradingCollateralNetOut)).toBeCloseTo(swapFlow.netOutByStartTime.get(START)!, 10);
    expect(sum((b) => b.lpCollateralNetOut)).toBeCloseTo(lpFlow.netOutByStartTime.get(START)!, 10);
    expect(sum((b) => b.volume)).toBeCloseTo(swapFlow.volumeByStartTime.get(START)!, 10);
    expect(buckets.filter((b) => b.traded).length).toBe(swapFlow.marketCountByStartTime.get(START));
  });

  it("uses peak capital at risk per market, not the gross sum", () => {
    const { buckets } = buildAll();
    const byId = new Map(buckets.map((b) => [b.marketId, b]));

    // 2 already at risk at the window start (4 units at 0.5) plus 9 spent buying.
    expect(byId.get(M_TRADED)!.capitalDeployed).toBeCloseTo(11, 10);
    // 12 split and still outstanding.
    expect(byId.get(M_SPLIT_ONLY)!.capitalDeployed).toBeCloseTo(12, 10);
    // LP is reached through a split, which is already counted; the mint itself is not capital.
    expect(byId.get(M_LP_ONLY)!.capitalDeployed).toBe(0);
  });

  it("does not grow capital when a market's position is opened and closed repeatedly", () => {
    // Same market entered and exited three times, never more than 9 at risk at once.
    const recycledSwaps = [
      swaps[0],
      {
        ...swaps[0],
        timestamp: 1_550,
        tokenIn: TOKEN,
        tokenOut: PRIMARY.address,
        amountIn: wei(16),
        amountOut: wei(9),
      },
      { ...swaps[0], timestamp: 1_600 },
      {
        ...swaps[0],
        timestamp: 1_650,
        tokenIn: TOKEN,
        tokenOut: PRIMARY.address,
        amountIn: wei(16),
        amountOut: wei(9),
      },
      { ...swaps[0], timestamp: 1_700 },
    ] as TransactionData[];
    const swapFlow = computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents(
      recycledSwaps,
      [START],
      END,
      PRIMARY,
      new Map(),
      undefined,
      { limitRows: 0 },
    );
    const byMarketPeriod = buildMarketPeriodBuckets({
      positions,
      positionsAtStartByPeriod: perPeriod(positionsAtStart),
      historyPrices: perPeriod({} as Record<string, number | undefined>),
      swapFlow,
      swaps: recycledSwaps,
      lpFlow: null,
      conditionalEvents: [],
      primaryCollateral: PRIMARY,
      startTimeByPeriod: perPeriod(START),
      endTime: END,
    });

    const traded = byMarketPeriod["1d"].find((b) => b.marketId === M_TRADED)!;
    // Gross buys across the window are 27; peak at risk is the opening 2 plus one 9-unit leg.
    expect(swapFlow.buysByStartTime.get(START)).toBeCloseTo(27, 10);
    expect(traded.capitalDeployed).toBeCloseTo(11, 10);
  });

  it("carries the router term as a cumulative on the market that split", () => {
    const { buckets } = buildAll();
    const split = buckets.find((b) => b.marketId === M_SPLIT_ONLY)!;

    expect(split.routerPrimaryCumStart).toBe(0);
    expect(split.routerPrimaryCumEnd).toBeCloseTo(-12, 10);
    expect(split.pnl).toBeCloseTo(-12, 10);
  });
});

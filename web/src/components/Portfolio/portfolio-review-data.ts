import type { PortfolioPosition } from "@seer-pm/sdk";
import type { PerformanceSeries, ReviewRange } from "./PortfolioOverview";

// Illustrative review data is used only by the explicit design preview, never by account APIs.
const all = {
  start: "2026-07-01",
  end: "2026-09-29",
  realized: 18.24,
  unrealized: 38.2,
  points: [
    0, 2, 1, -4, 3, 9, 5, 8, 13, 10, 18, 14, 24, 22, 19, 28, 24, 34, 29, 37, 35, 31, 43, 40, 45, 41, 52, 49, 55, 53,
    56.44,
  ],
};
export const REVIEW_SERIES: Record<ReviewRange, PerformanceSeries> = {
  All: all,
  "1Y": all,
  YTD: all,
  "1D": {
    start: "2026-09-28",
    end: "2026-09-29",
    realized: 0,
    unrealized: 3,
    points: [0, 0.2, -0.4, 0.3, 0.1, 0.8, 0.4, 1.2, 1, 1.8, 1.4, 2.5, 2.2, 3],
  },
  "1W": {
    start: "2026-09-22",
    end: "2026-09-29",
    realized: 2.24,
    unrealized: 9.2,
    points: [0, 1, -1, 2, 1, 4, 3, 6, 4, 8, 7, 10, 9, 11.44],
  },
  "1M": {
    start: "2026-08-29",
    end: "2026-09-29",
    realized: 8.24,
    unrealized: 20.2,
    points: [0, 3, 1, 6, 4, 9, 7, 12, 9, 15, 13, 21, 18, 25, 23, 28.44],
  },
};
export type PositionMetrics = { averageEntry: number; cost: number; traded: number; payout: number };
export type ReviewPosition = PortfolioPosition & { reviewMetrics?: PositionMetrics };
export const REVIEW_POSITIONS: ReviewPosition[] = [
  {
    tokenId: "0x0000000000000000000000000000000000000001",
    tokenIndex: 0,
    marketId: "0x0000000000000000000000000000000000000000",
    marketName: "Who will win the Seer Rebrand Contest?",
    marketStatus: "open",
    tokenBalance: 708.01,
    rawBalance: "708010000000000000000",
    tokenValue: 123.14,
    tokenPrice: 123.14 / 708.01,
    outcome: "Electric Foundation",
    chainId: 100,
    collateralToken: "0xaf204776c7245bF4147c2612BF6e5972Ee483701",
    redeemedPrice: 0,
    marketFinalizeTs: 0,
    isInvalidOutcome: false,
    reviewMetrics: { averageEntry: 0.12, cost: 708.01 * 0.12, traded: 708.01 * 0.12, payout: 708.01 },
  },
  {
    tokenId: "0x0000000000000000000000000000000000000002",
    tokenIndex: 1,
    marketId: "0x0000000000000000000000000000000000000000",
    marketName: "Who will win the Seer Rebrand Contest?",
    marketStatus: "open",
    tokenBalance: 100,
    rawBalance: "100000000000000000000",
    tokenValue: 36.55,
    tokenPrice: 0.3655,
    outcome: "Signal Convergence",
    chainId: 100,
    collateralToken: "0xaf204776c7245bF4147c2612BF6e5972Ee483701",
    redeemedPrice: 0,
    marketFinalizeTs: 0,
    isInvalidOutcome: false,
    reviewMetrics: { averageEntry: 0.4, cost: 40, traded: 40, payout: 100 },
  },
];

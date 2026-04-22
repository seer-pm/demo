import type { Address } from "viem";

/** A row in the portfolio positions table / get-portfolio API. */
export interface PortfolioPosition {
  tokenName: string;
  tokenId: Address;
  tokenIndex: number;
  marketId: Address;
  marketName: string;
  marketStatus: string;
  tokenBalance: number;
  rawBalance: string;
  tokenValue: number;
  tokenPrice: number;
  outcome: string;
  collateralToken: Address;
  parentMarketId?: Address;
  parentMarketName?: string;
  parentOutcome?: string;
  redeemedPrice: number;
  marketFinalizeTs: number;
  outcomeImage?: string;
  isInvalidOutcome: boolean;
}

export type PortfolioValueApiResponse = {
  currentPortfolioValue: number;
  historyPortfolioValue: number;
  historyTimestamp: number;
  delta: number;
  deltaPercent: number;
};

export type PortfolioPnLPeriod = "1d" | "1w" | "1m" | "all";

export type PortfolioPnLData = {
  pnl: number;
  valueStart: number;
  valueEnd: number;
  startTime: number;
  endTime: number;
};

import type { Address } from "viem";

/** A row in the portfolio positions table / get-portfolio API. */
export interface PortfolioPosition {
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
  /** Net primary collateral spent on indexed outcome swaps (DEX + CoW) over the window; subtracted from naive Δ(value) for `pnl`. */
  tradingCollateralNetOut?: number;
  startTime: number;
  endTime: number;
};

/** Portfolio / activity transaction row (split, merge, redeem, swap, LP). */
export interface TransactionData {
  marketName: string;
  marketId: string;
  type: "split" | "merge" | "redeem" | "swap" | "lp" | "lp-burn" | "bought" | "sold";
  blockNumber: number;
  collateral: Address;
  collateralSymbol?: string;
  timestamp: number;
  transactionHash?: string;
  /** Wallet to attribute for SMR / DEX leg rows (activity feed). */
  trader?: Address;
  outcomeToken?: Address;
  transferId?: string;
  amount?: string;
  payout?: string;
  tokenIn?: string;
  tokenOut?: string;
  tokenInSymbol?: string;
  tokenOutSymbol?: string;
  amountIn?: string;
  amountOut?: string;
  price?: string;
  token0?: string;
  token1?: string;
  token0Symbol?: string;
  token1Symbol?: string;
  amount0?: string;
  amount1?: string;
}

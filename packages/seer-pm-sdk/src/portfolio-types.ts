import type { Address } from "viem";
import type { SupportedChain } from "./chains";

/** Chain id or aggregated `all` (USD) for portfolio value / global P/L. */
export type PortfolioChainId = SupportedChain | "all";

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
  chainId: SupportedChain;
  collateralToken: Address;
  parentMarketId?: Address;
  parentMarketName?: string;
  parentOutcome?: string;
  redeemedPrice: number;
  marketFinalizeTs: number;
  /**
   * Wallet actually holding these tokens. Absent means the requested account. Set when a
   * TradeExecutor holds them on the owner's behalf — those tokens are not redeemable from the EOA.
   */
  sourceWallet?: Address;
  outcomeImage?: string;
  isInvalidOutcome: boolean;
}

export type PortfolioValueApiResponse = {
  currentPortfolioValue: number;
  historyPortfolioValue: number;
  historyTimestamp: number;
  delta: number;
  deltaPercent: number;
  unit: "USD";
};

export type PortfolioPnLPeriod = "1d" | "1w" | "1m" | "all";

export type PortfolioPnLData = {
  pnl: number;
  valueStart: number;
  valueEnd: number;
  /** Net primary collateral spent on indexed outcome swaps (DEX + CoW) over the window; subtracted from naive Δ(value) for `pnl`. */
  tradingCollateralNetOut?: number;
  startTime: number | null;
  endTime: number;
  /** Snapshot write time when the value came from `pnl_leaderboard`. */
  updatedAt?: string | null;
  /** Present on the global (leaderboard) path; values are USD. Market-scoped live compute omits this (native collateral). */
  unit?: "USD";
};

/** Portfolio / activity transaction row (split, merge, redeem, swap, LP). */
export interface TransactionData {
  marketName: string;
  marketId: string;
  type: "split" | "merge" | "redeem" | "swap" | "lp" | "lp-burn" | "bought" | "sold";
  blockNumber: number;
  /** Present on `get-transactions` rows. */
  chainId?: SupportedChain;
  collateral: Address;
  collateralSymbol?: string;
  timestamp: number;
  transactionHash?: string;
  /** Wallet to attribute for SMR / DEX leg rows (activity feed). */
  trader?: Address;
  /** Source row id (`Swap.id` / `ConditionalEvent.id`), for deduping a row two wallets both match. */
  eventId?: string;
  /**
   * Wallet this row was fetched under. Absent means the requested account. Set when the trade went
   * through a TradeExecutor the account owns.
   */
  sourceWallet?: Address;
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

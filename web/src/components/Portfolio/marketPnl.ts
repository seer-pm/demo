import type { PortfolioCostBasisRow, PortfolioMarketPnLRow, PortfolioPnLPeriod } from "@seer-pm/sdk";

/**
 * Lookup key for a position's per-market figures: the wallet that holds the row, not the account
 * being viewed, because an executor's trades are stored under the executor's address.
 */
export function marketPnlKey(chainId: number, marketId: string, wallet: string): string {
  return `${chainId}:${marketId.toLowerCase()}:${wallet.toLowerCase()}`;
}

export function indexMarketPnl(rows: readonly PortfolioMarketPnLRow[]): Map<string, PortfolioMarketPnLRow> {
  const byKey = new Map<string, PortfolioMarketPnLRow>();
  for (const row of rows) {
    byKey.set(marketPnlKey(row.chainId, row.marketId, row.address), row);
  }
  return byKey;
}

export const MARKET_PNL_PERIOD_LABEL: Record<PortfolioPnLPeriod, string> = {
  "1d": "1D",
  "1w": "1W",
  "1m": "1M",
  all: "All",
};

/** What the Positions table knows about per-market figures for the current period. */
export type MarketPnlLookup = {
  byKey: Map<string, PortfolioMarketPnLRow>;
  period: PortfolioPnLPeriod;
  /** False while loading or when the request failed; the figures are then unknown, not zero. */
  loaded: boolean;
  /** The refresh job has no row for this account: the window was never measured. */
  notComputed: boolean;
  error?: string;
};

/** Lookup key for a position's cost basis: the holding wallet, the chain and the outcome token. */
export function costBasisKey(chainId: number, tokenId: string, wallet: string): string {
  return `${chainId}:${tokenId.toLowerCase()}:${wallet.toLowerCase()}`;
}

export function indexCostBasis(rows: readonly PortfolioCostBasisRow[]): Map<string, PortfolioCostBasisRow> {
  const byKey = new Map<string, PortfolioCostBasisRow>();
  for (const row of rows) {
    byKey.set(costBasisKey(row.chainId, row.tokenId, row.address), row);
  }
  return byKey;
}

/** What the Positions table knows about each position's cost basis. */
export type CostBasisLookup = {
  byKey: Map<string, PortfolioCostBasisRow>;
  /** False while loading or when the request failed; the figures are then unknown, not zero. */
  loaded: boolean;
  /** The refresh job has no row for this account: nothing was ever measured. */
  notComputed: boolean;
  error?: string;
};

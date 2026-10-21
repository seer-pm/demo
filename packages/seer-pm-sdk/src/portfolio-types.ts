import type { Address } from "viem";
import type { SupportedChain } from "./chains";

/** Chain id or aggregated `all` (USD) for portfolio value / global P/L. */
export type PortfolioChainId = SupportedChain | "all";

/** One concentrated-liquidity position, from the side of the pool a portfolio row's token sits on. */
export interface PortfolioLpLeg {
  poolId: string;
  tickLower: number;
  tickUpper: number;
  /** Raw liquidity `L`, as a string: this is what the position *is*, the token amount is derived. */
  liquidity: string;
  /** 0 when the row's token is the pool's token0, 1 when it is token1. */
  side: 0 | 1;
}

/** A row in the portfolio positions table / get-portfolio API. */
export interface PortfolioPosition {
  tokenId: Address;
  tokenIndex: number;
  marketId: Address;
  marketName: string;
  marketStatus: string;
  tokenBalance: number;
  rawBalance: string;
  /** Outcome tokens this row's wallet holds inside AMM positions, on top of `tokenBalance`. */
  lpTokenBalance?: number;
  rawLpBalance?: string;
  /**
   * The AMM positions `lpTokenBalance` was derived from.
   *
   * Kept because the derived amount is not a balance: a concentrated-liquidity position holds
   * whatever the pool's current price says it holds, and that changes when anyone else trades. The
   * liquidity and the tick range are the invariants, so a cached row can be re-derived at today's
   * price from these instead of being served at the price of whenever it was written.
   */
  lpLegs?: PortfolioLpLeg[];
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
  /**
   * Settled such that these tokens can never pay out: either this market resolved to another
   * outcome, or its parent resolved to another branch. Permanent, not "currently quoted near zero".
   *
   * The row is kept rather than dropped because P/L needs it: `computePositionsAtStartByPeriod`
   * rebuilds the window's opening positions by rebalancing the current ones, so a row missing today
   * is also missing at the window start — and the loss that made it worthless disappears from both
   * ends instead of being booked. The positions UI hides these; valuation keeps them at 0.
   */
  isWorthless?: boolean;
}

export type PortfolioValueApiResponse = {
  /** `positionsValue` + `availableBalance`. */
  currentPortfolioValue: number;
  /** Outcome-token positions at current pool prices. */
  positionsValue: number;
  /** Idle collateral the account could trade with: the primary plus every token the swap widget accepts. */
  availableBalance: number;
  /** `positionsValue` priced one day ago; `delta` compares the two, so idle collateral never shows as a move. */
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
  /**
   * False when these numbers are a placeholder rather than a measurement — no materialized
   * `pnl_leaderboard` row for the wallet set, or a compute that failed. Render "not computed",
   * never `$0`: the two differ, and only one of them is a claim about the account.
   */
  computed?: boolean;
  /** Present on the global (leaderboard) path; values are USD. Market-scoped live compute omits this (native collateral). */
  unit?: "USD";
};

/**
 * One wallet's P/L and traded volume on one market over a period, from `pnl_market_leaderboard`.
 *
 * `pnl` and `volume` are in the native collateral of `chainId`; the USD figures are converted at
 * the spot price of the refresh that wrote the row. `marketId` is the child market on conditional
 * markets, which is also what a `PortfolioPosition` carries, so the two match on the triple
 * (`chainId`, `marketId`, `address`). `address` is the wallet that traded: an executor's rows stay
 * under the executor, never merged into its owner.
 */
export type PortfolioMarketPnLRow = {
  chainId: number;
  marketId: Address;
  address: Address;
  pnl: number;
  pnlUsd: number;
  /** Gross swap notional over the window; priced 1/N on conditional markets. */
  volume: number;
  volumeUsd: number;
  capitalDeployed: number;
  collateralPriceUsd: number;
  /** The wallet swapped on this market inside the window; false when only the valuation moved. */
  traded: boolean;
  updatedAt: string;
};

/**
 * Weighted-average cost basis of one wallet's position in one outcome token, from `pnl_token_basis`.
 *
 * Costs are in the native primary collateral of `chainId`. A conditional market's token carries the
 * cost inherited from the parent outcome that paid for it, so it is in primary as well. `address`
 * is the wallet holding the tokens (an executor's rows stay under the executor), which is what a
 * `PortfolioPosition.sourceWallet` names, so the two match on (`chainId`, `tokenId`, `address`).
 */
export type PortfolioCostBasisRow = {
  chainId: number;
  address: Address;
  tokenId: Address;
  marketId: Address;
  tokenIndex: number;
  /** Tokens the fold believes the wallet holds; compare with the live balance before trusting it. */
  quantity: number;
  /** Remaining cost of `quantity`. */
  cost: number;
  /** `cost / quantity`; absent with no position. */
  averageCost?: number;
  /** Collateral gained or lost on completed round trips (sales, merges, redeems). */
  realized: number;
  totalBought: number;
  totalSold: number;
  /** The token entered or left an AMM position: show no entry price. */
  lpTouched: boolean;
  /** The fold hit a gap (missed event, unattributed redeem, balance mismatch): show as approximate. */
  approximate: boolean;
  /** Some split that minted the token had no pool price and was spread 1/N. */
  evenSplit: boolean;
  lastEventAt?: number;
  updatedAt: string;
};

export type PortfolioCostBasisResponse = {
  /** False when the refresh job has no row for the wallet set at all. */
  computed: boolean;
  rows: PortfolioCostBasisRow[];
};

export type PortfolioMarketPnLResponse = {
  period: PortfolioPnLPeriod;
  /**
   * False when the refresh job has no row for the wallet set. Market rows are sparse (all-zero
   * buckets are not written), so an empty `rows` on its own does not mean "never computed".
   */
  computed: boolean;
  rows: PortfolioMarketPnLRow[];
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
  /** LP rows only: the pool and tick range the liquidity went into or came out of. */
  poolId?: string;
  tickLower?: number;
  tickUpper?: number;
  /** LP rows only: raw liquidity `L` minted or burned, as a string. */
  liquidity?: string;
}

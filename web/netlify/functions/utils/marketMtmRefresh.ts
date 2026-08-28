/**
 * Mark-to-market refresh, driven by market rather than by wallet.
 *
 * ## Why this loop exists
 *
 * P/L has two halves that go stale for different reasons. Cashflow changes only when the wallet
 * acts, so it can be refreshed from a dirty-pair signal. Mark-to-market changes on every price tick
 * and on every resolution, with no wallet activity at all — a market that settles moves the P/L of
 * every holder at once, and no activity-driven signal will ever fire for it.
 *
 * Refreshing MTM by walking wallets therefore costs `wallets × markets` price reads for something
 * that only depends on `(market, token)`. Walking markets instead makes the price vector shared: one
 * read per market, applied to every holder. That removes the wallet count from the expensive path.
 *
 * ## What may be recomputed from stored columns
 *
 * `pnl = (mtm_end + router_cum_end) − (mtm_start + router_cum_start) − trading − lp`.
 *
 * Only `mtm_end` moves here, and every other term is already a column, so the update needs no event
 * replay. `capital_deployed` is untouched on purpose: the peak already includes the position open at
 * the window start, and that is in the past.
 */

/** The columns this loop reads and rewrites for one `(wallet, market, period)` row. */
export type MtmRefreshRow = {
  address: string;
  marketId: string;
  period: string;
  valueStartMtm: number;
  routerPrimaryCumStart: number;
  routerPrimaryCumEnd: number;
  tradingCollateralNetOut: number;
  lpCollateralNetOut: number;
};

export type MtmRefreshUpdate = {
  address: string;
  marketId: string;
  period: string;
  valueEndMtm: number;
  valueEnd: number;
  pnl: number;
  pnlUsd: number;
};

/** Current holdings of one market's outcome tokens, in human units, per wallet. */
export type HoldingsByWallet = Map<string, Map<string, number>>;

/** The shape `getCurrentOutcomePrices` needs, without importing the pricing module here. */
export type PriceTokenInput = {
  tokenId: string;
  collateralToken: string;
  parentMarketId?: string;
};

/** Just enough of a market to build its pricing inputs. */
export type PricedMarket = {
  id: string;
  collateralToken: string;
  wrappedTokens: readonly string[];
  parentMarketId?: string;
};

/**
 * Pricing inputs for a market **and its parent chain**, ordered root first.
 *
 * A conditional outcome is quoted against its parent's outcome token, and `mapOutcomePrices`
 * resolves that in a single pass over the array: each conditional multiplies its relative price by
 * `prices[collateralToken]`, which must already be in the map. So two things are load-bearing and
 * neither is enforced by the type system:
 *
 * - the parent's tokens must be **present** — a batch holding one market's tokens alone prices every
 *   conditional at 0;
 * - they must come **first** — depth-ascending order is what makes a chain deeper than one level
 *   resolve, since the second pass reads prices written earlier in the same pass.
 *
 * A root market passes `parentMarketId: undefined`. Passing the zero address instead marks it as
 * conditional and prices it at 0.
 */
export function outcomePriceTokensForChain(chainRootFirst: PricedMarket[]): PriceTokenInput[] {
  const out: PriceTokenInput[] = [];
  for (const market of chainRootFirst) {
    for (const tokenId of market.wrappedTokens) {
      out.push({
        tokenId: tokenId.toLowerCase(),
        collateralToken: market.collateralToken.toLowerCase(),
        parentMarketId: market.parentMarketId?.toLowerCase(),
      });
    }
  }
  return out;
}

/**
 * Effective price per token: the settled payout when the market has resolved, else the pool price.
 *
 * This is the rule `buildPortfolioPositions` applies (`redeemedPrice || tokenPrice`), and reproducing
 * it here is not optional. A resolved market has no live pool, so an on-chain read returns nothing
 * for it — value it at the pool price alone and every winning position in a settled market collapses
 * to zero. Measured against the wallet pass, that was 44 of 440 rows.
 */
export function effectivePricesByToken(args: {
  tokens: string[];
  /** Settled payout per token, 0 when the market has not resolved. */
  redeemedByToken: Record<string, number>;
  /** Current pool price per token; missing for markets with no pool. */
  currentByToken: Record<string, number>;
}): Record<string, number> {
  const out: Record<string, number> = {};
  for (const token of args.tokens) {
    const key = token.toLowerCase();
    const redeemed = args.redeemedByToken[key] ?? 0;
    out[key] = redeemed || (args.currentByToken[key] ?? 0);
  }
  return out;
}

/**
 * Value a wallet's holdings of one market at the given prices.
 *
 * A token with no price contributes 0 rather than being skipped: an outcome with no pool has no
 * observable market value, and treating it as absent would silently change which markets a wallet
 * appears in.
 */
export function markToMarket(holdings: Map<string, number>, pricesByToken: Record<string, number>): number {
  let total = 0;
  for (const [token, balance] of holdings) {
    total += (pricesByToken[token.toLowerCase()] ?? 0) * balance;
  }
  return total;
}

/**
 * Recompute one row from a new `value_end_mtm`, reusing the stored cashflow columns.
 *
 * Whether the row is worth writing at all is the caller's call (`refreshMarketMtm`): most rows on
 * most ticks are unchanged, and rewriting them would churn `updated_at` and defeat the generation
 * sweep that detects superseded rows.
 */
export function refreshRowMtm(args: {
  row: MtmRefreshRow;
  valueEndMtm: number;
  collateralPriceUsd: number;
}): MtmRefreshUpdate {
  const { row, valueEndMtm, collateralPriceUsd } = args;

  const valueEnd = valueEndMtm + row.routerPrimaryCumEnd;
  const valueStart = row.valueStartMtm + row.routerPrimaryCumStart;
  const pnl = valueEnd - valueStart - row.tradingCollateralNetOut - row.lpCollateralNetOut;

  return {
    address: row.address,
    marketId: row.marketId,
    period: row.period,
    valueEndMtm,
    valueEnd,
    pnl,
    pnlUsd: pnl * collateralPriceUsd,
  };
}

/**
 * Build the updates for every row of one market, given current holdings and prices.
 *
 * Rows whose MTM is unchanged within `epsilon` are dropped.
 */
export function refreshMarketMtm(args: {
  rows: MtmRefreshRow[];
  /** Current `value_end_mtm` per row key, so unchanged rows can be detected. */
  currentValueEndMtm: Map<string, number>;
  holdings: HoldingsByWallet;
  pricesByToken: Record<string, number>;
  collateralPriceUsd: number;
  epsilon?: number;
}): MtmRefreshUpdate[] {
  const { rows, currentValueEndMtm, holdings, pricesByToken, collateralPriceUsd } = args;
  const epsilon = args.epsilon ?? 1e-9;
  const out: MtmRefreshUpdate[] = [];

  for (const row of rows) {
    const walletHoldings = holdings.get(row.address.toLowerCase()) ?? new Map<string, number>();
    const valueEndMtm = markToMarket(walletHoldings, pricesByToken);
    const key = `${row.address.toLowerCase()}|${row.marketId.toLowerCase()}|${row.period}`;
    const previous = currentValueEndMtm.get(key) ?? 0;
    if (Math.abs(valueEndMtm - previous) <= epsilon) continue;

    out.push(refreshRowMtm({ row, valueEndMtm, collateralPriceUsd }));
  }
  return out;
}

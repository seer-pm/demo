import type { CostBasisTokenRow } from "./costBasisCompute";
import type { TablesInsert } from "./supabase";

export type PnlTokenBasisInsert = TablesInsert<"pnl_token_basis">;

/** A token the fold saw but that holds nothing and never completed a round trip says nothing. */
export function isEmptyBasisRow(row: CostBasisTokenRow): boolean {
  return row.quantity === 0 && row.cost === 0 && row.realized === 0 && row.totalBought === 0 && row.totalSold === 0;
}

/**
 * Rows for `pnl_token_basis` from one wallet's folded basis. Empty rows are dropped for the same
 * reason the market rows drop all-zero buckets: absent reads the same as zero and keeps the table
 * sparse. `lastEventAt` is the only nullable figure; `average_cost` is null with no position.
 */
export function buildTokenBasisRows(args: {
  account: string;
  chainId: number;
  tokens: readonly CostBasisTokenRow[];
  writtenAt: string;
}): PnlTokenBasisInsert[] {
  const address = args.account.toLowerCase();
  const rows: PnlTokenBasisInsert[] = [];
  for (const token of args.tokens) {
    if (isEmptyBasisRow(token)) continue;
    rows.push({
      chain_id: args.chainId,
      address,
      token_id: token.tokenId.toLowerCase(),
      market_id: token.marketId.toLowerCase(),
      token_index: token.tokenIndex,
      quantity: token.quantity,
      cost: token.cost,
      average_cost: token.averageCost ?? null,
      realized: token.realized,
      total_bought: token.totalBought,
      total_sold: token.totalSold,
      lp_touched: token.lpTouched,
      approximate: token.approximate,
      even_split: token.evenSplit,
      last_event_at: token.lastEventAt ?? null,
      updated_at: args.writtenAt,
    });
  }
  return rows;
}

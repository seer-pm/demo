import type { SupportedChain } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Address } from "viem";
import type { Database } from "../supabase";

const PAGE_SIZE = 1000;

/**
 * Distinct ERC20 `token` addresses appearing in `tokens_transfers` for `chainId` where the user
 * is sender or receiver, within `(startTime, endTime]` (same window convention as other portfolio helpers).
 */
export async function listDistinctUserTransferTokensInWindow(
  supabase: SupabaseClient<Database>,
  chainId: SupportedChain,
  account: Address,
  startTime: number,
  endTime: number,
): Promise<string[]> {
  const accountLc = account.toLowerCase();
  const seen = new Set<string>();

  // Keyset pagination avoids high OFFSET degradation and requires a stable order.
  // PK is (chain_id, tx_hash, log_index); chain_id is fixed — cursor uses (timestamp, tx_hash, log_index).
  // Paginate backwards (newest -> oldest).
  let last: { timestamp: number; tx_hash: string; log_index: number } | null = null;
  for (;;) {
    let q = supabase
      .from("tokens_transfers")
      .select("token,timestamp,tx_hash,log_index")
      .eq("chain_id", chainId)
      .gt("timestamp", startTime)
      .lte("timestamp", endTime)
      .order("timestamp", { ascending: false })
      .order("tx_hash", { ascending: false })
      .order("log_index", { ascending: false })
      .limit(PAGE_SIZE);

    if (last) {
      // (from=acct OR to=acct) AND key-after cursor for DESC (ts, tx_hash, log_index)
      q = q.or(
        [
          `and(from.eq.${accountLc},timestamp.lt.${last.timestamp})`,
          `and(from.eq.${accountLc},timestamp.eq.${last.timestamp},tx_hash.lt.${last.tx_hash})`,
          `and(from.eq.${accountLc},timestamp.eq.${last.timestamp},tx_hash.eq.${last.tx_hash},log_index.lt.${last.log_index})`,
          `and(to.eq.${accountLc},timestamp.lt.${last.timestamp})`,
          `and(to.eq.${accountLc},timestamp.eq.${last.timestamp},tx_hash.lt.${last.tx_hash})`,
          `and(to.eq.${accountLc},timestamp.eq.${last.timestamp},tx_hash.eq.${last.tx_hash},log_index.lt.${last.log_index})`,
        ].join(","),
      );
    } else {
      q = q.or(`from.eq.${accountLc},to.eq.${accountLc}`);
    }

    const { data, error } = await q;

    if (error) {
      throw new Error(`tokens_transfers distinct tokens in window: ${error.message}`);
    }

    const rows = data ?? [];
    for (const row of rows) {
      const t = row.token;
      if (typeof t === "string" && t.length > 0) seen.add(t.toLowerCase());
    }

    if (rows.length < PAGE_SIZE) break;

    const lastRow = rows[rows.length - 1];
    const ts = Number(lastRow?.timestamp ?? Number.NaN);
    const txHash = lastRow?.tx_hash;
    const logIndex = Number(lastRow?.log_index ?? Number.NaN);
    if (!Number.isFinite(ts) || typeof txHash !== "string" || txHash.length === 0 || !Number.isFinite(logIndex)) {
      throw new Error(
        "tokens_transfers distinct tokens in window: missing cursor (timestamp,tx_hash,log_index) for pagination",
      );
    }
    last = { timestamp: ts, tx_hash: txHash, log_index: logIndex };
  }

  return Array.from(seen);
}

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
  // We paginate backwards (newest -> oldest) so the cursor is the last (timestamp, id) seen.
  let last: { timestamp: number; id: number } | null = null;
  for (;;) {
    let q = supabase
      .from("tokens_transfers")
      .select("token,timestamp,id")
      .eq("chain_id", chainId)
      .gt("timestamp", startTime)
      .lte("timestamp", endTime)
      .order("timestamp", { ascending: false })
      .order("id", { ascending: false })
      .limit(PAGE_SIZE);

    if (last) {
      // Combine (from/to match) AND (keyset cursor) in a single OR expression.
      // (from=acct OR to=acct) AND (ts<lastTs OR (ts=lastTs AND id<lastId))
      q = q.or(
        [
          `and(from.eq.${accountLc},timestamp.lt.${last.timestamp})`,
          `and(from.eq.${accountLc},timestamp.eq.${last.timestamp},id.lt.${last.id})`,
          `and(to.eq.${accountLc},timestamp.lt.${last.timestamp})`,
          `and(to.eq.${accountLc},timestamp.eq.${last.timestamp},id.lt.${last.id})`,
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
    const id = Number(lastRow?.id ?? Number.NaN);
    if (!Number.isFinite(ts) || !Number.isFinite(id)) {
      throw new Error("tokens_transfers distinct tokens in window: missing cursor (timestamp,id) for pagination");
    }
    last = { timestamp: ts, id };
  }

  return Array.from(seen);
}

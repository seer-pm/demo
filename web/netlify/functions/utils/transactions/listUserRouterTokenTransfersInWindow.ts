import type { SupportedChain } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Address } from "viem";
import type { Database } from "../supabase";

const PAGE_SIZE = 1000;

export type TokenTransferRow = {
  token: string;
  from: string;
  to: string;
  value: string; // selected as value::text
  timestamp: number;
  tx_hash: string;
  block_number: number;
};

/**
 * Lists ERC20 `tokens_transfers` between `accountLc` and any router in `routerAddrLcs`
 * for the given token(s), within (startTime, endTime].
 *
 * Returned rows are sorted ascending by timestamp.
 */
export async function listUserRouterTokenTransfersInWindow(
  supabase: SupabaseClient<Database>,
  chainId: SupportedChain,
  account: Address,
  routerAddresses: Address[],
  tokenAddresses: Address[],
  startTime: number,
  endTime: number,
): Promise<TokenTransferRow[]> {
  if (routerAddresses.length === 0 || tokenAddresses.length === 0) return [];

  const out: TokenTransferRow[] = [];

  const accountLc = account.toLowerCase();
  const routersIn = `(${routerAddresses.map((a) => a.toLowerCase()).join(",")})`;
  const tokens = tokenAddresses.map((t) => t.toLowerCase());

  // Keyset pagination avoids high OFFSET degradation. We keep a stable order (timestamp,id).
  let last: { timestamp: number; id: number } | null = null;
  for (;;) {
    let q = supabase
      .from("tokens_transfers")
      .select("id,token,from,to,value::text,timestamp,tx_hash,block_number")
      .eq("chain_id", chainId)
      .in("token", tokens)
      .gt("timestamp", startTime)
      .lte("timestamp", endTime)
      .order("timestamp", { ascending: true })
      .order("id", { ascending: true })
      .limit(PAGE_SIZE);

    if (last) {
      // Combine (account<->router match) AND (keyset cursor) in a single OR expression.
      // R = (from=acct AND to in routers) OR (from in routers AND to=acct)
      // C = (ts>lastTs) OR (ts=lastTs AND id>lastId)
      q = q.or(
        [
          `and(from.eq.${accountLc},to.in.${routersIn},timestamp.gt.${last.timestamp})`,
          `and(from.eq.${accountLc},to.in.${routersIn},timestamp.eq.${last.timestamp},id.gt.${last.id})`,
          `and(from.in.${routersIn},to.eq.${accountLc},timestamp.gt.${last.timestamp})`,
          `and(from.in.${routersIn},to.eq.${accountLc},timestamp.eq.${last.timestamp},id.gt.${last.id})`,
        ].join(","),
      );
    } else {
      q = q.or(`and(from.eq.${accountLc},to.in.${routersIn}),and(from.in.${routersIn},to.eq.${accountLc})`);
    }

    const { data, error } = await q;

    if (error) {
      throw new Error(`tokens_transfers user<->router window: ${error.message}`);
    }

    const chunk = data ?? [];
    out.push(...chunk);

    if (chunk.length < PAGE_SIZE) break;

    const lastRow = chunk[chunk.length - 1];
    const ts = Number(lastRow?.timestamp ?? Number.NaN);
    const id = Number(lastRow?.id ?? Number.NaN);
    if (!Number.isFinite(ts) || !Number.isFinite(id)) {
      throw new Error("tokens_transfers user<->router window: missing cursor (timestamp,id) for pagination");
    }
    last = { timestamp: ts, id };
  }

  out.sort((a, b) => a.timestamp - b.timestamp);
  return out;
}

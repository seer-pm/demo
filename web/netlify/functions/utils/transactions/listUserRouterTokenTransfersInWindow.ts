import type { SupportedChain, TokenTransfer } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Address } from "viem";
import { tokensTransfersRowToTransfer } from "../airdropCalculation/getAllTransfers";
import type { Database } from "../supabase";

const PAGE_SIZE = 1000;

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
): Promise<TokenTransfer[]> {
  if (routerAddresses.length === 0 || tokenAddresses.length === 0) return [];

  const out: TokenTransfer[] = [];

  const accountLc = account.toLowerCase();
  const routersIn = `(${routerAddresses.map((a) => a.toLowerCase()).join(",")})`;
  const tokens = tokenAddresses.map((t) => t.toLowerCase());

  // Keyset pagination; stable order matches PK tie-break: (timestamp, tx_hash, log_index).
  let last: { timestamp: number; tx_hash: string; log_index: number } | null = null;
  for (;;) {
    let q = supabase
      .from("tokens_transfers")
      .select("chain_id,token,from,to,value,timestamp,tx_hash,block_number,log_index")
      .eq("chain_id", chainId)
      .in("token", tokens)
      .gt("timestamp", startTime)
      .lte("timestamp", endTime)
      .order("timestamp", { ascending: true })
      .order("tx_hash", { ascending: true })
      .order("log_index", { ascending: true })
      .limit(PAGE_SIZE);

    if (last) {
      // R = (from=acct AND to in routers) OR (from in routers AND to=acct)
      // C = lexicographic successor for ASC on (ts, tx_hash, log_index)
      q = q.or(
        [
          `and(from.eq.${accountLc},to.in.${routersIn},timestamp.gt.${last.timestamp})`,
          `and(from.eq.${accountLc},to.in.${routersIn},timestamp.eq.${last.timestamp},tx_hash.gt.${last.tx_hash})`,
          `and(from.eq.${accountLc},to.in.${routersIn},timestamp.eq.${last.timestamp},tx_hash.eq.${last.tx_hash},log_index.gt.${last.log_index})`,
          `and(from.in.${routersIn},to.eq.${accountLc},timestamp.gt.${last.timestamp})`,
          `and(from.in.${routersIn},to.eq.${accountLc},timestamp.eq.${last.timestamp},tx_hash.gt.${last.tx_hash})`,
          `and(from.in.${routersIn},to.eq.${accountLc},timestamp.eq.${last.timestamp},tx_hash.eq.${last.tx_hash},log_index.gt.${last.log_index})`,
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
    out.push(...chunk.map((row) => tokensTransfersRowToTransfer(row)));

    if (chunk.length < PAGE_SIZE) break;

    const lastRow = chunk[chunk.length - 1];
    const ts = Number(lastRow?.timestamp ?? Number.NaN);
    const txHash = lastRow?.tx_hash;
    const logIndex = Number(lastRow?.log_index ?? Number.NaN);
    if (!Number.isFinite(ts) || typeof txHash !== "string" || txHash.length === 0 || !Number.isFinite(logIndex)) {
      throw new Error(
        "tokens_transfers user<->router window: missing cursor (timestamp,tx_hash,log_index) for pagination",
      );
    }
    last = { timestamp: ts, tx_hash: txHash, log_index: logIndex };
  }

  out.sort((a, b) => a.timestamp - b.timestamp);
  return out;
}

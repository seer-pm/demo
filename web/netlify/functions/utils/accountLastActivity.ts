import { SUPPORTED_CHAINS } from "@/lib/chains";
import type { SupportedChain } from "@seer-pm/sdk";
import type { Address } from "viem";
import { fetchAccountActivities } from "./seerIndexerPortfolio";

export function supportedChainIds(): SupportedChain[] {
  return Object.values(SUPPORTED_CHAINS).map((c) => c.id as SupportedChain);
}

/** Max HyperIndex `AccountActivity.lastTransferTimestamp` across chains (0 if none). */
export async function fetchLastActivityTimestamp(account: Address): Promise<number> {
  const rows = await fetchAccountActivities(account);
  let max = 0;
  for (const row of rows) {
    if (row.lastTransferTimestamp > max) {
      max = row.lastTransferTimestamp;
    }
  }
  return max;
}

/**
 * Max last-activity timestamp over a whole wallet set — the account and the TradeExecutors it owns.
 *
 * The portfolio blob caches key off the requested account but hold the *merged* result, so
 * freshness has to be judged over every wallet that feeds it. Judging it on the EOA alone means a
 * wallet that only ever trades through its executor never moves its own timestamp, and the cache
 * serves a stale merged payload until the safety TTL expires.
 *
 * One request per wallet: `GetAccountActivities` filters `account: { _eq: }`, and widening it to
 * `_in` would mean regenerating the query for every existing caller. With at most three wallets,
 * three parallel calls to the same indexer is the cheaper trade.
 */
export async function fetchLastActivityTimestampForWallets(wallets: Address[]): Promise<number> {
  if (wallets.length === 0) return 0;
  const timestamps = await Promise.all(wallets.map((wallet) => fetchLastActivityTimestamp(wallet)));
  return Math.max(...timestamps);
}

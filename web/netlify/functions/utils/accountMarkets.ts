import type { SupportedChain } from "@seer-pm/sdk";
import type { Market } from "@seer-pm/sdk/market-types";
import type { Address } from "viem";
import { fetchMarketIdsByTokens, loadMarketsByIds } from "./markets";
import { fetchMarketIdsFromAccountTransfers, fetchTokenBalances } from "./seerIndexerPortfolio";

export type AccountMarkets = {
  markets: Market[];
  /** Every token the account has an indexed balance row for, zero balances included. */
  heldTokenIds: string[];
};

/** Markets this account has held or transferred (HyperIndex), loaded from `markets` by id. */
export async function loadAccountMarkets(account: Address, chainId: SupportedChain): Promise<AccountMarkets> {
  const endTime = Math.floor(Date.now() / 1000);
  const [holdings, transferIds] = await Promise.all([
    fetchTokenBalances(account, chainId),
    fetchMarketIdsFromAccountTransfers(account, chainId, endTime),
  ]);
  const heldTokenIds = [...holdings.keys()];
  const markets = await loadMarketsByIds(chainId, [...new Set(transferIds.map((id) => id.toLowerCase()))]);

  // Every held token reached the wallet through an `outcome` transfer, so the scan above already
  // covers it. Only the leftovers go to `fetchMarketIdsByTokens`, which costs one serial Supabase
  // RPC per 100 tokens — an account with thousands of balance rows used to pay all of them.
  const covered = new Set(markets.flatMap((market) => market.wrappedTokens.map((t) => String(t).toLowerCase())));
  const uncovered = [...holdings.entries()]
    .filter(([token, balance]) => balance > 0n && !covered.has(token))
    .map(([token]) => token);
  if (uncovered.length === 0) return { markets, heldTokenIds };

  const knownIds = new Set(markets.map((market) => market.id.toLowerCase()));
  const extraIds = [
    ...new Set((await fetchMarketIdsByTokens(chainId, uncovered)).map((id) => id.toLowerCase())),
  ].filter((id) => !knownIds.has(id));
  if (extraIds.length === 0) return { markets, heldTokenIds };

  return { markets: markets.concat(await loadMarketsByIds(chainId, extraIds)), heldTokenIds };
}

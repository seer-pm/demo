import type { SupportedChain } from "@seer-pm/sdk";
import type { Market } from "@seer-pm/sdk/market-types";
import type { Address } from "viem";
import { fetchMarketIdsByTokens, loadMarketsByIds } from "./markets";
import { fetchMarketIdsFromAccountTransfers, fetchTokenBalances } from "./seerIndexerPortfolio";

/** Markets this account has held or transferred (HyperIndex), loaded from `markets` by id. */
export async function loadAccountMarkets(account: Address, chainId: SupportedChain): Promise<Market[]> {
  const endTime = Math.floor(Date.now() / 1000);
  const [holdings, transferIds] = await Promise.all([
    fetchTokenBalances(account, chainId),
    fetchMarketIdsFromAccountTransfers(account, chainId, endTime),
  ]);
  const tokens = [...holdings.entries()].filter(([, bal]) => bal > 0n).map(([token]) => token);
  const tokenMarketIds = await fetchMarketIdsByTokens(chainId, tokens);
  const ids = [...new Set([...transferIds, ...tokenMarketIds].map((id) => id.toLowerCase()))];
  return loadMarketsByIds(chainId, ids);
}

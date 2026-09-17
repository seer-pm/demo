import { liquidityPoolTxKey } from "@seer-pm/sdk";
import type { SupportedChain } from "@seer-pm/sdk/chains";
import { getMarketPoolsPairs } from "@seer-pm/sdk/market-pools";
import type { Market } from "@seer-pm/sdk/market-types";
import { getAllLiquidityEvents } from "./airdropCalculation/getLiquidityBalances";

/**
 * `(transaction, pool)` keys for every liquidity mint or burn on this market's pools at or after
 * `sinceTimestamp`.
 *
 * What the activity feed needs this for: a wallet moving outcome tokens to a pool has either sold
 * them or deposited them as liquidity, and the ERC20 transfers look identical either way. The
 * counter-leg would settle it, but the Seer indexer only records primary collateral moving with one
 * of its own routers, so an AMM trade's cash side never reaches `tokens_transfers`.
 *
 * Mints and burns rather than the swaps, even though swaps are the larger and simpler set to ask
 * for. A subgraph of this family gives an event the id `<txHash>#<pool.txCount>`, so two pools that
 * share a `txCount` within one transaction write the same id and one silently overwrites the other.
 * A route across a market's outcome pools does exactly that: one such transaction on Gnosis emits 17
 * `Swap` logs on chain and leaves 11 `Swap` entities behind. Asking which transactions were *not*
 * trades therefore fails safe, because a dropped event leaves a liquidity move reading as the trade
 * it already reads as, where a dropped swap would have turned a real trade into a deposit.
 *
 * Keyed per pool, not per transaction, so a deposit is not relabelled by a trade on another of the
 * market's pools in the same transaction.
 */
export async function fetchMarketLiquidityPoolTxKeys(market: Market, sinceTimestamp: number): Promise<Set<string>> {
  const pairs = getMarketPoolsPairs(market);
  const keys = new Set<string>();
  if (pairs.length === 0) return keys;

  const events = await getAllLiquidityEvents(
    market.chainId as SupportedChain,
    pairs.map(({ token0, token1 }) => ({ tokenId: token0, collateralToken: token1 })),
    undefined,
    sinceTimestamp,
  );

  for (const event of events) {
    // Mint and burn ids are `<txHash>#<index>`; the crawl does not select `transaction` separately.
    const transactionHash = event.id.split("#")[0];
    if (!transactionHash || !event.pool?.id) continue;
    keys.add(liquidityPoolTxKey(transactionHash, event.pool.id));
  }
  return keys;
}

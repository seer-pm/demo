import { type OrderBookPoolKey, getOrderBookPoolParams, marketSupportsOrderBook } from "@seer-pm/order-book";
import { type V4Position, fetchUserV4Positions } from "@seer-pm/order-book/v4";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useConfig } from "wagmi";
import type { Market } from "./useMarketPools";

export const USER_V4_POSITIONS_QUERY_KEY = "useUserV4Positions";

function getMarketPoolKeys(market: Market, outcomeIndex?: number): OrderBookPoolKey[] {
  if (!marketSupportsOrderBook(market)) {
    return [];
  }
  const indexes = outcomeIndex === undefined ? market.wrappedTokens.map((_, i) => i) : [outcomeIndex];
  return indexes.map((i) => getOrderBookPoolParams(market, i).poolKey);
}

/**
 * The account's Uniswap V4 liquidity positions in a market's order-book pools.
 * Pass `outcomeIndex` to restrict to one outcome; omit it for every outcome of the market.
 */
export function useUserV4Positions(market: Market, account: Address | undefined, outcomeIndex?: number) {
  const config = useConfig();
  const poolKeys = getMarketPoolKeys(market, outcomeIndex);

  return useQuery<V4Position[]>({
    queryKey: [USER_V4_POSITIONS_QUERY_KEY, market.chainId, account?.toLowerCase(), market.id, outcomeIndex ?? "all"],
    enabled: Boolean(account) && poolKeys.length > 0,
    refetchInterval: 30_000,
    queryFn: () =>
      fetchUserV4Positions(config, {
        chainId: market.chainId,
        owner: account as Address,
        poolKeys,
      }),
  });
}

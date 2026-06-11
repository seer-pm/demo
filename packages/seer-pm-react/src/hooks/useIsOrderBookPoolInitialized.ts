import {
  chainSupportsOrderBook,
  getOrderBookPoolParams,
  isOrderBookPoolInitialized,
  marketSupportsOrderBook,
  readV4PoolState,
} from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import { useConfig } from "wagmi";
import type { Market } from "./useMarketPools";

export function useIsOrderBookPoolInitialized(market: Market, outcomeIndex: number) {
  const config = useConfig();

  return useQuery({
    queryKey: ["useIsOrderBookPoolInitialized", market.id, outcomeIndex],
    enabled: chainSupportsOrderBook(market.chainId) && marketSupportsOrderBook(market),
    queryFn: async () => {
      return isOrderBookPoolInitialized(config, market, outcomeIndex);
    },
  });
}

export function useV4PoolState(market: Market, outcomeIndex: number) {
  const config = useConfig();
  const poolParams = useOrderBookPoolParams(market, outcomeIndex);

  return useQuery({
    queryKey: ["useV4PoolState", market.id, outcomeIndex],
    enabled: Boolean(poolParams) && chainSupportsOrderBook(market.chainId) && marketSupportsOrderBook(market),
    queryFn: async () => {
      if (!poolParams) {
        return null;
      }
      return readV4PoolState(config, market.chainId, poolParams.poolKey);
    },
  });
}

export function useOrderBookPoolParams(market: Market, outcomeIndex: number) {
  return chainSupportsOrderBook(market.chainId) && marketSupportsOrderBook(market)
    ? getOrderBookPoolParams(market, outcomeIndex)
    : undefined;
}

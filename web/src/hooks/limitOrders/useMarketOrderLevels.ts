import type { PoolMeta } from "@/components/LimitOrders/ordersShared";
import type { ChartOrderLevel } from "@/hooks/liquidity/getLiquidityChartData";
import { marketSupportsOrderBook } from "@seer-pm/order-book";
import { type Market, orderBookGraphQLClient } from "@seer-pm/sdk";
import { getSdk as getLimitOrderSdk } from "@seer-pm/sdk/subgraph/limit-order-hook";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getMarketPoolMeta } from "./useUserLimitOrders";

const REFETCH_INTERVAL_MS = 30_000;

export type OrderBookLevel = {
  id: string;
  tickLower: number;
  zeroForOne: boolean;
  /** Total liquidity units resting at the level. */
  liquidity: bigint;
  /** Distinct accounts with an order at the level. */
  orders: number;
};

export type OutcomeOrderBook = {
  outcomeIndex: number;
  pool: PoolMeta;
  /** Buy orders for the outcome. */
  bids: OrderBookLevel[];
  /** Sell orders for the outcome. */
  asks: OrderBookLevel[];
};

/**
 * Resting limit-order levels of every outcome pool of the market, split into bids and asks.
 * Filled levels are reset to zero liquidity by the indexer, so only live depth is returned.
 * This module is reached from the SSR graph through the liquidity chart, so it must not import
 * `@seer-pm/order-book/v4` (the Uniswap SDKs break server rendering).
 */
export function useMarketOrderLevels(market: Market) {
  const enabled = marketSupportsOrderBook(market);

  return useQuery({
    // Shares the user-orders key prefix so placing or cancelling an order refreshes the depth too.
    queryKey: ["limitOrderHookUserOrders", market.chainId, market.id, "levels"],
    enabled,
    refetchInterval: enabled ? REFETCH_INTERVAL_MS : false,
    queryFn: async (): Promise<OutcomeOrderBook[]> => {
      const client = orderBookGraphQLClient(market.chainId);
      if (!client) throw new Error("Limit order subgraph not available");

      const poolById = getMarketPoolMeta(market);
      if (poolById.size === 0) return [];

      const { OrderLevel: levels } = await getLimitOrderSdk(client).GetOrderLevels({
        limit: 1000,
        where: {
          chainId: { _eq: String(market.chainId) },
          pool: { poolId: { _in: Array.from(poolById.keys()) } },
          liquidityTotal: { _gt: "0" },
        },
      });

      const books = new Map<number, OutcomeOrderBook>();
      for (const level of levels) {
        if (!level.pool) continue;
        const pool = poolById.get(level.pool.poolId.toLowerCase());
        if (!pool) continue;

        const book = books.get(pool.outcomeIndex) ?? { outcomeIndex: pool.outcomeIndex, pool, bids: [], asks: [] };
        const isBuy = level.zeroForOne === !pool.outcomeIsToken0;
        (isBuy ? book.bids : book.asks).push({
          id: level.id,
          tickLower: level.tickLower,
          zeroForOne: level.zeroForOne,
          liquidity: BigInt(level.liquidityTotal),
          orders: level.participants.length,
        });
        books.set(pool.outcomeIndex, book);
      }

      return Array.from(books.values()).sort((a, b) => a.outcomeIndex - b.outcomeIndex);
    },
  });
}

/**
 * Resting limit-order levels of one outcome, in the shape the liquidity chart consumes.
 * Empty unless `pool` is the outcome's hooked V4 pool, since only that pool holds orders.
 */
export function useOutcomeOrderLevels(
  market: Market,
  outcomeIndex: number,
  pool: { version?: "v3" | "v4" },
): ChartOrderLevel[] {
  const { data: books } = useMarketOrderLevels(market);
  return useMemo(() => {
    if (pool.version !== "v4" || !books) return [];
    const book = books.find((b) => b.outcomeIndex === outcomeIndex);
    if (!book) return [];
    return [...book.bids, ...book.asks].map(({ tickLower, liquidity, orders }) => ({ tickLower, liquidity, orders }));
  }, [books, outcomeIndex, pool.version]);
}

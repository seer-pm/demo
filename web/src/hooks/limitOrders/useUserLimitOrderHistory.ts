import type { PoolMeta } from "@/components/LimitOrders/ordersShared";
import { chainSupportsOrderBook } from "@seer-pm/order-book";
import { type Market, type SupportedChain, orderBookGraphQLClient } from "@seer-pm/sdk";
import { Order_By, getSdk as getLimitOrderSdk } from "@seer-pm/sdk/subgraph/limit-order-hook";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { getMarketPoolMeta, resolvePoolMeta } from "./useUserLimitOrders";

const REFETCH_INTERVAL_MS = 30_000;
const HISTORY_LIMIT = 300;

export type OrderEventType = "PLACE" | "FILL" | "CANCEL" | "WITHDRAW";

export type UiOrderEvent = {
  id: string;
  type: OrderEventType;
  timestamp: number;
  transactionHash: string;
  orderId: string;
  poolId: Address;
  outcomeIndex: number;
  outcomeIsToken0: boolean;
  tickLower: number;
  zeroForOne: boolean;
  /** Liquidity units the event moved; for fills, the account's own order size at that level. */
  liquidity: string;
};

export type UserLimitOrderHistoryData = {
  events: UiOrderEvent[];
  poolById: Map<string, PoolMeta>;
};

/**
 * The account's limit-order history: places, cancels and withdrawals it signed, plus the fills
 * of the levels it had an order in. Fill events carry no owner in the indexer, so they are
 * matched through the account's order ids.
 */
export function useUserLimitOrderHistory(account: Address | undefined, chainId: SupportedChain, market?: Market) {
  const orderBookSupported = chainSupportsOrderBook(chainId);

  return useQuery({
    queryKey: ["limitOrderHookUserOrders", chainId, market?.id ?? "all", account, "history"],
    enabled: Boolean(account) && orderBookSupported,
    refetchInterval: account && orderBookSupported ? REFETCH_INTERVAL_MS : false,
    queryFn: async (): Promise<UserLimitOrderHistoryData> => {
      if (!account) throw new Error("Account required");

      const client = orderBookGraphQLClient(chainId);
      if (!client) throw new Error("Limit order subgraph not available");

      const sdk = getLimitOrderSdk(client);
      const owner = account.toLowerCase();
      const marketPools = market ? getMarketPoolMeta(market) : undefined;
      if (marketPools && marketPools.size === 0) {
        return { events: [], poolById: marketPools };
      }
      const poolFilter = marketPools ? { pool: { poolId: { _in: Array.from(marketPools.keys()) } } } : {};

      const { UserOrder: userOrders } = await sdk.GetUserOrders({
        limit: 500,
        where: { chainId: { _eq: String(chainId) }, owner: { _eq: owner }, ...poolFilter },
      });
      const orderLiquidityById = new Map(userOrders.map((o) => [String(o.orderId), o.liquidity]));

      const { OrderEvent: rawEvents } = await sdk.GetOrderEvents({
        limit: HISTORY_LIMIT,
        orderBy: [{ timestamp: Order_By.Desc }],
        where: {
          chainId: { _eq: String(chainId) },
          ...poolFilter,
          _or: [
            { owner: { _eq: owner } },
            { type: { _eq: "FILL" }, orderId: { _in: Array.from(orderLiquidityById.keys()) } },
          ],
        },
      });

      const poolById = marketPools ?? (await resolvePoolMeta([...userOrders, ...rawEvents], chainId));

      const events = rawEvents.flatMap((e): UiOrderEvent[] => {
        if (!e.pool || e.tickLower === null || e.tickLower === undefined || e.zeroForOne === null) return [];
        const poolId = e.pool.poolId.toLowerCase() as Address;
        const pool = poolById.get(poolId);
        if (!pool) return [];
        const liquidity = e.type === "FILL" ? orderLiquidityById.get(String(e.orderId)) : e.liquidity;
        return [
          {
            id: e.id,
            type: e.type as OrderEventType,
            timestamp: Number(e.timestamp),
            transactionHash: e.transactionHash,
            orderId: String(e.orderId),
            poolId,
            outcomeIndex: pool.outcomeIndex,
            outcomeIsToken0: pool.outcomeIsToken0,
            tickLower: e.tickLower,
            zeroForOne: e.zeroForOne ?? false,
            liquidity: liquidity ?? "0",
          },
        ];
      });

      return { events, poolById };
    },
  });
}

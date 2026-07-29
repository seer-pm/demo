import Button from "@/components/Form/Button";
import OrdersTable from "@/components/LimitOrders/OrdersTable";
import type { PoolMeta, UiUserOrder } from "@/components/LimitOrders/ordersShared";
import { useCheck7702Support } from "@/hooks/useCheck7702Support";
import { toastifyTx } from "@/lib/toastify";
import {
  type LimitOrderWithdrawAmounts,
  getLimitOrderWithdrawAmounts,
  getOrderBookPoolParams,
  getV4PoolId,
} from "@seer-pm/order-book/v4";
import { useCancelV4LimitOrders, useWithdrawV4LimitOrders } from "@seer-pm/react/hooks/useManageV4LimitOrders";
import { type Market, orderBookGraphQLClient } from "@seer-pm/sdk";
import { UserOrderStatus, getSdk as getLimitOrderSdk } from "@seer-pm/sdk/subgraph/limit-order-hook";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Address } from "viem";
import { useAccount, useConfig } from "wagmi";

export default function OpenOrders({ market }: { market: Market }) {
  const { address } = useAccount();
  const config = useConfig();
  const supports7702 = useCheck7702Support();
  const cancelOrders = useCancelV4LimitOrders(toastifyTx, supports7702);
  const withdrawOrders = useWithdrawV4LimitOrders(toastifyTx, supports7702);

  const poolById = useMemo(() => {
    const map = new Map<string, PoolMeta>();

    for (let outcomeIndex = 0; outcomeIndex < market.wrappedTokens.length; outcomeIndex++) {
      const params = getOrderBookPoolParams(market, outcomeIndex);
      const poolId = getV4PoolId(params.poolKey);
      map.set(poolId.toLowerCase(), {
        outcomeIndex,
        outcomeIsToken0: params.outcomeIsToken0,
        poolKey: params.poolKey,
        market,
      });
    }

    return map;
  }, [market]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["limitOrderHookUserOrders", market.chainId, market.id, address],
    enabled: Boolean(address),
    queryFn: async () => {
      if (!address) throw new Error("Wallet not connected");

      const client = orderBookGraphQLClient(market.chainId);
      if (!client) throw new Error("Limit order subgraph not available");

      const sdk = getLimitOrderSdk(client);
      const poolIds = Array.from(poolById.keys());
      if (poolIds.length === 0) return { open: [] as UiUserOrder[], filled: [] as UiUserOrder[] };

      const owner = address.toLowerCase() as Address;

      const [openRes, filledRes] = await Promise.all([
        sdk.GetUserOrders({
          first: 500,
          where: {
            owner,
            pool_in: poolIds,
            status_in: [UserOrderStatus.Open],
          },
        }),
        sdk.GetUserOrders({
          first: 500,
          where: {
            owner,
            pool_in: poolIds,
            status_in: [UserOrderStatus.Filled],
          },
        }),
      ]);

      const mapOrder = (o: (typeof openRes)["userOrders"][number]): UiUserOrder | null => {
        const pool = poolById.get(o.pool.id.toLowerCase());
        if (!pool) return null;

        return {
          id: o.id,
          orderId: o.orderId,
          owner: o.owner,
          poolId: o.pool.id,
          outcomeIndex: pool.outcomeIndex,
          outcomeIsToken0: pool.outcomeIsToken0,
          tickLower: o.tickLower,
          zeroForOne: o.zeroForOne,
          status: o.status,
          liquidity: o.liquidity,
          placedAtBlock: o.placedAtBlock,
          updatedAtBlock: o.updatedAtBlock,
        };
      };

      return {
        open: openRes.userOrders.map(mapOrder).filter(Boolean) as UiUserOrder[],
        filled: filledRes.userOrders.map(mapOrder).filter(Boolean) as UiUserOrder[],
      };
    },
  });

  const filledOrders = data?.filled ?? [];

  const withdrawAmountQueries = useQueries({
    queries: filledOrders.map((order) => ({
      queryKey: ["limitOrderWithdrawAmounts", market.chainId, order.orderId, address],
      enabled: Boolean(address),
      queryFn: async () => {
        if (!address) return null;
        return getLimitOrderWithdrawAmounts(config, {
          chainId: market.chainId,
          orderId: BigInt(order.orderId),
          owner: address,
        });
      },
    })),
  });

  const withdrawAmountsByOrderId = useMemo(() => {
    const map = new Map<string, LimitOrderWithdrawAmounts>();
    filledOrders.forEach((order, index) => {
      const amounts = withdrawAmountQueries[index]?.data;
      if (amounts) {
        map.set(order.id, amounts);
      }
    });
    return map;
  }, [filledOrders, withdrawAmountQueries]);

  const withdrawAmountsLoadingByOrderId = useMemo(() => {
    const map = new Map<string, boolean>();
    filledOrders.forEach((order, index) => {
      const query = withdrawAmountQueries[index];
      if (query?.isLoading || query?.isFetching) {
        map.set(order.id, true);
      }
    });
    return map;
  }, [filledOrders, withdrawAmountQueries]);

  const toCancelParams = (order: UiUserOrder) => {
    if (!address) throw new Error("Connect your wallet");
    const pool = poolById.get(order.poolId.toLowerCase());
    if (!pool) throw new Error("Unknown pool");
    return {
      chainId: market.chainId,
      poolKey: pool.poolKey,
      tickLower: order.tickLower,
      zeroForOne: order.zeroForOne,
      owner: address,
    };
  };

  const toWithdrawParams = (order: UiUserOrder) => {
    if (!address) throw new Error("Connect your wallet");
    return {
      chainId: market.chainId,
      orderId: BigInt(order.orderId),
      owner: address,
    };
  };

  const cancelOrder = async (order: UiUserOrder) => {
    await cancelOrders.mutateAsync([toCancelParams(order)]);
  };

  const cancelAll = async (orders: UiUserOrder[]) => {
    await cancelOrders.mutateAsync(orders.map(toCancelParams));
  };

  const withdraw = async (order: UiUserOrder) => {
    await withdrawOrders.mutateAsync([toWithdrawParams(order)]);
  };

  const withdrawAll = async (orders: UiUserOrder[]) => {
    await withdrawOrders.mutateAsync(orders.map(toWithdrawParams));
  };

  if (!address) {
    return (
      <div className="p-4 card shadow-sm border-separator-100">
        <div className="text-[14px] opacity-70">Connect your wallet to see your open orders.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 card shadow-sm border-separator-100">
        <div className="text-[14px] opacity-70">Loading open orders…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 card shadow-sm border-separator-100">
        <div className="text-[14px] text-error">Failed to load open orders: {(error as Error).message}</div>
      </div>
    );
  }

  const open = data?.open ?? [];
  const filled = data?.filled ?? [];

  return (
    <div className="p-4 card shadow-sm border-separator-100">
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="text-[16px] font-semibold">Open</div>
            {open.length >= 2 && (
              <Button
                size="small"
                text="Cancel all"
                onClick={() => cancelAll(open)}
                disabled={cancelOrders.isPending}
                isLoading={cancelOrders.isPending}
              />
            )}
          </div>
          {open.length === 0 ? (
            <div className="text-[14px] opacity-70">No open orders.</div>
          ) : (
            <OrdersTable
              orders={open}
              market={market}
              poolById={poolById}
              amountColumnLabel="Size"
              actionLabel="Cancel"
              onAction={cancelOrder}
              isActionLoading={cancelOrders.isPending}
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="text-[16px] font-semibold">Filled (withdrawable)</div>
            {filled.length >= 2 && (
              <Button
                size="small"
                text="Withdraw all"
                onClick={() => withdrawAll(filled)}
                disabled={withdrawOrders.isPending}
                isLoading={withdrawOrders.isPending}
              />
            )}
          </div>
          {filled.length === 0 ? (
            <div className="text-[14px] opacity-70">No filled orders to withdraw.</div>
          ) : (
            <OrdersTable
              orders={filled}
              market={market}
              poolById={poolById}
              withdrawAmountsByOrderId={withdrawAmountsByOrderId}
              withdrawAmountsLoadingByOrderId={withdrawAmountsLoadingByOrderId}
              amountColumnLabel="Withdrawable"
              actionLabel="Withdraw"
              onAction={withdraw}
              isActionLoading={withdrawOrders.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}

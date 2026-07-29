import { Alert } from "@/components/Alert";
import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import OrdersTable from "@/components/LimitOrders/OrdersTable";
import type { PoolMeta, UiUserOrder } from "@/components/LimitOrders/ordersShared";
import { useUserLimitOrders } from "@/hooks/limitOrders/useUserLimitOrders";
import { useCheck7702Support } from "@/hooks/useCheck7702Support";
import { SearchIcon } from "@/lib/icons";
import { toastifyTx } from "@/lib/toastify";
import { isTextInString } from "@/lib/utils";
import {
  type LimitOrderWithdrawAmounts,
  chainSupportsOrderBook,
  getLimitOrderWithdrawAmounts,
} from "@seer-pm/order-book/v4";
import { useCancelV4LimitOrders, useWithdrawV4LimitOrders } from "@seer-pm/react/hooks/useManageV4LimitOrders";
import type { SupportedChain } from "@seer-pm/sdk";
import { useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { type Address, isAddressEqual } from "viem";
import { useAccount, useConfig } from "wagmi";

function OrdersTab({ account, chainId }: { account: Address | undefined; chainId: SupportedChain }) {
  const { address: connectedAddress } = useAccount();
  const config = useConfig();
  const supports7702 = useCheck7702Support();
  const cancelOrders = useCancelV4LimitOrders(toastifyTx, supports7702);
  const withdrawOrders = useWithdrawV4LimitOrders(toastifyTx, supports7702);
  const [filterMarketName, setFilterMarketName] = useState("");

  const canManage =
    account !== undefined && connectedAddress !== undefined && isAddressEqual(account, connectedAddress);

  const orderBookSupported = chainSupportsOrderBook(chainId);

  const { data, isLoading, error } = useUserLimitOrders(account, chainId);

  const filledOrders = data?.filled ?? [];
  const poolById = data?.poolById ?? new Map<string, PoolMeta>();

  const withdrawAmountQueries = useQueries({
    queries: filledOrders.map((order) => ({
      queryKey: ["limitOrderWithdrawAmounts", chainId, order.orderId, account],
      enabled: Boolean(account) && orderBookSupported,
      queryFn: async () => {
        if (!account) return null;
        return getLimitOrderWithdrawAmounts(config, {
          chainId,
          orderId: BigInt(order.orderId),
          owner: account,
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

  const filterOrders = (orders: UiUserOrder[]) => {
    if (!filterMarketName) return orders;
    return orders.filter((order) => {
      const pool = poolById.get(order.poolId.toLowerCase());
      const market = pool?.market;
      if (!market) return false;
      const outcome = market.outcomes[order.outcomeIndex] ?? "";
      return isTextInString(filterMarketName, market.marketName) || isTextInString(filterMarketName, outcome);
    });
  };

  const toCancelParams = (order: UiUserOrder) => {
    if (!connectedAddress) throw new Error("Connect your wallet");
    const pool = poolById.get(order.poolId.toLowerCase());
    if (!pool) throw new Error("Unknown pool");
    return {
      chainId,
      poolKey: pool.poolKey,
      tickLower: order.tickLower,
      zeroForOne: order.zeroForOne,
      owner: connectedAddress,
    };
  };

  const toWithdrawParams = (order: UiUserOrder) => {
    if (!connectedAddress) throw new Error("Connect your wallet");
    return {
      chainId,
      orderId: BigInt(order.orderId),
      owner: connectedAddress,
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

  if (!account) {
    return <Alert type="warning">Connect your wallet to see your open orders.</Alert>;
  }

  if (!orderBookSupported) {
    return <Alert type="warning">Limit orders are not available on this chain.</Alert>;
  }

  if (isLoading) {
    return <div className="shimmer-container w-full h-[200px]" />;
  }

  if (error) {
    return <Alert type="error">Failed to load open orders: {(error as Error).message}</Alert>;
  }

  const open = filterOrders(data?.open ?? []);
  const filled = filterOrders(data?.filled ?? []);

  return (
    <div>
      <div className="grow mb-6">
        <Input
          placeholder="Search by market or outcome"
          className="w-full"
          icon={<SearchIcon />}
          onKeyUp={(event) => setFilterMarketName((event.target as HTMLInputElement).value)}
        />
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="text-[16px] font-semibold">Open</div>
            {canManage && open.length >= 2 && (
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
              poolById={poolById}
              amountColumnLabel="Size"
              actionLabel="Cancel"
              onAction={cancelOrder}
              isActionLoading={cancelOrders.isPending}
              showMarketColumn
              showActions={canManage}
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="text-[16px] font-semibold">Filled (withdrawable)</div>
            {canManage && filled.length >= 2 && (
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
              poolById={poolById}
              withdrawAmountsByOrderId={withdrawAmountsByOrderId}
              withdrawAmountsLoadingByOrderId={withdrawAmountsLoadingByOrderId}
              amountColumnLabel="Withdrawable"
              actionLabel="Withdraw"
              onAction={withdraw}
              isActionLoading={withdrawOrders.isPending}
              showMarketColumn
              showActions={canManage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default OrdersTab;

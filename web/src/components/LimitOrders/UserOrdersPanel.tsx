import { Alert } from "@/components/Alert";
import Button from "@/components/Form/Button";
import OrdersTable from "@/components/LimitOrders/OrdersTable";
import type { UiUserOrder } from "@/components/LimitOrders/ordersShared";
import { useUserLimitOrders } from "@/hooks/limitOrders/useUserLimitOrders";
import { useCheck7702Support } from "@/hooks/useCheck7702Support";
import { toastifyTx } from "@/lib/toastify";
import { isTextInString } from "@/lib/utils";
import {
  type LimitOrderWithdrawAmounts,
  chainSupportsOrderBook,
  getLimitOrderWithdrawAmounts,
} from "@seer-pm/order-book/v4";
import { useCancelV4LimitOrders, useWithdrawV4LimitOrders } from "@seer-pm/react/hooks/useManageV4LimitOrders";
import type { Market, SupportedChain } from "@seer-pm/sdk";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { type Address, isAddressEqual } from "viem";
import { useAccount, useConfig } from "wagmi";

/**
 * The account's open and filled limit orders with cancel / withdraw actions.
 * Scoped to one market when `market` is given, otherwise to every market on the chain.
 * Actions are only offered when the connected wallet is the account being viewed.
 */
export default function UserOrdersPanel({
  account,
  chainId,
  market,
  filterText = "",
}: {
  account: Address | undefined;
  chainId: SupportedChain;
  market?: Market;
  filterText?: string;
}) {
  const { address: connectedAddress } = useAccount();
  const config = useConfig();
  const supports7702 = useCheck7702Support();
  const cancelOrders = useCancelV4LimitOrders(toastifyTx, supports7702);
  const withdrawOrders = useWithdrawV4LimitOrders(toastifyTx, supports7702);

  const canManage =
    account !== undefined && connectedAddress !== undefined && isAddressEqual(account, connectedAddress);
  const orderBookSupported = chainSupportsOrderBook(chainId);

  const { data, isLoading, error } = useUserLimitOrders(account, chainId, market);

  const filledOrders = data?.filled ?? [];
  const poolById = data?.poolById;

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

  if (!account) {
    return <Alert type="warning">Connect your wallet to see your open orders.</Alert>;
  }

  if (!orderBookSupported) {
    return <Alert type="warning">Limit orders are not available on this chain.</Alert>;
  }

  if (isLoading) {
    return <div className="shimmer-container w-full h-[200px]" />;
  }

  if (error || !poolById) {
    return <Alert type="error">Failed to load open orders: {(error as Error | null)?.message}</Alert>;
  }

  const filterOrders = (orders: UiUserOrder[]) => {
    if (!filterText) return orders;
    return orders.filter((order) => {
      const orderMarket = poolById.get(order.poolId.toLowerCase())?.market;
      if (!orderMarket) return false;
      const outcome = orderMarket.outcomes[order.outcomeIndex] ?? "";
      return isTextInString(filterText, orderMarket.marketName) || isTextInString(filterText, outcome);
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

  const open = filterOrders(data?.open ?? []);
  const filled = filterOrders(filledOrders);
  const showMarketColumn = market === undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-[16px] font-semibold">Open</div>
          {canManage && open.length >= 2 && (
            <Button
              size="small"
              text="Cancel all"
              onClick={() => cancelOrders.mutateAsync(open.map(toCancelParams))}
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
            onAction={(order) => cancelOrders.mutateAsync([toCancelParams(order)])}
            isActionLoading={cancelOrders.isPending}
            showMarketColumn={showMarketColumn}
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
              onClick={() => withdrawOrders.mutateAsync(filled.map(toWithdrawParams))}
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
            onAction={(order) => withdrawOrders.mutateAsync([toWithdrawParams(order)])}
            isActionLoading={withdrawOrders.isPending}
            showMarketColumn={showMarketColumn}
            showActions={canManage}
          />
        )}
      </div>
    </div>
  );
}

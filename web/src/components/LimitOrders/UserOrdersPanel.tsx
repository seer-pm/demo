import { Alert } from "@/components/Alert";
import Button from "@/components/Form/Button";
import OrderHistoryTable from "@/components/LimitOrders/OrderHistoryTable";
import OrdersTable from "@/components/LimitOrders/OrdersTable";
import type { PoolMeta, UiUserOrder } from "@/components/LimitOrders/ordersShared";
import { useUserLimitOrderHistory } from "@/hooks/limitOrders/useUserLimitOrderHistory";
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
import clsx from "clsx";
import { useMemo, useState } from "react";
import { type Address, isAddressEqual } from "viem";
import { useAccount, useConfig } from "wagmi";

type PanelView = "active" | "history";

const VIEWS: { id: PanelView; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "history", label: "History" },
];

function ViewSwitch({ value, onChange }: { value: PanelView; onChange: (view: PanelView) => void }) {
  return (
    <div className="flex gap-1 mb-4" role="tablist" aria-label="Orders view">
      {VIEWS.map((view) => (
        <button
          key={view.id}
          type="button"
          role="tab"
          aria-selected={value === view.id}
          className={clsx(
            "px-3 py-1 rounded-full text-[13px] border",
            value === view.id
              ? "bg-purple-primary text-white border-purple-primary"
              : "border-separator-100 text-black-secondary hover:border-purple-primary",
          )}
          onClick={() => onChange(view.id)}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}

function filterByMarketText<T extends { poolId: Address; outcomeIndex: number }>(
  rows: T[],
  poolById: Map<string, PoolMeta>,
  filterText: string,
): T[] {
  if (!filterText) return rows;
  return rows.filter((row) => {
    const rowMarket = poolById.get(row.poolId.toLowerCase())?.market;
    if (!rowMarket) return false;
    const outcome = rowMarket.outcomes[row.outcomeIndex] ?? "";
    return isTextInString(filterText, rowMarket.marketName) || isTextInString(filterText, outcome);
  });
}

function OrderHistory({
  account,
  chainId,
  market,
  filterText,
}: {
  account: Address;
  chainId: SupportedChain;
  market?: Market;
  filterText: string;
}) {
  const { data, isLoading, error } = useUserLimitOrderHistory(account, chainId, market);

  if (isLoading) {
    return <div className="shimmer-container w-full h-[200px]" />;
  }

  if (error || !data) {
    return <Alert type="error">Failed to load order history: {(error as Error | null)?.message}</Alert>;
  }

  const events = filterByMarketText(data.events, data.poolById, filterText);

  if (events.length === 0) {
    return <div className="text-[14px] opacity-70">No order history yet.</div>;
  }

  return (
    <OrderHistoryTable
      events={events}
      chainId={chainId}
      market={market}
      poolById={data.poolById}
      showMarketColumn={market === undefined}
    />
  );
}

/**
 * The account's limit orders: an "Active" view with open and filled (withdrawable) orders and
 * cancel / withdraw actions, and a "History" view with every place, fill, cancel and withdrawal.
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
  const [view, setView] = useState<PanelView>("active");
  const orderBookSupported = chainSupportsOrderBook(chainId);

  if (!account) {
    return <Alert type="warning">Connect your wallet to see your open orders.</Alert>;
  }

  if (!orderBookSupported) {
    return <Alert type="warning">Limit orders are not available on this chain.</Alert>;
  }

  return (
    <div>
      <ViewSwitch value={view} onChange={setView} />
      {view === "active" ? (
        <ActiveOrders account={account} chainId={chainId} market={market} filterText={filterText} />
      ) : (
        <OrderHistory account={account} chainId={chainId} market={market} filterText={filterText} />
      )}
    </div>
  );
}

function ActiveOrders({
  account,
  chainId,
  market,
  filterText,
}: {
  account: Address;
  chainId: SupportedChain;
  market?: Market;
  filterText: string;
}) {
  const { address: connectedAddress } = useAccount();
  const config = useConfig();
  const supports7702 = useCheck7702Support();
  const cancelOrders = useCancelV4LimitOrders(toastifyTx, supports7702);
  const withdrawOrders = useWithdrawV4LimitOrders(toastifyTx, supports7702);

  const canManage = connectedAddress !== undefined && isAddressEqual(account, connectedAddress);

  const { data, isLoading, error } = useUserLimitOrders(account, chainId, market);

  const filledOrders = data?.filled ?? [];
  const poolById = data?.poolById;

  const withdrawAmountQueries = useQueries({
    queries: filledOrders.map((order) => ({
      queryKey: ["limitOrderWithdrawAmounts", chainId, order.orderId, account],
      queryFn: async () => {
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

  if (isLoading) {
    return <div className="shimmer-container w-full h-[200px]" />;
  }

  if (error || !poolById) {
    return <Alert type="error">Failed to load open orders: {(error as Error | null)?.message}</Alert>;
  }

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

  const open = filterByMarketText(data?.open ?? [], poolById, filterText);
  const filled = filterByMarketText(filledOrders, poolById, filterText);
  const groupByMarket = market === undefined;

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
            groupByMarket={groupByMarket}
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
            groupByMarket={groupByMarket}
            showActions={canManage}
          />
        )}
      </div>
    </div>
  );
}

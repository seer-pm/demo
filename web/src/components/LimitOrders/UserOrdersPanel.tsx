import { Alert } from "@/components/Alert";
import OrderHistoryTable from "@/components/LimitOrders/OrderHistoryTable";
import OrdersTable, { type ActiveOrderRow } from "@/components/LimitOrders/OrdersTable";
import type { OrdersPanelView, PoolMeta, UiUserOrder } from "@/components/LimitOrders/ordersShared";
import { LoadError, LoadingBlock, RefreshError } from "@/components/LoadStates";
import { useUserLimitOrderHistory } from "@/hooks/limitOrders/useUserLimitOrderHistory";
import { ORDERS_LIMIT, useUserLimitOrders } from "@/hooks/limitOrders/useUserLimitOrders";
import { useCheck7702Support } from "@/hooks/useCheck7702Support";
import { PRIMARY_BUTTON_CLASS, QUIET_BUTTON_CLASS } from "@/lib/buttonClasses";
import { toastifyTx } from "@/lib/toastify";
import { displayBalance, isTextInString } from "@/lib/utils";
import {
  type LimitOrderWithdrawAmounts,
  chainSupportsOrderBook,
  getLimitOrderWithdrawAmounts,
} from "@seer-pm/order-book/v4";
import { useCancelV4LimitOrders, useWithdrawV4LimitOrders } from "@seer-pm/react/hooks/useManageV4LimitOrders";
import { type Market, type SupportedChain, getActivePrimaryCollateral } from "@seer-pm/sdk";
import { useQueries } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { type Address, isAddressEqual } from "viem";
import { useAccount, useConfig } from "wagmi";

const VIEWS: { id: OrdersPanelView; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "activity", label: "Activity" },
];

function plural(count: number, one: string, many: string) {
  return count === 1 ? one : many;
}

function ViewSwitch({ value, onChange }: { value: OrdersPanelView; onChange: (view: OrdersPanelView) => void }) {
  return (
    <fieldset className="flex flex-wrap gap-2 items-center mb-5" aria-label="Orders view">
      {VIEWS.map((view) => (
        <button
          key={view.id}
          type="button"
          aria-pressed={value === view.id}
          className={clsx(
            "btn btn-sm min-h-11 px-3",
            value === view.id ? "btn-primary" : "btn-ghost border border-separator-100",
          )}
          onClick={() => onChange(view.id)}
        >
          {view.label}
        </button>
      ))}
    </fieldset>
  );
}

const INDEXER_ERROR = "The order book indexer didn't answer. Nothing changed on-chain.";

function NoMatches({ filterText, onClearFilter }: { filterText: string; onClearFilter?: () => void }) {
  return (
    <Alert type="info" title="No matching orders">
      <div className="space-y-3">
        <p>Nothing matches “{filterText}”.</p>
        {onClearFilter && (
          <button type="button" className={QUIET_BUTTON_CLASS} onClick={onClearFilter}>
            Clear search
          </button>
        )}
      </div>
    </Alert>
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

type PanelProps = {
  account: Address;
  chainId: SupportedChain;
  market?: Market;
  filterText: string;
  onClearFilter?: () => void;
};

function OrderActivity({ account, chainId, market, filterText, onClearFilter }: PanelProps) {
  const { data, isLoading, error, refetch, isFetching } = useUserLimitOrderHistory(account, chainId, market);

  if (isLoading || (!data && !error)) {
    return <LoadingBlock label="Loading order activity" />;
  }

  // The full error is only for a list that never loaded; cached events stay up when a refetch fails.
  if (!data) {
    return (
      <LoadError
        title="Couldn't load order activity"
        description={INDEXER_ERROR}
        error={error}
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const refreshNotice = error ? (
    <RefreshError subject="order activity" onRetry={() => refetch()} isRetrying={isFetching} />
  ) : null;

  if (data.events.length === 0) {
    return (
      <>
        {refreshNotice}
        <Alert type="info" title="No order activity yet">
          Placed, filled, cancelled and withdrawn limit orders show up here.
        </Alert>
      </>
    );
  }

  const events = filterByMarketText(data.events, data.poolById, filterText);

  if (events.length === 0) {
    return (
      <>
        {refreshNotice}
        <NoMatches filterText={filterText} onClearFilter={onClearFilter} />
      </>
    );
  }

  return (
    <>
      {refreshNotice}
      <OrderHistoryTable
        events={events}
        chainId={chainId}
        market={market}
        poolById={data.poolById}
        showMarketColumn={market === undefined}
      />
    </>
  );
}

/**
 * The account's limit orders: an "Active" view with filled (withdrawable) and open orders and their
 * withdraw / cancel actions, and an "Activity" view with every place, fill, cancel and withdrawal.
 * Scoped to one market when `market` is given, otherwise to every market on the chain.
 * Actions are only offered when the connected wallet is the account being viewed.
 * Pass `view` and `onViewChange` to keep the sub-view outside (e.g. in the URL).
 */
export default function UserOrdersPanel({
  account,
  chainId,
  market,
  filterText = "",
  onClearFilter,
  view: controlledView,
  onViewChange,
}: {
  account: Address | undefined;
  chainId: SupportedChain;
  market?: Market;
  filterText?: string;
  onClearFilter?: () => void;
  view?: OrdersPanelView;
  onViewChange?: (view: OrdersPanelView) => void;
}) {
  const [localView, setLocalView] = useState<OrdersPanelView>("active");
  const view = controlledView ?? localView;
  const setView = onViewChange ?? setLocalView;
  const orderBookSupported = chainSupportsOrderBook(chainId);

  if (!account) {
    return <Alert type="warning">Connect your wallet to see your limit orders.</Alert>;
  }

  if (!orderBookSupported) {
    return <Alert type="warning">Limit orders are not available on this chain.</Alert>;
  }

  const panelProps = { account, chainId, market, filterText, onClearFilter };

  return (
    <div>
      <ViewSwitch value={view} onChange={setView} />
      {view === "active" ? (
        <ActiveOrders {...panelProps} onShowActivity={() => setView("activity")} />
      ) : (
        <OrderActivity {...panelProps} />
      )}
    </div>
  );
}

function ActiveOrders({
  account,
  chainId,
  market,
  filterText,
  onClearFilter,
  onShowActivity,
}: PanelProps & { onShowActivity: () => void }) {
  const { address: connectedAddress } = useAccount();
  const config = useConfig();
  const supports7702 = useCheck7702Support();
  const cancelOrders = useCancelV4LimitOrders(toastifyTx, supports7702);
  const withdrawOrders = useWithdrawV4LimitOrders(toastifyTx, supports7702);
  const [pendingOrderIds, setPendingOrderIds] = useState<Set<string>>(() => new Set());
  const [isConfirmingCancelAll, setIsConfirmingCancelAll] = useState(false);
  const keepOrdersRef = useRef<HTMLButtonElement>(null);
  const cancelAllPromptId = useId();

  const canManage = connectedAddress !== undefined && isAddressEqual(account, connectedAddress);

  const { data, isLoading, error, refetch, isFetching } = useUserLimitOrders(account, chainId, market);

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
      if (query?.isLoading) {
        map.set(order.id, true);
      }
    });
    return map;
  }, [filledOrders, withdrawAmountQueries]);

  // Moving focus into the confirmation keeps keyboard users on the decision they just opened.
  useEffect(() => {
    if (isConfirmingCancelAll) {
      keepOrdersRef.current?.focus();
    }
  }, [isConfirmingCancelAll]);

  if (isLoading || (!data && !error)) {
    return <LoadingBlock label="Loading your limit orders" />;
  }

  // The full error is only for a list that never loaded. The 30s poll and the fill watcher's
  // invalidations refetch this query constantly, and one failed poll used to wipe a loaded list.
  if (!data || !poolById) {
    return (
      <LoadError
        title="Couldn't load limit orders"
        description={INDEXER_ERROR}
        error={error}
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const refreshNotice = error ? (
    <RefreshError subject="your limit orders" onRetry={() => refetch()} isRetrying={isFetching} />
  ) : null;

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

  // Pending state is tracked per order so cancelling one row doesn't spin and lock every other row.
  const runOnOrders = async (orders: UiUserOrder[], action: () => Promise<unknown>) => {
    const ids = orders.map((order) => order.id);
    setPendingOrderIds((prev) => new Set([...prev, ...ids]));
    try {
      await action();
    } catch {
      // The transaction toast reports the failure; the rows just leave their pending state.
    } finally {
      setPendingOrderIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    }
  };

  const withdraw = (orders: UiUserOrder[]) =>
    runOnOrders(orders, () => withdrawOrders.mutateAsync(orders.map(toWithdrawParams)));
  const cancel = (orders: UiUserOrder[]) =>
    runOnOrders(orders, () => cancelOrders.mutateAsync(orders.map(toCancelParams)));

  const open = filterByMarketText(data.open, poolById, filterText);
  const filled = filterByMarketText(filledOrders, poolById, filterText);
  const rows: ActiveOrderRow[] = [
    ...filled.map((order) => ({ order, kind: "filled" as const })),
    ...open.map((order) => ({ order, kind: "open" as const })),
  ];

  const notices = (
    <>
      {refreshNotice}
      {(data.hiddenCount > 0 || data.truncated) && (
        <Alert type="warning" title="Some orders aren't listed" className="mb-4">
          {data.hiddenCount > 0 && (
            <p>
              {data.hiddenCount} {plural(data.hiddenCount, "order", "orders")} couldn't be matched to a market.
            </p>
          )}
          {data.truncated && <p>Only the first {ORDERS_LIMIT} orders of each status are loaded.</p>}
        </Alert>
      )}
    </>
  );

  if (data.open.length + data.filled.length === 0) {
    return (
      <>
        {notices}
        <Alert type="info" title="No active orders">
          <div className="space-y-3">
            <p>
              {market
                ? "No open or filled limit orders on this market."
                : "No open or filled limit orders on this network."}
            </p>
            <button type="button" className={QUIET_BUTTON_CLASS} onClick={onShowActivity}>
              See past activity
            </button>
          </div>
        </Alert>
      </>
    );
  }

  if (rows.length === 0) {
    return (
      <>
        {notices}
        <NoMatches filterText={filterText} onClearFilter={onClearFilter} />
      </>
    );
  }

  // Withdrawable collateral is summed; outcome tokens from different markets can't be added up.
  const collateral = getActivePrimaryCollateral(chainId);
  let withdrawableCollateral = 0n;
  let withdrawIncludesOutcomeTokens = false;
  for (const order of filled) {
    const amounts = withdrawAmountsByOrderId.get(order.id);
    const pool = poolById.get(order.poolId.toLowerCase());
    if (!amounts || !pool) continue;
    const [outcomeAmount, collateralAmount] = pool.outcomeIsToken0
      ? [amounts.amount0, amounts.amount1]
      : [amounts.amount1, amounts.amount0];
    withdrawableCollateral += collateralAmount;
    if (outcomeAmount > 0n) withdrawIncludesOutcomeTokens = true;
  }
  const isWithdrawTotalLoading = filled.some((order) => withdrawAmountsLoadingByOrderId.get(order.id));
  const isWithdrawingAll = filled.length > 0 && filled.every((order) => pendingOrderIds.has(order.id));
  const isAnyOpenPending = open.some((order) => pendingOrderIds.has(order.id));

  let withdrawSummary: string | null = null;
  if (filled.length > 0) {
    if (isWithdrawTotalLoading) {
      withdrawSummary = "…";
    } else if (withdrawableCollateral === 0n && withdrawIncludesOutcomeTokens) {
      withdrawSummary = `${filled.length} filled ${plural(filled.length, "order", "orders")}`;
    } else {
      withdrawSummary = `${displayBalance(withdrawableCollateral, collateral.decimals)} ${collateral.symbol}`;
    }
  }

  return (
    <div>
      {notices}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 mb-4">
        <p className="text-[15px] text-base-content/80 tabular-nums" aria-live="polite">
          {withdrawSummary && (
            <>
              <span className="text-[18px] leading-tight font-semibold text-base-content">{withdrawSummary}</span> ready
              to withdraw
              {withdrawIncludesOutcomeTokens && withdrawableCollateral > 0n ? " plus outcome tokens" : ""}
              <span aria-hidden> · </span>
            </>
          )}
          {open.length} open {plural(open.length, "order", "orders")}
        </p>
        {canManage && (open.length >= 2 || filled.length >= 2) && (
          <div className="flex flex-wrap gap-2">
            {open.length >= 2 && !isConfirmingCancelAll && (
              <button
                type="button"
                className={QUIET_BUTTON_CLASS}
                disabled={isAnyOpenPending}
                onClick={() => setIsConfirmingCancelAll(true)}
              >
                Cancel all open ({open.length})
              </button>
            )}
            {filled.length >= 2 && (
              <button
                type="button"
                className={PRIMARY_BUTTON_CLASS}
                disabled={isWithdrawingAll}
                onClick={() => withdraw(filled)}
              >
                {isWithdrawingAll ? (
                  <>
                    <span className="loading loading-spinner loading-xs" aria-hidden />
                    Withdrawing…
                  </>
                ) : (
                  `Withdraw all (${filled.length})`
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {isConfirmingCancelAll && (
        <fieldset
          aria-labelledby={cancelAllPromptId}
          className="mb-4 min-w-0 flex flex-wrap items-center justify-between gap-3 border border-separator-100 bg-base-200/40 px-4 py-3"
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsConfirmingCancelAll(false);
          }}
        >
          <p id={cancelAllPromptId} className="text-[15px]">
            Cancel {open.length} open orders? They'll be removed from the order book.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              ref={keepOrdersRef}
              type="button"
              className={QUIET_BUTTON_CLASS}
              onClick={() => setIsConfirmingCancelAll(false)}
            >
              Keep orders
            </button>
            <button
              type="button"
              className={PRIMARY_BUTTON_CLASS}
              onClick={() => {
                setIsConfirmingCancelAll(false);
                cancel(open);
              }}
            >
              Cancel {open.length} orders
            </button>
          </div>
        </fieldset>
      )}

      <OrdersTable
        rows={rows}
        market={market}
        poolById={poolById}
        withdrawAmountsByOrderId={withdrawAmountsByOrderId}
        withdrawAmountsLoadingByOrderId={withdrawAmountsLoadingByOrderId}
        pendingOrderIds={pendingOrderIds}
        onWithdraw={(order) => withdraw([order])}
        onCancel={(order) => cancel([order])}
        groupByMarket={market === undefined}
        showActions={canManage}
      />
    </div>
  );
}

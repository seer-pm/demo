import Button from "@/components/Form/Button";
import { paths } from "@/lib/paths";
import type { LimitOrderWithdrawAmounts } from "@seer-pm/order-book/v4";
import { getOutcomePriceAtTick } from "@seer-pm/order-book/v4";
import type { Market } from "@seer-pm/sdk";
import { Fragment } from "react";
import { type PoolMeta, type UiUserOrder, formatOrderSize, getOrderSideLabel } from "./ordersShared";

type MarketGroup = { key: string; market: Market | undefined; orders: UiUserOrder[] };

/** Buckets orders by the market their pool belongs to, keeping the orders' original order. */
function groupOrdersByMarket(
  orders: UiUserOrder[],
  poolById: Map<string, PoolMeta>,
  market: Market | undefined,
): MarketGroup[] {
  const groups = new Map<string, MarketGroup>();
  for (const order of orders) {
    const rowMarket = poolById.get(order.poolId.toLowerCase())?.market ?? market;
    const key = rowMarket?.id ?? "unknown";
    const group = groups.get(key) ?? { key, market: rowMarket, orders: [] };
    group.orders.push(order);
    groups.set(key, group);
  }
  return Array.from(groups.values());
}

function OrderRow({
  order,
  market,
  poolById,
  withdrawAmountsByOrderId,
  withdrawAmountsLoadingByOrderId,
  actionLabel,
  onAction,
  isActionLoading,
  showActions,
}: {
  order: UiUserOrder;
  market?: Market;
  poolById: Map<string, PoolMeta>;
  withdrawAmountsByOrderId?: Map<string, LimitOrderWithdrawAmounts>;
  withdrawAmountsLoadingByOrderId?: Map<string, boolean>;
  actionLabel: string;
  onAction: (order: UiUserOrder) => void;
  isActionLoading?: boolean;
  showActions: boolean;
}) {
  const pool = poolById.get(order.poolId.toLowerCase());
  const rowMarket = pool?.market ?? market;
  const limitPrice = getOutcomePriceAtTick(order.tickLower, order.outcomeIsToken0);
  const withdrawAmounts = withdrawAmountsByOrderId?.get(order.id);
  const isWithdrawLoading = withdrawAmountsLoadingByOrderId?.get(order.id);
  const sizeLabel =
    pool && rowMarket
      ? isWithdrawLoading
        ? "…"
        : formatOrderSize(order, pool, rowMarket, withdrawAmounts)
      : undefined;
  const outcomeLabel = rowMarket
    ? (rowMarket.outcomes[order.outcomeIndex] ?? `Outcome ${order.outcomeIndex}`)
    : `Outcome ${order.outcomeIndex}`;

  return (
    <tr>
      <td>{outcomeLabel}</td>
      <td>{getOrderSideLabel(order.zeroForOne, order.outcomeIsToken0)}</td>
      <td>{Number.isFinite(limitPrice) ? limitPrice.toFixed(4) : "-"}</td>
      <td>{sizeLabel ?? "-"}</td>
      {showActions && (
        <td className="text-right">
          <Button
            size="small"
            text={actionLabel}
            onClick={() => onAction(order)}
            disabled={isActionLoading}
            isLoading={isActionLoading}
          />
        </td>
      )}
    </tr>
  );
}

/**
 * Open or filled limit orders. With `groupByMarket` (the portfolio, where orders span several
 * markets) each market gets one header row above its orders instead of a repeated Market column.
 */
export default function OrdersTable({
  orders,
  market,
  poolById,
  withdrawAmountsByOrderId,
  withdrawAmountsLoadingByOrderId,
  amountColumnLabel,
  actionLabel,
  onAction,
  isActionLoading,
  groupByMarket = false,
  showActions = true,
}: {
  orders: UiUserOrder[];
  market?: Market;
  poolById: Map<string, PoolMeta>;
  withdrawAmountsByOrderId?: Map<string, LimitOrderWithdrawAmounts>;
  withdrawAmountsLoadingByOrderId?: Map<string, boolean>;
  amountColumnLabel: string;
  actionLabel: string;
  onAction: (order: UiUserOrder) => void;
  isActionLoading?: boolean;
  groupByMarket?: boolean;
  showActions?: boolean;
}) {
  const columnCount = 4 + (showActions ? 1 : 0);
  const rowProps = {
    market,
    poolById,
    withdrawAmountsByOrderId,
    withdrawAmountsLoadingByOrderId,
    actionLabel,
    onAction,
    isActionLoading,
    showActions,
  };

  return (
    <div className="overflow-x-auto">
      <table className="simple-table">
        <thead>
          <tr>
            <th>Outcome</th>
            <th>Side</th>
            <th>Limit price</th>
            <th>{amountColumnLabel}</th>
            {showActions && <th />}
          </tr>
        </thead>
        <tbody>
          {groupByMarket
            ? groupOrdersByMarket(orders, poolById, market).map((group) => (
                <Fragment key={group.key}>
                  <tr>
                    <td colSpan={columnCount} className="bg-base-200/40 font-semibold">
                      {group.market ? (
                        <a
                          href={paths.market(group.market)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-primary hover:underline"
                        >
                          {group.market.marketName}
                        </a>
                      ) : (
                        "Unknown market"
                      )}
                    </td>
                  </tr>
                  {group.orders.map((order) => (
                    <OrderRow key={order.id} order={order} {...rowProps} />
                  ))}
                </Fragment>
              ))
            : orders.map((order) => <OrderRow key={order.id} order={order} {...rowProps} />)}
        </tbody>
      </table>
    </div>
  );
}

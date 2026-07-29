import Button from "@/components/Form/Button";
import { paths } from "@/lib/paths";
import type { LimitOrderWithdrawAmounts } from "@seer-pm/order-book/v4";
import { getOutcomePriceAtTick } from "@seer-pm/order-book/v4";
import type { Market } from "@seer-pm/sdk";
import { type PoolMeta, type UiUserOrder, formatOrderSize, getOrderSideLabel } from "./ordersShared";

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
  showMarketColumn = false,
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
  showMarketColumn?: boolean;
  showActions?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="simple-table">
        <thead>
          <tr>
            {showMarketColumn && <th>Market</th>}
            <th>Outcome</th>
            <th>Side</th>
            <th>Limit price</th>
            <th>{amountColumnLabel}</th>
            {showActions && <th />}
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const pool = poolById.get(o.poolId.toLowerCase());
            const rowMarket = pool?.market ?? market;
            const limitPrice = getOutcomePriceAtTick(o.tickLower, o.outcomeIsToken0);
            const withdrawAmounts = withdrawAmountsByOrderId?.get(o.id);
            const isWithdrawLoading = withdrawAmountsLoadingByOrderId?.get(o.id);
            const sizeLabel =
              pool && rowMarket
                ? isWithdrawLoading
                  ? "…"
                  : formatOrderSize(o, pool, rowMarket, withdrawAmounts)
                : undefined;
            const outcomeLabel = rowMarket
              ? (rowMarket.outcomes[o.outcomeIndex] ?? `Outcome ${o.outcomeIndex}`)
              : `Outcome ${o.outcomeIndex}`;

            return (
              <tr key={o.id}>
                {showMarketColumn && (
                  <td>
                    {rowMarket ? (
                      <a
                        href={paths.market(rowMarket)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-primary hover:underline font-semibold"
                      >
                        {rowMarket.marketName}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                )}
                <td>{outcomeLabel}</td>
                <td>{getOrderSideLabel(o.zeroForOne, o.outcomeIsToken0)}</td>
                <td>{Number.isFinite(limitPrice) ? limitPrice.toFixed(4) : "-"}</td>
                <td>{sizeLabel ?? "-"}</td>
                {showActions && (
                  <td className="text-right">
                    <Button
                      size="small"
                      text={actionLabel}
                      onClick={() => onAction(o)}
                      disabled={isActionLoading}
                      isLoading={isActionLoading}
                    />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

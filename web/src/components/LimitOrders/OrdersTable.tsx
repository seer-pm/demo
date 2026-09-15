import { paths } from "@/lib/paths";
import { type LimitOrderWithdrawAmounts, getOutcomePriceAtTick } from "@seer-pm/order-book/v4";
import { type Market, MarketStatus, STATUS_TEXTS, getMarketStatus } from "@seer-pm/sdk";
import clsx from "clsx";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Fragment, type ReactNode } from "react";
import {
  ORDERS_TABLE_HEADER_CLASSES,
  type PoolMeta,
  type UiUserOrder,
  formatOrderSize,
  formatPriceCents,
  getOrderSideLabel,
  getOutcomeMarketPrice,
  getPriceToFill,
} from "./ordersShared";

export type ActiveOrderRow = { order: UiUserOrder; kind: "filled" | "open" };

type MarketGroup = { key: string; market: Market | undefined; rows: ActiveOrderRow[] };

/** What one row shows, derived once so the table and the narrow card layout stay identical. */
type OrderView = {
  side: "Buy" | "Sell";
  outcome: string;
  limit: string;
  marketPrice: string;
  /** Where the market sits relative to an open order's limit. */
  fillHint?: string;
  /** Undefined while a filled order's withdrawable amount is loading. */
  amount?: string;
  amountNote: string;
  placedAt?: number;
};

/** Buckets rows by the market their pool belongs to, keeping the rows' original order. */
function groupRowsByMarket(
  rows: ActiveOrderRow[],
  poolById: Map<string, PoolMeta>,
  market: Market | undefined,
): MarketGroup[] {
  const groups = new Map<string, MarketGroup>();
  for (const row of rows) {
    const rowMarket = poolById.get(row.order.poolId.toLowerCase())?.market ?? market;
    const key = rowMarket?.id ?? "unknown";
    const group = groups.get(key) ?? { key, market: rowMarket, rows: [] };
    group.rows.push(row);
    groups.set(key, group);
  }
  return Array.from(groups.values());
}

function describeRow(
  { order, kind }: ActiveOrderRow,
  market: Market | undefined,
  poolById: Map<string, PoolMeta>,
  withdrawAmountsByOrderId: Map<string, LimitOrderWithdrawAmounts>,
  withdrawAmountsLoadingByOrderId: Map<string, boolean>,
): OrderView {
  const pool = poolById.get(order.poolId.toLowerCase());
  const rowMarket = pool?.market ?? market;
  const side = getOrderSideLabel(order.zeroForOne, order.outcomeIsToken0);
  const limitPrice = getOutcomePriceAtTick(order.tickLower, order.outcomeIsToken0);
  const marketPrice = getOutcomeMarketPrice(rowMarket, order.outcomeIndex);

  let fillHint: string | undefined;
  if (kind === "open" && marketPrice !== undefined && Number.isFinite(limitPrice)) {
    const toFill = getPriceToFill(side, limitPrice, marketPrice);
    fillHint =
      toFill > 0.0005
        ? `${formatPriceCents(toFill)} ${side === "Buy" ? "above" : "below"} your limit`
        : "At your limit";
  }

  let amount: string | undefined = "—";
  if (pool && rowMarket) {
    amount =
      kind === "filled" && withdrawAmountsLoadingByOrderId.get(order.id)
        ? undefined
        : formatOrderSize(
            order,
            pool,
            rowMarket,
            kind === "filled" ? withdrawAmountsByOrderId.get(order.id) : undefined,
          );
  }

  return {
    side,
    outcome: rowMarket?.outcomes[order.outcomeIndex] ?? `Outcome ${order.outcomeIndex}`,
    limit: Number.isFinite(limitPrice) ? formatPriceCents(limitPrice) : "—",
    marketPrice: formatPriceCents(marketPrice),
    fillHint,
    amount,
    amountNote: kind === "filled" ? "to withdraw" : "locked in order",
    placedAt: order.placedAt,
  };
}

function MarketHeading({ market }: { market: Market | undefined }) {
  if (!market) {
    return <span className="font-semibold">Unknown market</span>;
  }
  const status = getMarketStatus(market);

  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <a
        href={paths.market(market)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[15px] leading-snug font-semibold break-words text-purple-primary dark:text-purple-secondary hover:underline underline-offset-4"
      >
        {market.marketName}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      {status !== MarketStatus.NOT_OPEN && (
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold bg-[oklch(var(--tier-average-bg))] text-[oklch(var(--tier-average-fg))]">
          {STATUS_TEXTS[status]()}
        </span>
      )}
    </span>
  );
}

function OrderName({ view, className }: { view: OrderView; className?: string }) {
  return (
    <span className={clsx("break-words", className)}>
      <span className="font-semibold">{view.side}</span> {view.outcome}
    </span>
  );
}

function Stacked({ main, note }: { main: ReactNode; note?: string }) {
  return (
    <>
      <span className="block">{main}</span>
      {note && <span className="block text-[13px] text-base-content/70">{note}</span>}
    </>
  );
}

function Amount({ view }: { view: OrderView }) {
  const main = view.amount ?? (
    <>
      <span className="loading loading-dots loading-xs align-middle" aria-hidden />
      <span className="sr-only">Loading amount</span>
    </>
  );
  return <Stacked main={main} note={view.amountNote} />;
}

function PlacedTime({ timestamp }: { timestamp?: number }) {
  if (!timestamp) {
    return <span className="text-base-content/70">—</span>;
  }
  const date = new Date(timestamp * 1000);
  return (
    <time dateTime={date.toISOString()} title={format(date, "MMM d, yyyy, h:mm a")}>
      {formatDistanceToNowStrict(date, { addSuffix: true })}
    </time>
  );
}

function StatusLabel({ kind }: { kind: ActiveOrderRow["kind"] }) {
  if (kind === "filled") {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-signed-up">
        <span className="w-2 h-2 rounded-full bg-current" aria-hidden />
        Filled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full border border-current opacity-60" aria-hidden />
      Open
    </span>
  );
}

function OrderAction({
  row,
  view,
  isPending,
  onWithdraw,
  onCancel,
  className,
}: {
  row: ActiveOrderRow;
  view: OrderView;
  isPending: boolean;
  onWithdraw: (order: UiUserOrder) => void;
  onCancel: (order: UiUserOrder) => void;
  className?: string;
}) {
  const spinner = <span className="loading loading-spinner loading-xs" aria-hidden />;

  if (row.kind === "filled") {
    return (
      <button
        type="button"
        className={clsx("btn btn-primary btn-sm min-h-11 px-4", className)}
        disabled={isPending}
        aria-label={isPending ? undefined : `Withdraw ${view.side} ${view.outcome} order`}
        onClick={() => onWithdraw(row.order)}
      >
        {isPending ? <>{spinner}Withdrawing…</> : "Withdraw"}
      </button>
    );
  }

  // Cancelling is the destructive action on this page, so it stays visually quieter than Withdraw.
  return (
    <button
      type="button"
      className={clsx("btn btn-ghost btn-sm min-h-11 px-4 border border-separator-100", className)}
      disabled={isPending}
      aria-label={isPending ? undefined : `Cancel ${view.side} ${view.outcome} at ${view.limit}`}
      onClick={() => onCancel(row.order)}
    >
      {isPending ? <>{spinner}Cancelling…</> : "Cancel"}
    </button>
  );
}

export function CardField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[13px] text-base-content/70">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

/**
 * Filled and open limit orders in one list, so every market's orders share the same columns. With
 * `groupByMarket` (the portfolio, where orders span several markets) each market gets one heading
 * with its status instead of a repeated Market column. Narrow containers get stacked cards.
 */
export default function OrdersTable({
  rows,
  market,
  poolById,
  withdrawAmountsByOrderId,
  withdrawAmountsLoadingByOrderId,
  pendingOrderIds,
  onWithdraw,
  onCancel,
  groupByMarket = false,
  showActions = true,
}: {
  rows: ActiveOrderRow[];
  market?: Market;
  poolById: Map<string, PoolMeta>;
  withdrawAmountsByOrderId: Map<string, LimitOrderWithdrawAmounts>;
  withdrawAmountsLoadingByOrderId: Map<string, boolean>;
  pendingOrderIds: Set<string>;
  onWithdraw: (order: UiUserOrder) => void;
  onCancel: (order: UiUserOrder) => void;
  groupByMarket?: boolean;
  showActions?: boolean;
}) {
  const groups: MarketGroup[] = groupByMarket
    ? groupRowsByMarket(rows, poolById, market)
    : [{ key: "all", market: undefined, rows }];
  const columnCount = 6 + (showActions ? 1 : 0);
  const describe = (row: ActiveOrderRow) =>
    describeRow(row, market, poolById, withdrawAmountsByOrderId, withdrawAmountsLoadingByOrderId);
  const actionProps = { onWithdraw, onCancel };

  return (
    <div className="@container">
      <div className="hidden @[760px]:block overflow-x-auto">
        <table className={clsx("simple-table tabular-nums", ORDERS_TABLE_HEADER_CLASSES)}>
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Limit</th>
              <th scope="col">Market price</th>
              <th scope="col">Amount</th>
              <th scope="col">Placed</th>
              <th scope="col">Status</th>
              {showActions && (
                <th scope="col">
                  <span className="sr-only">Action</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.key}>
                {groupByMarket && (
                  <tr>
                    <td colSpan={columnCount} className="bg-base-200/40 !pt-4 !pb-3">
                      <MarketHeading market={group.market} />
                    </td>
                  </tr>
                )}
                {group.rows.map((row) => {
                  const view = describe(row);
                  return (
                    <tr key={row.order.id}>
                      <td>
                        <OrderName view={view} />
                      </td>
                      <td>{view.limit}</td>
                      <td>
                        <Stacked main={view.marketPrice} note={view.fillHint} />
                      </td>
                      <td>
                        <Amount view={view} />
                      </td>
                      <td className="whitespace-nowrap">
                        <PlacedTime timestamp={view.placedAt} />
                      </td>
                      <td className="whitespace-nowrap">
                        <StatusLabel kind={row.kind} />
                      </td>
                      {showActions && (
                        <td className="text-right">
                          <OrderAction
                            row={row}
                            view={view}
                            isPending={pendingOrderIds.has(row.order.id)}
                            {...actionProps}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="@[760px]:hidden space-y-6">
        {groups.map((group) => (
          <section key={group.key}>
            {groupByMarket && (
              <div className="pb-1">
                <MarketHeading market={group.market} />
              </div>
            )}
            <ul className="divide-y divide-base-300 border-b border-base-300">
              {group.rows.map((row) => {
                const view = describe(row);
                return (
                  <li key={row.order.id} className="py-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <OrderName view={view} className="min-w-0" />
                      <StatusLabel kind={row.kind} />
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 tabular-nums">
                      <CardField label="Limit">{view.limit}</CardField>
                      <CardField label="Market price">
                        <Stacked main={view.marketPrice} note={view.fillHint} />
                      </CardField>
                      <CardField label="Amount">
                        <Amount view={view} />
                      </CardField>
                      <CardField label="Placed">
                        <PlacedTime timestamp={view.placedAt} />
                      </CardField>
                    </dl>
                    {showActions && (
                      <OrderAction
                        row={row}
                        view={view}
                        isPending={pendingOrderIds.has(row.order.id)}
                        className="w-full"
                        {...actionProps}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

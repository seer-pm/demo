import type { UiOrderEvent } from "@/hooks/limitOrders/useUserLimitOrderHistory";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { paths } from "@/lib/paths";
import { getOutcomePriceAtTick } from "@seer-pm/order-book/v4";
import type { Market, SupportedChain } from "@seer-pm/sdk";
import clsx from "clsx";
import { format } from "date-fns";
import { CardField } from "./OrdersTable";
import {
  ORDERS_TABLE_HEADER_CLASSES,
  type PoolMeta,
  formatOrderSize,
  formatPriceCents,
  getOrderSideLabel,
} from "./ordersShared";

const EVENT_LABELS: Record<UiOrderEvent["type"], string> = {
  PLACE: "Placed",
  FILL: "Filled",
  CANCEL: "Cancelled",
  WITHDRAW: "Withdrawn",
};

const LINK_CLASS = "text-purple-primary dark:text-purple-secondary hover:underline underline-offset-4";
const DATE_FORMAT = "MMM d, yyyy, h:mm a";

function txHref(chainId: SupportedChain, hash: string): string | undefined {
  const explorerUrl = SUPPORTED_CHAINS[chainId]?.blockExplorers?.default?.url;
  return explorerUrl ? `${explorerUrl}/tx/${hash}` : undefined;
}

/** What one event shows, derived once so the table and the narrow list stay identical. */
type EventView = {
  id: string;
  date: Date;
  type: UiOrderEvent["type"];
  market: Market | undefined;
  outcome: string;
  side: "Buy" | "Sell";
  limit: string;
  size: string;
  href?: string;
};

function describeEvent(
  e: UiOrderEvent,
  chainId: SupportedChain,
  poolById: Map<string, PoolMeta>,
  market: Market | undefined,
): EventView {
  const pool = poolById.get(e.poolId);
  const rowMarket = pool?.market ?? market;
  const limitPrice = getOutcomePriceAtTick(e.tickLower, e.outcomeIsToken0);
  const size =
    pool && rowMarket
      ? formatOrderSize(
          {
            id: e.id,
            orderId: e.orderId,
            owner: "0x",
            poolId: e.poolId,
            outcomeIndex: e.outcomeIndex,
            outcomeIsToken0: e.outcomeIsToken0,
            tickLower: e.tickLower,
            zeroForOne: e.zeroForOne,
            status: e.type,
            liquidity: e.liquidity,
            placedAtBlock: "0",
            updatedAtBlock: "0",
          },
          pool,
          rowMarket,
        )
      : "—";

  return {
    id: e.id,
    date: new Date(e.timestamp * 1000),
    type: e.type,
    market: rowMarket,
    outcome: rowMarket?.outcomes[e.outcomeIndex] ?? `Outcome ${e.outcomeIndex}`,
    side: getOrderSideLabel(e.zeroForOne, e.outcomeIsToken0),
    limit: Number.isFinite(limitPrice) ? formatPriceCents(limitPrice) : "—",
    size,
    href: txHref(chainId, e.transactionHash),
  };
}

/** A fill changes what the user can withdraw, so it carries the Active view's "Filled" treatment. */
function EventLabel({ type }: { type: UiOrderEvent["type"] }) {
  return <span className={clsx(type === "FILL" && "font-semibold text-signed-up")}>{EVENT_LABELS[type]}</span>;
}

function MarketLink({ market, className }: { market: Market; className?: string }) {
  return (
    <a
      href={paths.market(market)}
      target="_blank"
      rel="noopener noreferrer"
      title={market.marketName}
      className={clsx("font-semibold", LINK_CLASS, className)}
    >
      {market.marketName}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function TxLink({ href }: { href?: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx("inline-flex min-h-11 items-center whitespace-nowrap", LINK_CLASS)}
    >
      View tx
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/**
 * The account's limit-order events, newest first. Wide containers get a table; narrow ones get
 * stacked entries so a phone never scrolls sideways through the columns.
 */
export default function OrderHistoryTable({
  events,
  chainId,
  market,
  poolById,
  showMarketColumn = false,
}: {
  events: UiOrderEvent[];
  chainId: SupportedChain;
  market?: Market;
  poolById: Map<string, PoolMeta>;
  showMarketColumn?: boolean;
}) {
  const views = events.map((e) => describeEvent(e, chainId, poolById, market));

  return (
    <div className="@container">
      <div className={clsx("hidden overflow-x-auto", showMarketColumn ? "@[900px]:block" : "@[640px]:block")}>
        <table className={clsx("simple-table tabular-nums", ORDERS_TABLE_HEADER_CLASSES)}>
          <thead>
            <tr>
              <th scope="col">Date</th>
              {showMarketColumn && <th scope="col">Market</th>}
              <th scope="col">Outcome</th>
              <th scope="col">Side</th>
              <th scope="col">Event</th>
              <th scope="col">Limit</th>
              <th scope="col">Order size</th>
              <th scope="col">
                <span className="sr-only">Transaction</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {views.map((view) => (
              <tr key={view.id}>
                <td className="whitespace-nowrap">{format(view.date, DATE_FORMAT)}</td>
                {showMarketColumn && (
                  <td className="max-w-[320px]">
                    {view.market ? <MarketLink market={view.market} className="block truncate" /> : "—"}
                  </td>
                )}
                <td>{view.outcome}</td>
                <td>{view.side}</td>
                <td>
                  <EventLabel type={view.type} />
                </td>
                <td>{view.limit}</td>
                <td>{view.size}</td>
                <td className="text-right">
                  <TxLink href={view.href} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul
        className={clsx(
          "divide-y divide-base-300 border-b border-base-300",
          showMarketColumn ? "@[900px]:hidden" : "@[640px]:hidden",
        )}
      >
        {views.map((view) => (
          <li key={view.id} className="py-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0 break-words">
                <EventLabel type={view.type} />
                <span aria-hidden> · </span>
                <span className="font-semibold">{view.side}</span> {view.outcome}
              </span>
              <time
                dateTime={view.date.toISOString()}
                className="shrink-0 text-right text-[13px] text-base-content/70 tabular-nums"
              >
                {format(view.date, DATE_FORMAT)}
              </time>
            </div>
            {showMarketColumn && view.market && (
              <MarketLink market={view.market} className="block text-[14px] break-words" />
            )}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 tabular-nums">
              <CardField label="Limit">{view.limit}</CardField>
              <CardField label="Order size">{view.size}</CardField>
            </dl>
            <TxLink href={view.href} />
          </li>
        ))}
      </ul>
    </div>
  );
}

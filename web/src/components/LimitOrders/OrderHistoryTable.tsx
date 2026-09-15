import type { UiOrderEvent } from "@/hooks/limitOrders/useUserLimitOrderHistory";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { paths } from "@/lib/paths";
import { getOutcomePriceAtTick } from "@seer-pm/order-book/v4";
import type { Market, SupportedChain } from "@seer-pm/sdk";
import clsx from "clsx";
import { format } from "date-fns";
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

function txHref(chainId: SupportedChain, hash: string): string | undefined {
  const explorerUrl = SUPPORTED_CHAINS[chainId]?.blockExplorers?.default?.url;
  return explorerUrl ? `${explorerUrl}/tx/${hash}` : undefined;
}

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
  return (
    <div className="overflow-x-auto">
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
          {events.map((e) => {
            const pool = poolById.get(e.poolId);
            const rowMarket = pool?.market ?? market;
            const limitPrice = getOutcomePriceAtTick(e.tickLower, e.outcomeIsToken0);
            const outcomeLabel = rowMarket
              ? (rowMarket.outcomes[e.outcomeIndex] ?? `Outcome ${e.outcomeIndex}`)
              : `Outcome ${e.outcomeIndex}`;
            const sizeLabel =
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
            const href = txHref(chainId, e.transactionHash);

            return (
              <tr key={e.id}>
                <td className="whitespace-nowrap">{format(e.timestamp * 1000, "MMM d, yyyy, h:mm a")}</td>
                {showMarketColumn && (
                  <td className="max-w-[320px]">
                    {rowMarket ? (
                      <a
                        href={paths.market(rowMarket)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={rowMarket.marketName}
                        className={clsx("block truncate font-semibold", LINK_CLASS)}
                      >
                        {rowMarket.marketName}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                )}
                <td>{outcomeLabel}</td>
                <td>{getOrderSideLabel(e.zeroForOne, e.outcomeIsToken0)}</td>
                <td>{EVENT_LABELS[e.type]}</td>
                <td>{Number.isFinite(limitPrice) ? formatPriceCents(limitPrice) : "—"}</td>
                <td>{sizeLabel}</td>
                <td className="text-right">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={clsx("inline-flex min-h-11 items-center whitespace-nowrap", LINK_CLASS)}
                    >
                      View tx
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

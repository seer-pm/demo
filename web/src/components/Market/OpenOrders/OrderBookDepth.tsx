import { Alert } from "@/components/Alert";
import { type PoolMeta, getOrderPayAmount } from "@/components/LimitOrders/ordersShared";
import {
  type OrderBookLevel,
  type OutcomeOrderBook,
  useMarketOrderLevels,
} from "@/hooks/limitOrders/useMarketOrderLevels";
import { displayBalance } from "@/lib/utils";
import type { Market } from "@seer-pm/sdk";
import clsx from "clsx";

function LevelsTable({
  title,
  levels,
  pool,
  market,
  tone,
}: {
  title: string;
  levels: OrderBookLevel[];
  pool: PoolMeta;
  market: Market;
  tone: "buy" | "sell";
}) {
  return (
    <div className="min-w-0">
      <div
        className={clsx(
          "text-[14px] font-semibold mb-2",
          tone === "buy" ? "text-success-primary" : "text-error-primary",
        )}
      >
        {title}
      </div>
      {levels.length === 0 ? (
        <div className="text-[13px] opacity-70">None</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="simple-table w-full">
            <thead>
              <tr>
                <th>Price</th>
                <th>Size</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((level) => {
                const pay = getOrderPayAmount(level.liquidity, level.tickLower, level.zeroForOne, pool, market);
                return (
                  <tr key={level.id}>
                    <td>{Number.isFinite(level.price) ? level.price.toFixed(4) : "-"}</td>
                    <td>{pay ? `${displayBalance(pay.amount, pay.decimals)} ${pay.symbol}` : "-"}</td>
                    <td>{level.orders}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OutcomeBook({ book, market }: { book: OutcomeOrderBook; market: Market }) {
  const outcomeLabel = market.outcomes[book.outcomeIndex] ?? `Outcome ${book.outcomeIndex}`;
  return (
    <section className="space-y-2">
      <div className="text-[15px] font-semibold">{outcomeLabel}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LevelsTable title="Bids" levels={book.bids} pool={book.pool} market={market} tone="buy" />
        <LevelsTable title="Asks" levels={book.asks} pool={book.pool} market={market} tone="sell" />
      </div>
    </section>
  );
}

/** Resting limit orders per outcome: bids (buys of the outcome) and asks (sells), best price first. */
export default function OrderBookDepth({ market }: { market: Market }) {
  const { data: books, isLoading, error } = useMarketOrderLevels(market);

  if (isLoading) {
    return <div className="shimmer-container w-full h-[120px]" />;
  }

  if (error) {
    return <Alert type="error">Failed to load the order book: {(error as Error).message}</Alert>;
  }

  if (!books || books.length === 0) {
    return <div className="text-[14px] opacity-70">No resting limit orders.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {books.map((book) => (
        <OutcomeBook key={book.outcomeIndex} book={book} market={market} />
      ))}
    </div>
  );
}

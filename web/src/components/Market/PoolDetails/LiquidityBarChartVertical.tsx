import { Spinner } from "@/components/Spinner";
import { useOutcomeOrderLevels } from "@/hooks/limitOrders/useMarketOrderLevels";
import { getLiquidityChartData } from "@/hooks/liquidity/getLiquidityChartData";
import { useTicksData } from "@/hooks/liquidity/useTicksData";
import { isTwoStringsEqual } from "@/lib/utils";
import { PoolInfo } from "@seer-pm/react";
import { Market } from "@seer-pm/sdk";
import { tickToPrice } from "@seer-pm/sdk/tick-math";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import { LiquidityEmptyState, LiquidityErrorState } from "./LiquidityStates";
import { formatLadderPrice, formatShareAmount } from "./format";

/**
 * Side colors come from theme tokens so the ladder reads in both themes: depth bars are low-alpha
 * tints of the Seer error/success accents, and text uses the AA signed-down/up pair, which stays
 * above 4.5:1 on those tints in light and dark. Limit orders are a solid strip along the bottom of
 * the bar rather than a darker fill, so they never sit under the price text.
 */
const SIDE_STYLES = {
  sell: { label: "Sell", fill: "bg-error-primary/10", strip: "bg-signed-down", text: "text-signed-down" },
  buy: { label: "Buy", fill: "bg-success-primary/10", strip: "bg-signed-up", text: "text-signed-up" },
} as const;

const HEADER_CELL = "border-b border-base-300 py-2 font-medium";
const NUMBER_CELL = "pr-3 text-right align-middle";

type LadderRow = {
  id: string;
  side: "sell" | "buy" | "mid";
  price: string;
  shares: number;
  orderShares: number;
  orders: number;
  total: number | null;
  pct: number;
};

function LadderLegend({ hasOrders }: { hasOrders: boolean }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/70">
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2.5 rounded-[1px] bg-signed-down" />
        Sell side
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2.5 rounded-[1px] bg-signed-up" />
        Buy side
      </span>
      {hasOrders && (
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-[3px] w-3 bg-base-content/70" />
          Resting limit orders
        </span>
      )}
    </div>
  );
}

export default function LiquidityBarChartVertical({
  market,
  outcomeTokenIndex,
  poolInfo,
  onAddLiquidity,
}: {
  market: Market;
  outcomeTokenIndex: number;
  poolInfo: PoolInfo;
  onAddLiquidity?: () => void;
}) {
  const outcome = market.wrappedTokens[outcomeTokenIndex];
  const { tick, id, token0 } = poolInfo;
  const [price0, price1] = tickToPrice(tick);
  const isShowToken0Price = !!isTwoStringsEqual(token0, outcome);
  const currentOutcomePrice = isShowToken0Price ? price0 : price1;
  const { data: ticksByPool, isLoading, isError, refetch, isRefetching } = useTicksData(market, outcomeTokenIndex);
  const scrollRef = useRef<HTMLElement>(null);
  const poolPriceRowRef = useRef<HTMLTableRowElement>(null);
  const centeredPoolRef = useRef<string | null>(null);
  const orderLevels = useOutcomeOrderLevels(market, outcomeTokenIndex, poolInfo);
  const hasLiquidity = !!ticksByPool?.[id]?.ticks?.filter((tick) => Number(tick.liquidityNet) > 0)?.length;

  const {
    priceList,
    sellBarsData,
    buyBarsData,
    sellOrderBarsData,
    buyOrderBarsData,
    orderCounts,
    sellLineData,
    buyLineData,
  } = getLiquidityChartData(
    poolInfo,
    hasLiquidity ? ticksByPool?.[id]?.ticks : [],
    isShowToken0Price,
    Number.POSITIVE_INFINITY,
    outcome,
    orderLevels,
  );

  const rows = (() => {
    // A row is the full amount of the range: liquidity positions plus resting limit orders.
    const toRows = (
      side: "sell" | "buy",
      barsData: (number | undefined)[][],
      orderBarsData: (number | undefined)[][],
      lineData: [number, number | null][],
    ): LadderRow[] => {
      const maxTotal = Math.max(...(lineData.map((x) => x[1]).filter((x) => x) as number[]));
      return barsData
        .map((data, index) => {
          const orderShares = orderBarsData[index]?.[1] ?? 0;
          return { x: data[0] ?? 0, shares: (data[1] ?? 0) + orderShares, orderShares, index };
        })
        .filter((x) => x.shares > 0)
        .reverse()
        .map(({ x, shares, orderShares, index }) => {
          const currentPriceIndex = x - 0.5;
          const currentLineIndex = x * 2;
          const total = lineData[currentLineIndex][1];
          return {
            id: `${side}-${index}`,
            side,
            price: priceList[currentPriceIndex],
            shares,
            orderShares,
            orders: orderCounts[currentPriceIndex] ?? 0,
            total,
            pct: total ? total / maxTotal : 0,
          };
        });
    };
    return toRows("sell", sellBarsData, sellOrderBarsData, sellLineData)
      .concat([
        {
          id: "current",
          side: "mid",
          price: currentOutcomePrice,
          shares: 0,
          orderShares: 0,
          orders: 0,
          total: 0,
          pct: 0,
        },
      ])
      .concat(toRows("buy", buyBarsData, buyOrderBarsData, buyLineData));
  })();

  // Center the pool price once per pool. The chart data is rebuilt on every render, so keying the
  // effect on it snapped the ladder back to the middle while the user was reading other levels.
  useEffect(() => {
    const container = scrollRef.current;
    const poolPriceRow = poolPriceRowRef.current;
    if (!hasLiquidity || !container || !poolPriceRow || centeredPoolRef.current === id) return;
    container.scrollTop = poolPriceRow.offsetTop - (container.clientHeight - poolPriceRow.offsetHeight) / 2;
    centeredPoolRef.current = id;
  }, [id, hasLiquidity]);

  if (isError) {
    return <LiquidityErrorState onRetry={() => refetch()} isRetrying={isRefetching} />;
  }

  if (!hasLiquidity) {
    return (
      <div className="mt-2">{isLoading ? <Spinner /> : <LiquidityEmptyState onAddLiquidity={onAddLiquidity} />}</div>
    );
  }

  return (
    <div>
      <LadderLegend hasOrders={rows.some((r) => r.orderShares > 0)} />
      {/* The ladder scrolls on its own, so it takes focus to let keyboard users scroll it. */}
      <section
        ref={scrollRef}
        tabIndex={0}
        aria-label="Order book"
        className="relative h-[min(420px,65svh)] overflow-y-auto focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-purple-primary"
      >
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm text-base-content tabular-nums">
          <thead className="sticky top-0 z-10 bg-base-100 text-[13px] text-base-content/70">
            <tr>
              <th scope="col" className={clsx(HEADER_CELL, "w-1/2 pl-2 text-left")}>
                Price
              </th>
              <th scope="col" className={clsx(HEADER_CELL, NUMBER_CELL)}>
                Shares
              </th>
              <th scope="col" className={clsx(HEADER_CELL, NUMBER_CELL)}>
                Cumulative
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              if (r.side === "mid") {
                return (
                  <tr key={r.id} ref={poolPriceRowRef} className="bg-base-200">
                    <td className="h-10 whitespace-nowrap border-y border-base-300 pl-2">
                      <span className="text-base-content/70">Pool price </span>
                      <span className="font-semibold">{formatLadderPrice(r.price)}</span>
                    </td>
                    <td className="border-y border-base-300" />
                    <td className="border-y border-base-300" />
                  </tr>
                );
              }

              const style = SIDE_STYLES[r.side];
              return (
                <tr key={r.id} className="[@media(hover:hover)]:hover:bg-base-content/5">
                  <td className="relative h-10 p-0">
                    <div
                      aria-hidden="true"
                      style={{ width: `${Math.min(100, r.pct * 100)}%` }}
                      className={clsx("absolute inset-y-0 left-0", style.fill)}
                    >
                      {r.orderShares > 0 && r.total ? (
                        <div
                          style={{ width: `${Math.min(100, (r.orderShares / r.total) * 100)}%` }}
                          className={clsx("absolute bottom-0 left-0 h-[3px]", style.strip)}
                        />
                      ) : null}
                    </div>
                    <div className="relative flex flex-col justify-center py-1.5 pl-2">
                      <span className={clsx("whitespace-nowrap", style.text)}>
                        <span className="sr-only">{style.label} </span>
                        {formatLadderPrice(r.price)}
                      </span>
                      {r.orderShares > 0 && (
                        <span className={clsx("text-xs", style.text)}>
                          {formatShareAmount(r.orderShares)} in {r.orders} {r.orders === 1 ? "order" : "orders"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={NUMBER_CELL}>{formatShareAmount(r.shares)}</td>
                  <td className={NUMBER_CELL}>{formatShareAmount(r.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

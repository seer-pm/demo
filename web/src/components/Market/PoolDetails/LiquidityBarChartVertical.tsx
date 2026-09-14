import { Alert } from "@/components/Alert";
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

export default function LiquidityBarChartVertical({
  market,
  outcomeTokenIndex,
  poolInfo,
}: {
  market: Market;
  outcomeTokenIndex: number;
  poolInfo: PoolInfo;
}) {
  const outcome = market.wrappedTokens[outcomeTokenIndex];
  const { tick, id, token0 } = poolInfo;
  const [price0, price1] = tickToPrice(tick);
  const isShowToken0Price = !!isTwoStringsEqual(token0, outcome);
  const currentOutcomePrice = isShowToken0Price ? price0 : price1;
  const { data: ticksByPool, isLoading, isError } = useTicksData(market, outcomeTokenIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const orderLevels = useOutcomeOrderLevels(market, outcomeTokenIndex, poolInfo);

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
    ticksByPool?.[id]?.ticks?.filter((tick) => Number(tick.liquidityNet) > 0)?.length ? ticksByPool?.[id]?.ticks : [],
    isShowToken0Price,
    Number.POSITIVE_INFINITY,
    outcome,
    orderLevels,
  );

  const rows = (() => {
    // A row is the full amount of the range: liquidity positions plus resting limit orders.
    type Row = {
      id: string;
      side: "sell" | "buy" | "mid";
      price: string;
      shares: number;
      orderShares: number;
      orders: number;
      total: number | null;
      pct: number;
    };
    const toRows = (
      side: "sell" | "buy",
      barsData: (number | undefined)[][],
      orderBarsData: (number | undefined)[][],
      lineData: [number, number | null][],
    ): Row[] => {
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

  useEffect(() => {
    const index = sellBarsData.filter((x, i) => (x[1] ?? 0) + (sellOrderBarsData[i]?.[1] ?? 0) > 0).length - 4;
    const rowHeight = 40;

    if (containerRef.current) {
      containerRef.current.scrollTop = rowHeight * index;
    }
  }, [containerRef.current, sellBarsData, sellOrderBarsData]);

  if (isError) {
    return (
      <Alert type="error" className="mb-5">
        Error loading liquidity data.
      </Alert>
    );
  }

  if (!ticksByPool?.[id]?.ticks?.filter((tick) => Number(tick.liquidityNet) > 0)?.length) {
    return (
      <div>
        <div className="mt-2">{isLoading ? <Spinner></Spinner> : <Alert type="warning">No Liquidity Data.</Alert>}</div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden">
      <div className="py-3 border-t border-b border-black-secondary grid grid-cols-12 gap-0 bg-gray-50 text-xs font-medium text-base-content pr-4">
        <div className="col-span-6"></div>
        <div className="col-span-3 text-center text-black-secondary font-semibold">SHARES</div>
        <div className="col-span-3 text-center text-black-secondary font-semibold">TOTAL</div>
      </div>

      <div ref={containerRef} className="overflow-y-auto h-[380px]">
        {rows.map((r) => (
          <div
            key={r.id}
            className={clsx(
              "group cursor-pointer relative grid grid-cols-12 items-center text-sm",
              r.side === "sell" ? "hover:bg-[#fcebeb]" : r.side === "buy" ? "hover:bg-[#eaf5ee]" : "hover:bg-[#f4f5f6]",
              r.side === "mid" ? "border-t border-b border-black-secondary" : "",
            )}
          >
            <div className="col-span-6">
              <div className="relative h-10 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, r.pct * 100)}%` }}
                  className={`absolute flex items-center pl-2 inset-y-0 left-0 ${
                    r.side === "sell"
                      ? "group-hover:bg-[#f9d1d1] bg-[#fcebeb]"
                      : r.side === "buy"
                        ? "group-hover:bg-[#cee9d8] bg-[#eaf5ee]"
                        : ""
                  }`}
                >
                  {r.orderShares > 0 && r.total ? (
                    // Darker segment: the share of the cumulative total that is resting limit orders.
                    <div
                      style={{ width: `${Math.min(100, (r.orderShares / r.total) * 100)}%` }}
                      className={clsx("absolute inset-y-0 left-0", r.side === "sell" ? "bg-[#f5a3a3]" : "bg-[#5fcf7a]")}
                      title={`${Number(r.orderShares).toFixed(2)} in limit orders`}
                    />
                  ) : null}
                  <p
                    className={clsx(
                      r.side === "sell" ? "text-[#e23939]" : r.side === "buy" ? "text-[#30a159]" : "text-[#77808d]",
                      "whitespace-nowrap relative",
                    )}
                  >
                    {r.side === "mid" && "Last: "}
                    {r.price}
                  </p>
                </div>
              </div>
            </div>

            {/* Shares column */}
            <div className="col-span-3  text-center text-gray-700">
              {r.side === "mid" ? "" : Number(r.shares).toFixed(2)}
              {r.orderShares > 0 && (
                <p className={clsx("text-xs", r.side === "sell" ? "text-[#e23939]" : "text-[#30a159]")}>
                  {Number(r.orderShares).toFixed(2)} in {r.orders} {r.orders === 1 ? "order" : "orders"}
                </p>
              )}
            </div>

            {/* Total column */}
            <div className="col-span-3  text-center text-gray-700">
              {r.side === "mid" ? "" : Number(r.total).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

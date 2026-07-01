import { Alert } from "@/components/Alert";
import { Spinner } from "@/components/Spinner";
import { getLiquidityChartData } from "@/hooks/liquidity/getLiquidityChartData";
import { useTicksData } from "@/hooks/liquidity/useTicksData";
import { isTwoStringsEqual } from "@/lib/utils";
import { PoolInfo } from "@seer-pm/react";
import { Market } from "@seer-pm/sdk";
import { tickToPrice } from "@seer-pm/sdk";
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

  const { priceList, sellBarsData, buyBarsData, sellLineData, buyLineData } = getLiquidityChartData(
    poolInfo,
    ticksByPool?.[id]?.ticks?.filter((tick) => Number(tick.liquidityNet) > 0)?.length ? ticksByPool?.[id]?.ticks : [],
    isShowToken0Price,
    Number.POSITIVE_INFINITY,
    outcome,
  );

  const rows = (() => {
    const sellBars = sellBarsData
      .filter((x) => x[1] > 0)
      .reverse()
      .map((data, index) => {
        const currentPriceIndex = data[0] - 0.5;
        const currentLineIndex = data[0] * 2;
        return {
          id: `sell-${index}`,
          side: "sell",
          price: priceList[currentPriceIndex],
          shares: data[1],
          total: sellLineData[currentLineIndex][1],
          pct: sellLineData[currentLineIndex][1]
            ? sellLineData[currentLineIndex][1] /
              Math.max(...(sellLineData.map((x) => x[1]).filter((x) => x) as number[]))
            : 0,
        };
      });
    const buyBars = buyBarsData
      .filter((x) => x[1] > 0)
      .reverse()
      .map((data, index) => {
        const currentPriceIndex = data[0] - 0.5;
        const currentLineIndex = data[0] * 2;
        return {
          id: `buy-${index}`,
          side: "buy",
          price: priceList[currentPriceIndex],
          shares: data[1],
          total: buyLineData[currentLineIndex][1],
          pct: buyLineData[currentLineIndex][1]
            ? buyLineData[currentLineIndex][1] /
              Math.max(...(buyLineData.map((x) => x[1]).filter((x) => x) as number[]))
            : 0,
        };
      });
    return sellBars
      .concat([
        {
          id: "current",
          side: "mid",
          price: currentOutcomePrice,
          shares: 0,
          total: 0,
          pct: 0,
        },
      ])
      .concat(buyBars);
  })();

  useEffect(() => {
    const index = sellBarsData.filter((x) => x[1] > 0).length - 4;
    const rowHeight = 40;

    if (containerRef.current) {
      containerRef.current.scrollTop = rowHeight * index;
    }
  }, [containerRef.current, sellBarsData]);

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
      <div className="py-3 border-t border-b border-black-secondary grid grid-cols-12 gap-0 bg-gray-50 dark:bg-[var(--bg-2)] text-xs font-medium text-base-content">
        <div className="col-span-6"></div>
        <div className="col-span-3 text-center text-black-secondary font-semibold">SHARES</div>
        <div className="col-span-3 text-center text-black-secondary font-semibold">TOTAL</div>
      </div>

      <div ref={containerRef} className="overflow-y-auto scrollbar-hide h-[380px]">
        {rows.map((r) => (
          <div
            key={r.id}
            className={clsx(
              "group cursor-pointer relative grid grid-cols-12 items-center text-sm",
              r.side === "sell"
                ? "hover:bg-[#fcebeb] dark:hover:bg-[rgba(226,57,57,0.18)]"
                : r.side === "buy"
                  ? "hover:bg-[#eaf5ee] dark:hover:bg-[rgba(48,161,89,0.18)]"
                  : "hover:bg-[#f4f5f6] dark:hover:bg-[rgba(255,255,255,0.06)]",
              r.side === "mid" ? "border-t border-b border-black-secondary" : "",
            )}
          >
            <div className="col-span-6">
              <div className="relative h-10 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, r.pct * 100)}%` }}
                  className={`absolute flex items-center pl-2 inset-y-0 left-0 ${
                    r.side === "sell"
                      ? "bg-[#fcebeb] group-hover:bg-[#f9d1d1] dark:bg-[rgba(226,57,57,0.15)] dark:group-hover:bg-[rgba(226,57,57,0.28)]"
                      : r.side === "buy"
                        ? "bg-[#eaf5ee] group-hover:bg-[#cee9d8] dark:bg-[rgba(48,161,89,0.15)] dark:group-hover:bg-[rgba(48,161,89,0.28)]"
                        : ""
                  }`}
                >
                  <p
                    className={clsx(
                      r.side === "sell"
                        ? "text-[#e23939]"
                        : r.side === "buy"
                          ? "text-[#30a159]"
                          : "text-black dark:text-white font-semibold",
                      "whitespace-nowrap",
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

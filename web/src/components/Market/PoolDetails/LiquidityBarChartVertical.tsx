import { Alert } from "@/components/Alert";
import { Spinner } from "@/components/Spinner";
import { getLiquidityChartData } from "@/hooks/liquidity/getLiquidityChartData";
import { useTicksData } from "@/hooks/liquidity/useTicksData";
import { tickToPrice } from "@/hooks/liquidity/utils";
import { PoolInfo } from "@/hooks/useMarketPools";
import { Market } from "@/lib/market";
import clsx from "clsx";
import { useEffect, useRef } from "react";

export default function LiquidityBarChartVertical({
  market,
  outcomeTokenIndex,
  poolInfo,
  isShowToken0Price,
}: {
  market: Market;
  outcomeTokenIndex: number;
  poolInfo: PoolInfo;
  isShowToken0Price: boolean;
}) {
  const outcome = market.wrappedTokens[outcomeTokenIndex];
  const { tick, id } = poolInfo;
  const [price0, price1] = tickToPrice(tick);
  const currentOutcomePrice = isShowToken0Price ? price0 : price1;
  const { data: ticksByPool, isLoading } = useTicksData(market, outcomeTokenIndex);
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

  if (!ticksByPool?.[id]?.ticks?.filter((tick) => Number(tick.liquidityNet) > 0)?.length) {
    return (
      <div>
        <p className="font-semibold text-[14px] flex items-center gap-2">Liquidity Distribution</p>
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
                  <p
                    className={clsx(
                      r.side === "sell" ? "text-[#e23939]" : r.side === "buy" ? "text-[#30a159]" : "text-[#77808d]",
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

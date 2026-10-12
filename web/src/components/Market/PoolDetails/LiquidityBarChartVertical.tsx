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
import { cumulativeCostRows } from "./cumulativeCostRows";

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

  const { priceList, sellBarsData, buyBarsData } = getLiquidityChartData(
    poolInfo,
    ticksByPool?.[id]?.ticks?.filter((tick) => Number(tick.liquidityNet) > 0)?.length ? ticksByPool?.[id]?.ticks : [],
    isShowToken0Price,
    Number.POSITIVE_INFINITY,
    outcome,
  );

  const rows = (() => {
    const levels = (bars: number[][]) =>
      bars.map(([index, shares]) => ({
        price: Number(priceList[index - 0.5]),
        shares,
      }));
    const sellBars = cumulativeCostRows(levels(sellBarsData), "sell");
    const buyBars = cumulativeCostRows(levels(buyBarsData), "buy");
    return [
      ...sellBars,
      {
        id: "current",
        side: "mid",
        price: Number(currentOutcomePrice),
        shares: 0,
        total: 0,
        pct: 0,
      },
      ...buyBars,
    ];
  })();

  useEffect(() => {
    const index = sellBarsData.filter((x) => x[1] > 0).length - 4;
    const rowHeight = 40;

    if (containerRef.current) {
      containerRef.current.scrollTop = rowHeight * index;
    }
  }, [id, tick, ticksByPool]);

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
      <p className="text-xs text-base-content/60 py-2">Cumulative cost · Estimated pool depth, excluding fees</p>
      <div className="py-3 border-t border-b border-black-secondary grid grid-cols-12 gap-0 bg-gray-50 text-xs font-medium text-base-content pr-4">
        <div className="col-span-6 pl-2">PRICE</div>
        <div className="col-span-3 text-center text-black-secondary font-semibold">SHARES</div>
        <div
          className="col-span-3 text-center text-black-secondary font-semibold"
          title="Running sum of price × shares from the best price. Pool-depth estimate, excluding fees."
        >
          TOTAL ({isShowToken0Price ? poolInfo.token1Symbol : poolInfo.token0Symbol})
        </div>
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
                    {Number(r.price).toFixed(4)}
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

import { Alert } from "@/components/Alert";
import { Slider } from "@/components/Slider";
import { Spinner } from "@/components/Spinner";
import { getLiquidityChartData, tickToPrice } from "@/hooks/liquidity/getLiquidityChartData";
import { useTicksData } from "@/hooks/liquidity/useTicksData";
import { Market } from "@/hooks/useMarket";
import { PoolInfo } from "@/hooks/useMarketPools";
import { SwapIcon } from "@/lib/icons";
import { formatBigNumbers, isTwoStringsEqual } from "@/lib/utils";
import ReactECharts from "echarts-for-react";
import { useState } from "react";

export default function LiquidityBarChart({
  market,
  outcomeTokenIndex,
  poolInfo,
}: {
  market: Market;
  outcomeTokenIndex: number;
  poolInfo: PoolInfo;
}) {
  const outcome = market.wrappedTokens[outcomeTokenIndex];
  const { token0Symbol, token1Symbol, token0, tick, id } = poolInfo;
  const [isShowToken0Price, setShowToken0Price] = useState(!!isTwoStringsEqual(token0, outcome));
  const [price0, price1] = tickToPrice(tick);
  const currentOutcomePrice = isShowToken0Price ? price0 : price1;
  const { data: ticksByPool, isLoading } = useTicksData(market, outcomeTokenIndex);
  const [zoomCount, setZoomCount] = useState(4); // default zoom to 4 item each side of the current price
  if (!ticksByPool?.[id]?.filter((tick) => Number(tick.liquidityNet) > 0)?.length) {
    return (
      <div>
        <p className="font-semibold flex items-center gap-2">Liquidity Distribution</p>
        <div className="mt-2">{isLoading ? <Spinner></Spinner> : <Alert type="warning">No Liquidity Data.</Alert>}</div>
      </div>
    );
  }
  const { priceList, sellBarsData, buyBarsData, sellLineData, buyLineData, maxYValue, maxZoomCount } =
    getLiquidityChartData(poolInfo, ticksByPool?.[id], isShowToken0Price, zoomCount);
  const currentOutcomePriceIndex = priceList.findIndex((price) => price === currentOutcomePrice);
  const maxLabelCount = 10; //max label x axis
  const chartOption = priceList
    ? {
        xAxis: [
          {
            type: "value",
            max: priceList.length - 1,
            interval: Math.ceil((zoomCount * 2) / (maxLabelCount - 1)),
            axisLabel: {
              rotate: 35,
              formatter(value: number) {
                if (value === currentOutcomePriceIndex) {
                  return `{bold|${priceList[value]}}`;
                }
                return priceList[value];
              },
              rich: {
                bold: {
                  fontWeight: "bold",
                  color: "#9747ff",
                },
              },
            },
            name: `${isShowToken0Price ? token0Symbol : token1Symbol} Price`,
            nameLocation: "middle",
            nameGap: 45,
            splitLine: {
              show: false,
            },
          },
        ],

        tooltip: {
          trigger: "axis",
          // biome-ignore lint/suspicious/noExplicitAny:
          formatter: (params: any[]) => {
            let tooltipContent = "";
            const currentPriceIndex = params[0].data[0] - 0.5;
            const currentLineIndex = params[0].data[0] * 2;
            for (const param of params) {
              if (!param?.data[1]) {
                continue;
              }
              const yValue = Number(param.data[1].toFixed(2)).toLocaleString();
              tooltipContent += `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${param.color};margin-right:5px;"></span>`;
              tooltipContent += `${param.seriesName}: ${yValue}<br>`;
            }
            if (params[0] && sellLineData[currentLineIndex][1]) {
              tooltipContent += `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${params[0].color};margin-right:5px;"></span>`;
              tooltipContent += `Total Volume: ${Number(
                sellLineData[currentLineIndex][1]!.toFixed(2),
              ).toLocaleString()}<br>`;
              //current price
              tooltipContent += `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${params[0].color};margin-right:5px;"></span>`;
              tooltipContent += `Price: ${priceList[currentPriceIndex]}<br>`;
            }
            if (params[1] && buyLineData[currentLineIndex][1]) {
              tooltipContent += `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${params[1].color};margin-right:5px;"></span>`;
              tooltipContent += `Total Volume: ${Number(
                buyLineData[currentLineIndex][1]!.toFixed(2),
              ).toLocaleString()}<br>`;

              tooltipContent += `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${params[1].color};margin-right:5px;"></span>`;
              tooltipContent += `Price: ${priceList[currentPriceIndex]}<br>`;
            }
            // Return the formatted tooltip content with the colored dot
            return tooltipContent;
          },
        },
        yAxis: [
          {
            type: "value",
            scale: true,
            axisLabel: {
              formatter(value: number) {
                return formatBigNumbers(value);
              },
            },
            splitLine: {
              show: false,
            },
          },
        ],
        grid: {
          left: 60,
          right: 60,
          top: "15%",
          bottom: "15%",
        },
        series: [
          {
            name: "Volume",
            type: "bar",
            stack: "total",
            barWidth: "100%",
            data: sellBarsData,
            itemStyle: {
              color: "#FFCCCB",
            },
          },
          {
            name: "Volume",
            type: "bar",
            stack: "total",
            barWidth: "100%",
            data: buyBarsData,
            itemStyle: {
              color: "#90EE90",
            },
          },
          {
            name: "Total Volume",
            type: "line",
            data: sellLineData,
            itemStyle: {
              color: "#dc3545",
            },
            areaStyle: {
              color: "#FFCCCB50",
            },
            symbol: "none",
            smooth: true,
            tooltip: { show: false },
          },
          {
            name: "Total Volume",
            type: "line",
            data: buyLineData,
            itemStyle: {
              color: "#28a745",
            },
            areaStyle: {
              color: "#90EE9050",
            },
            symbol: "none",
            smooth: true,
            tooltip: { show: false },
          },
          {
            name: "Mark Line",
            type: "line",
            data: [
              [currentOutcomePriceIndex, 1],
              [currentOutcomePriceIndex, maxYValue * 1.2], //make it higher than the rest of the data
            ],
            lineStyle: {
              color: "#9747ff",
              type: "dotted",
              width: 2,
            },
            smooth: true,
            silent: true,
            tooltip: { show: false },
            symbol: "none",
            markLine: {
              symbol: ["none", "none"],
              lineStyle: {
                color: "rgba(0, 0, 0, 0)",
              },
              label: {
                show: true,
                position: "end",
                color: "#9747ff",
                fontWeight: "bold",
              },
              data: [
                [
                  {
                    name: currentOutcomePrice,
                    xAxis: currentOutcomePriceIndex,
                    yAxis: 1,
                  },
                  { name: "end", xAxis: currentOutcomePriceIndex, yAxis: "max" },
                ],
              ],
            },
          },
        ],
      }
    : undefined;
  return (
    <div>
      <p className="font-semibold flex items-center gap-2 flex-wrap">
        Liquidity Distribution: {isShowToken0Price ? token0Symbol : token1Symbol}/
        {isShowToken0Price ? token1Symbol : token0Symbol}{" "}
        <button type="button" onClick={() => setShowToken0Price((state) => !state)}>
          <SwapIcon />
        </button>
        <div className="flex items-center ml-auto gap-2">
          <p className="text-[14px] whitespace-nowrap">Ticks display</p>
          <div className="min-w-[100px]">
            <Slider
              value={zoomCount}
              min={1}
              max={maxZoomCount}
              onChange={(value) => setZoomCount(Number.parseInt(value.toString()))}
            />
          </div>
          <span className="text-sm text-gray-600 min-w-[3ch]">{priceList.length - 1}</span>
        </div>
      </p>
      <div
        className="h-[400px] flex justify-center"
        onWheel={(event) => {
          const newCount =
            event.deltaY < 0
              ? Math.max(zoomCount - 1, 1) // Zoom out
              : Math.min(zoomCount + 1, maxZoomCount);
          setZoomCount(newCount);
        }}
      >
        <ReactECharts option={chartOption} style={{ height: "100%", width: "99%" }} />
      </div>
    </div>
  );
}

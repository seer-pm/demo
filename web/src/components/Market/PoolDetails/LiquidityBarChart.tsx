import { Slider } from "@/components/Slider";
import { Spinner } from "@/components/Spinner";
import { useOutcomeOrderLevels } from "@/hooks/limitOrders/useMarketOrderLevels";
import { getLiquidityChartData } from "@/hooks/liquidity/getLiquidityChartData";
import { useTicksData } from "@/hooks/liquidity/useTicksData";
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import { useTheme } from "@/hooks/useTheme";
import { formatBigNumbers, isTwoStringsEqual } from "@/lib/utils";
import { PoolInfo } from "@seer-pm/react";
import { Market } from "@seer-pm/sdk";
import { tickToPrice } from "@seer-pm/sdk/tick-math";
import ReactECharts from "echarts-for-react";
import { useState } from "react";
import { LiquidityEmptyState, LiquidityErrorState } from "./LiquidityStates";
import { formatLadderPrice, formatShareAmount } from "./format";

const LIQUIDITY_SERIES = "Liquidity";
const ORDERS_SERIES = "Limit orders";

/**
 * ECharts needs concrete colors, so these mirror the theme tokens the order-book ladder uses:
 * liquidity is a tint of --error-primary / --success-primary, limit orders and the cumulative line
 * are the AA --signed-down / --signed-up pair, and the price marker is Seer purple.
 */
const CHART_PALETTE = {
  light: {
    sellLiquidity: "rgba(246, 12, 54, 0.22)",
    buyLiquidity: "rgba(0, 196, 43, 0.22)",
    sell: "#B42318",
    buy: "#007A26",
    sellArea: "rgba(246, 12, 54, 0.06)",
    buyArea: "rgba(0, 196, 43, 0.06)",
    marker: "#9747FF",
    axis: "rgba(31, 41, 55, 0.7)",
    tooltipBackground: "#ffffff",
    tooltipBorder: "#e5e5e5",
    tooltipText: "#1f2937",
  },
  dark: {
    sellLiquidity: "rgba(255, 107, 122, 0.28)",
    buyLiquidity: "rgba(0, 196, 43, 0.28)",
    sell: "#FF6B7A",
    buy: "#00C42B",
    sellArea: "rgba(255, 107, 122, 0.08)",
    buyArea: "rgba(0, 196, 43, 0.08)",
    marker: "#B38FFF",
    axis: "rgba(255, 255, 255, 0.7)",
    tooltipBackground: "#1e2329",
    tooltipBorder: "#323942",
    tooltipText: "#ffffff",
  },
} as const;

const tooltipDot = (color: string) =>
  `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${color};margin-right:5px;"></span>`;

export default function LiquidityBarChart({
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
  const { token0Symbol, token1Symbol, tick, id, token0 } = poolInfo;
  const [price0, price1] = tickToPrice(tick);
  const isShowToken0Price = !!isTwoStringsEqual(token0, outcome);
  const currentOutcomePrice = isShowToken0Price ? price0 : price1;
  const { data: ticksByPool, isLoading, isError, refetch, isRefetching } = useTicksData(market, outcomeTokenIndex);
  const orderLevels = useOutcomeOrderLevels(market, outcomeTokenIndex, poolInfo);
  const isSmallScreen = useIsSmallScreen();
  const palette = CHART_PALETTE[useTheme((state) => state.theme)];
  const [zoomCount, setZoomCount] = useState(4); // default zoom to 4 item each side of the current price
  if (isError) {
    return <LiquidityErrorState onRetry={() => refetch()} isRetrying={isRefetching} />;
  }

  if (!ticksByPool?.[id]?.ticks?.filter((tick) => Number(tick.liquidityNet) > 0)?.length) {
    return (
      <div className="mt-2">{isLoading ? <Spinner /> : <LiquidityEmptyState onAddLiquidity={onAddLiquidity} />}</div>
    );
  }
  const {
    priceList,
    sellBarsData,
    buyBarsData,
    sellOrderBarsData,
    buyOrderBarsData,
    orderCounts,
    sellLineData,
    buyLineData,
    maxYValue,
    maxZoomCount,
  } = getLiquidityChartData(poolInfo, ticksByPool?.[id]?.ticks, isShowToken0Price, zoomCount, outcome, orderLevels);
  const currentOutcomePriceIndex = priceList.findIndex((price) => price === currentOutcomePrice);
  const maxLabelCount = isSmallScreen ? 3 : 10; //max label x axis
  const axisStyle = {
    axisLabel: { color: palette.axis },
    axisLine: { lineStyle: { color: palette.axis } },
    nameTextStyle: { color: palette.axis },
  };
  const chartOption = priceList
    ? {
        xAxis: [
          {
            ...axisStyle,
            type: "value",
            max: priceList.length - 1,
            interval: Math.ceil((zoomCount * 2) / (maxLabelCount - 1)),
            axisLabel: {
              ...axisStyle.axisLabel,
              rotate: 35,
              formatter(value: number) {
                if (value === currentOutcomePriceIndex) {
                  return `{bold|${formatLadderPrice(priceList[value])}}`;
                }
                return formatLadderPrice(priceList[value]);
              },
              rich: {
                bold: {
                  fontWeight: "bold",
                  color: palette.marker,
                },
              },
            },
            name: `${isShowToken0Price ? token0Symbol : token1Symbol} price`,
            nameLocation: "middle",
            nameGap: 45,
            splitLine: {
              show: false,
            },
          },
        ],

        tooltip: {
          trigger: "axis",
          backgroundColor: palette.tooltipBackground,
          borderColor: palette.tooltipBorder,
          textStyle: { color: palette.tooltipText },
          // biome-ignore lint/suspicious/noExplicitAny:
          formatter: (params: any[]) => {
            let tooltipContent = "";
            const currentPriceIndex = params[0].data[0] - 0.5;
            const currentLineIndex = params[0].data[0] * 2;
            for (const param of params) {
              if (!param?.data[1]) {
                continue;
              }
              tooltipContent += tooltipDot(param.color);
              tooltipContent += `${param.seriesName}: ${formatShareAmount(param.data[1])}`;
              if (param.seriesName === ORDERS_SERIES) {
                const accounts = orderCounts[currentPriceIndex] ?? 0;
                tooltipContent += ` (${accounts} ${accounts === 1 ? "account" : "accounts"})`;
              }
              tooltipContent += "<br>";
            }
            if (params[0] && sellLineData[currentLineIndex][1]) {
              tooltipContent += tooltipDot(params[0].color);
              tooltipContent += `Cumulative: ${formatShareAmount(sellLineData[currentLineIndex][1])}<br>`;
              tooltipContent += tooltipDot(params[0].color);
              tooltipContent += `Price: ${formatLadderPrice(priceList[currentPriceIndex])}<br>`;
            }
            if (params[1] && buyLineData[currentLineIndex][1]) {
              tooltipContent += tooltipDot(params[1].color);
              tooltipContent += `Cumulative: ${formatShareAmount(buyLineData[currentLineIndex][1])}<br>`;
              tooltipContent += tooltipDot(params[1].color);
              tooltipContent += `Price: ${formatLadderPrice(priceList[currentPriceIndex])}<br>`;
            }
            return tooltipContent;
          },
        },
        yAxis: [
          {
            ...axisStyle,
            type: "value",
            scale: true,
            axisLabel: {
              ...axisStyle.axisLabel,
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
          left: isSmallScreen ? "15%" : 60,
          right: isSmallScreen ? "15%" : 60,
          top: "15%",
          bottom: "15%",
        },
        series: [
          {
            name: LIQUIDITY_SERIES,
            type: "bar",
            stack: "total",
            barWidth: "100%",
            data: sellBarsData,
            itemStyle: {
              color: palette.sellLiquidity,
            },
          },
          {
            name: LIQUIDITY_SERIES,
            type: "bar",
            stack: "total",
            barWidth: "100%",
            data: buyBarsData,
            itemStyle: {
              color: palette.buyLiquidity,
            },
          },
          {
            name: ORDERS_SERIES,
            type: "bar",
            stack: "total",
            barWidth: "100%",
            data: sellOrderBarsData,
            itemStyle: {
              color: palette.sell,
            },
          },
          {
            name: ORDERS_SERIES,
            type: "bar",
            stack: "total",
            barWidth: "100%",
            data: buyOrderBarsData,
            itemStyle: {
              color: palette.buy,
            },
          },
          {
            name: "Total Volume",
            type: "line",
            data: sellLineData,
            itemStyle: {
              color: palette.sell,
            },
            areaStyle: {
              color: palette.sellArea,
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
              color: palette.buy,
            },
            areaStyle: {
              color: palette.buyArea,
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
              color: palette.marker,
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
                color: palette.marker,
                fontWeight: "bold",
              },
              data: [
                [
                  {
                    name: formatLadderPrice(currentOutcomePrice),
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
      <div className="font-semibold text-[14px] flex items-center align-center justify-center gap-2 w-full">
        <p className="text-[14px] whitespace-nowrap">Ticks display</p>
        <div className="min-w-[100px]">
          <Slider
            value={zoomCount}
            min={1}
            max={maxZoomCount}
            onChange={(value) => setZoomCount(Number.parseInt(value.toString()))}
          />
        </div>
        <span className="text-sm text-base-content min-w-[3ch] tabular-nums">{priceList.length - 1}</span>
      </div>
      {orderLevels.length > 0 && (
        <p className="text-[12px] text-base-content/70 text-center mt-1">
          The solid part of each bar is resting limit orders.
        </p>
      )}
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

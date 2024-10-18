import { useOddChartData } from "@/hooks/chart/useOddChartData";
import { Market } from "@/hooks/useMarket";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { SupportedChain } from "@/lib/chains";
import { formatOdds, getMarketType } from "@/lib/market";
import { INVALID_RESULT_OUTCOME_TEXT } from "@/lib/utils";
import clsx from "clsx";
import { format } from "date-fns";
import ReactECharts from "echarts-for-react";
import { useMemo, useState } from "react";

const chartOptions = {
  "1D": {
    dayCount: 1,
    interval: 60 * 60,
  },
  "1W": {
    dayCount: 7,
    interval: 60 * 60 * 24,
  },
  "1M": {
    dayCount: 30,
    interval: 60 * 60 * 24,
  },
  All: { dayCount: 365 * 10, interval: 60 * 60 * 24 },
};

type ChartOptionPeriod = keyof typeof chartOptions;

function MarketChart({ chainId, market }: { chainId: SupportedChain; market: Market }) {
  const { data: odds = [], isLoading: isLoadingOdds } = useMarketOdds(market, chainId, true);
  const [period, setPeriod] = useState<ChartOptionPeriod>("1M");
  const { data, isLoading: isLoadingChart } = useOddChartData(
    chainId,
    market,
    chartOptions[period].dayCount,
    chartOptions[period].interval,
  );
  const { chartData = [], timestamps = [] } = data ?? {};
  const currentTimestamp = useMemo(() => Math.floor(new Date().getTime() / 1000), []);
  const finalChartData = chartData
    .map((x, index) => {
      return {
        ...x,
        data: [...x.data, [currentTimestamp, Number.isNaN(odds[index]) ? 0 : odds[index]]],
        originalIndex: index,
      };
    })
    .filter((x) => x.name !== INVALID_RESULT_OUTCOME_TEXT)
    .sort((a, b) => odds[b.originalIndex] - odds[a.originalIndex]);
  const option = {
    color: [
      "#f58231",
      "#4363d8",
      "#3cb44b",
      "#e6194B",
      "#42d4f4",
      "#fabed4",
      "#469990",
      "#dcbeff",
      "#9A6324",
      "#ffe119",
    ],
    tooltip: {
      trigger: "axis",
      valueFormatter: (value: number) => formatOdds(Number.isNaN(value) ? 0 : (value ?? 0), getMarketType(market)),
    },
    legend: {
      formatter: (name: string) => {
        for (let i = 0; i < market.outcomes.length; i++) {
          const outcome = market.outcomes[i];
          if (name === outcome) {
            return `${name} ${formatOdds(Number.isNaN(odds[i]) ? 0 : (odds[i] ?? 0), getMarketType(market))}`;
          }
        }
        return name;
      },
    },

    grid: {
      left: 50,
      right: 50,
      top: "15%",
      bottom: "15%",
    },

    xAxis: {
      min: "dataMin",
      max: "dataMax",
      splitLine: {
        show: false,
      },
      axisTick: {
        alignWithLabel: true,
        customValues: [...timestamps, currentTimestamp].filter((_, index) => index % 4 === 0),
      },
      axisPointer: {
        label: {
          formatter: (params: { value: number }) => format(params.value * 1000, "MMM dd, hh:mmaaa"),
        },
      },
      type: "value",
      axisLabel: {
        formatter: (value: number) => format(value * 1000, period === "1D" ? "hhaaa" : "MMM dd"),
        customValues: [...timestamps, currentTimestamp].filter((_, index) => index % 4 === 0),
      },
    },
    yAxis: {
      min: "dataMin",
      max: "dataMax",

      axisLabel: {
        formatter: (value: number) => formatOdds(Number.isNaN(value) ? 0 : (value ?? 0), getMarketType(market)),
      },
    },
    series: finalChartData,
  };

  return (
    <>
      <div className="w-full bg-white p-5 text-[12px] drop-shadow">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {Object.keys(chartOptions).map((option) => (
            <div
              key={option}
              onClick={() => {
                setPeriod(option as ChartOptionPeriod);
              }}
              className={clsx(
                "border border-transparent rounded-[300px] px-[16px] py-[6.5px] bg-purple-medium text-purple-primary text-[14px] hover:border-purple-primary text-center cursor-pointer",
                period === option && "!border-purple-primary",
              )}
            >
              {option}
            </div>
          ))}
        </div>
        {isLoadingChart || isLoadingOdds ? (
          <div className="w-full mt-3 h-[200px] shimmer-container" />
        ) : chartData?.length ? (
          <ReactECharts option={option} />
        ) : (
          <p className="mt-3 text-[16px]">No chart data.</p>
        )}
      </div>
    </>
  );
}

export default MarketChart;

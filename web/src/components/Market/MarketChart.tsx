import { ChartData } from "@/hooks/chart/getChartData";
import { useChartData } from "@/hooks/chart/useChartData";
import { Market } from "@/hooks/useMarket";
import { QuestionIcon } from "@/lib/icons";
import { MarketTypes, getMarketType, isOdd } from "@/lib/market";
import { INVALID_RESULT_OUTCOME_TEXT } from "@/lib/utils";
import clsx from "clsx";
import { format } from "date-fns";
import ReactECharts from "echarts-for-react";
import { useState } from "react";

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

function getSeries(market: Market, chartData: ChartData["chartData"]) {
  if (market.type === "Futarchy") {
    return chartData
      .map((x, index) => {
        return {
          ...x,
          data: x.data,
          originalIndex: index,
        };
      })
      .sort((a, b) => b.data[b.data.length - 1][1] - a.data[a.data.length - 1][1]);
  }

  if (getMarketType(market) === MarketTypes.SCALAR) {
    return chartData;
  }

  return chartData
    .filter((x) => x.name !== INVALID_RESULT_OUTCOME_TEXT)
    .sort((a, b) => b.data[b.data.length - 1][1] - a.data[a.data.length - 1][1]);
}

function MarketChart({ market }: { market: Market }) {
  const [period, setPeriod] = useState<ChartOptionPeriod>("1W");
  const { data, isPending: isPendingChart } = useChartData(
    market,
    chartOptions[period].dayCount,
    chartOptions[period].interval,
  );

  const { chartData = [], timestamps = [] } = data ?? {};

  const isScalarMarket = getMarketType(market) === MarketTypes.SCALAR;
  const isMultiCategoricalMarket = getMarketType(market) === MarketTypes.MULTI_CATEGORICAL;
  const series = getSeries(market, chartData);

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
      valueFormatter: (value: number) => {
        if (market.type === "Futarchy") {
          return `${value}`;
        }

        if (isScalarMarket) {
          return `${Number(value).toLocaleString()}`;
        }
        if (isMultiCategoricalMarket) {
          return `${(value / 100).toFixed(3)}`;
        }
        return `${value}%`;
      },
    },

    legend: {
      formatter: (name: string) => {
        if (market.type === "Futarchy") {
          return name;
        }
        const latestDataSet = series.map((x) => x.data[x.data.length - 1][1]);
        if (isScalarMarket) {
          return `${name} ${Number(latestDataSet[0]).toLocaleString()}`;
        }
        for (let i = 0; i < market.outcomes.length; i++) {
          const outcome = market.outcomes[i];
          if (name === outcome) {
            if (isMultiCategoricalMarket) {
              return `${name} ${!isOdd(latestDataSet[i]) ? "NA" : (latestDataSet[i] / 100).toFixed(3)}`;
            }
            return `${name} ${!isOdd(latestDataSet[i]) ? "NA" : `${latestDataSet[i]}%`}`;
          }
        }
        return name;
      },
    },

    grid: {
      left: 80,
      right: 80,
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
        customValues: timestamps.filter((_, index) => index % 4 === 0),
      },
      axisPointer: {
        label: {
          formatter: (params: { value: number }) => format(params.value * 1000, "MMM dd, hh:mmaaa"),
        },
      },

      type: "value",
      axisLabel: {
        formatter: (value: number) => format(value * 1000, period === "1D" ? "hhaaa" : "MMM dd"),
        customValues: timestamps.filter((_, index) => index % 4 === 0),
      },
    },

    yAxis: {
      min: "dataMin",
      max: "dataMax",
      axisLabel: {
        formatter: (value: number) => {
          if (market.type === "Futarchy") {
            return `${Number(value).toLocaleString()}`;
          }

          if (isScalarMarket) {
            return `${Number(value).toLocaleString()}`;
          }
          if (isMultiCategoricalMarket) {
            return `${(value / 100).toFixed(3)}`;
          }
          return `${value}%`;
        },
      },
    },
    series,
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
          <div className="tooltip">
            <p className="tooltiptext !whitespace-pre-wrap w-[250px] md:w-[400px] ">
              The chart represents the token distribution in the liquidity pool over time and may not fully align with
              the outcome odds, which are calculated based on potential token purchases.
            </p>
            <QuestionIcon fill="#9747FF" />
          </div>
        </div>
        {isPendingChart ? (
          <div className="w-full mt-3 h-[200px] shimmer-container" />
        ) : series.length > 0 ? (
          <ReactECharts key={series[0].name} option={option} />
        ) : (
          <p className="mt-3 text-[16px]">No chart data.</p>
        )}
      </div>
    </>
  );
}

export default MarketChart;

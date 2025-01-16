import { useOddChartData } from "@/hooks/chart/useOddChartData";
import { Market } from "@/hooks/useMarket";
import { QuestionIcon } from "@/lib/icons";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { MarketTypes, getMarketEstimate, getMarketType, isOdd } from "@/lib/market";
import { INVALID_RESULT_OUTCOME_TEXT } from "@/lib/utils";
import clsx from "clsx";
import { format } from "date-fns";
import { useMemo, useState, lazy, Suspense } from "react";

const ReactEChartsComponent = lazy(() => import('echarts-for-react'));

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

function MarketChart({ market }: { market: Market }) {
  const { data: odds = [], isLoading: isLoadingOdds } = useMarketOdds(market, true);
  const [period, setPeriod] = useState<ChartOptionPeriod>("1W");
  const { data, isLoading: isLoadingChart } = useOddChartData(
    market,
    chartOptions[period].dayCount,
    chartOptions[period].interval,
  );
  const { chartData = [], timestamps = [] } = data ?? {};
  const currentTimestamp = useMemo(() => Math.floor(new Date().getTime() / 1000), []);
  const hasLiquidity = odds.some((odd) => isOdd(odd));
  const isScalarMarket = getMarketType(market) === MarketTypes.SCALAR;
  const isMultiCategoricalMarket = getMarketType(market) === MarketTypes.MULTI_CATEGORICAL;
  const marketEstimate = getMarketEstimate(odds, market);
  const finalChartData = isScalarMarket
    ? chartData.map((x) => {
        return {
          ...x,
          data: hasLiquidity ? [...x.data, [currentTimestamp, marketEstimate]] : x.data,
        };
      })
    : chartData
        .map((x, index) => {
          return {
            ...x,
            data: hasLiquidity ? [...x.data, [currentTimestamp, Number.isNaN(odds[index]) ? 0 : odds[index]]] : x.data,
            originalIndex: index,
          };
        })
        .filter((x) => x.name !== INVALID_RESULT_OUTCOME_TEXT)
        .sort((a, b) => b.data[b.data.length - 1][1] - a.data[a.data.length - 1][1]);
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
        if (isScalarMarket) {
          return `${name} ${getMarketEstimate(odds, market, true)}`;
        }
        for (let i = 0; i < market.outcomes.length; i++) {
          const outcome = market.outcomes[i];
          if (name === outcome) {
            if (isMultiCategoricalMarket) {
              return `${name} ${!isOdd(odds[i]) ? "NA" : (odds[i] / 100).toFixed(3)}`;
            }
            return `${name} ${!isOdd(odds[i]) ? "NA" : `${odds[i]}%`}`;
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
        customValues: (hasLiquidity ? [...timestamps, currentTimestamp] : timestamps).filter(
          (_, index) => index % 4 === 0,
        ),
      },
      axisPointer: {
        label: {
          formatter: (params: { value: number }) => format(params.value * 1000, "MMM dd, hh:mmaaa"),
        },
      },
      type: "value",
      axisLabel: {
        formatter: (value: number) => format(value * 1000, period === "1D" ? "hhaaa" : "MMM dd"),
        customValues: (hasLiquidity ? [...timestamps, currentTimestamp] : timestamps).filter(
          (_, index) => index % 4 === 0,
        ),
      },
    },
    yAxis: {
      min: "dataMin",
      max: "dataMax",

      axisLabel: {
        formatter: (value: number) => {
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
          <div className="tooltip">
            <p className="tooltiptext !whitespace-pre-wrap w-[250px] md:w-[400px] ">
              The chart represents the token distribution in the liquidity pool over time and may not fully align with
              the outcome odds, which are calculated based on potential token purchases.
            </p>
            <QuestionIcon fill="#9747FF" />
      </div>
        </div>
        {isLoadingChart || isLoadingOdds ? (
    <div className="w-full mt-3 h-[200px] shimmer-container" />
  ) : chartData?.length ? (
    <Suspense fallback={<div className="w-full mt-3 h-[200px] shimmer-container" />}>
      <ReactEChartsComponent key={finalChartData[0].name} option={option} />
    </Suspense>
  ) : market?.outcomes?.length ? (
    <Suspense fallback={<div className="w-full mt-3 h-[200px] shimmer-container" />}>
      <ReactEChartsComponent
        key="zero-values-chart"
        option={{
          ...option,
          series: market.outcomes
            .filter(outcome => outcome !== INVALID_RESULT_OUTCOME_TEXT)
            .map((outcome) => ({
              name: outcome,
              type: 'line',
              data: Array.from({ length: 10 }, (_, i) => {
                const startTime = Math.floor(Date.now() / 1000) - (chartOptions[period].dayCount * 24 * 60 * 60);
                const timestamp = startTime + (i * (chartOptions[period].dayCount * 24 * 60 * 60) / 9);
                return [timestamp, 0];
              })
            }))
        }}
      />
    </Suspense>
  ) : (
    <p className="mt-3 text-[16px]">No chart data.</p>
  )}
    </div>
    </>
  );
}

export default MarketChart;
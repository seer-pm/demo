import { useOddChartData } from "@/hooks/chart/useOddChartData";
import { Market } from "@/hooks/useMarket";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { MarketTypes, getMarketEstimate, getMarketType, isOdd } from "@/lib/market";
import { INVALID_RESULT_OUTCOME_TEXT } from "@/lib/utils";
import clsx from "clsx";
import { format } from "date-fns";
import ReactECharts from "echarts-for-react";
import { useMemo, useState } from "react";
import { useEffect } from "react";

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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getLegendHeight = (outcomes: readonly string[]) => {
    const rowHeight = 20;
    const itemsPerRow = windowWidth < 550 ? 1 : 3;
    const rows = Math.ceil(outcomes.length / itemsPerRow);
    return rows * rowHeight;
  };

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
      top: `${getLegendHeight(market.outcomes) + 20}px`,
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
        </div>
        {isLoadingChart || isLoadingOdds ? (
          <div className="w-full mt-3 h-[200px] shimmer-container" />
        ) : chartData?.length ? (
          <div style={{ height: `${getLegendHeight(market.outcomes) + 300}px` }}>
            <ReactECharts key={finalChartData[0].name} option={option} style={{ height: "100%" }} />
          </div>
        ) : (
          <p className="mt-3 text-[16px]">No chart data.</p>
        )}
      </div>
    </>
  );
}

export default MarketChart;

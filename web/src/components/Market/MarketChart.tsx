import { ChartData, fetchFullChartData, useChartData } from "@/hooks/chart/useChartData";
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import { Market } from "@/hooks/useMarket";
import { ExportIcon, QuestionIcon } from "@/lib/icons";
import { MarketTypes, getMarketType, isOdd } from "@/lib/market";
import { INVALID_RESULT_OUTCOME_TEXT, downloadCsv, formatDate } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";
import { differenceInDays, format } from "date-fns";
import ReactECharts from "echarts-for-react";
import { useMemo, useState } from "react";
import slug from "slug";
import DateRangePicker from "../Portfolio/DateRangePicker";
import { Spinner } from "../Spinner";

const chartOptions = {
  "1D": {
    dayCount: 1,
    interval: 60 * 5,
  },
  "1W": {
    dayCount: 7,
    interval: 60 * 30,
  },
  "1M": {
    dayCount: 30,
    interval: 60 * 60 * 3,
  },
  All: { dayCount: 365 * 10, interval: 60 * 60 * 12 },
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
  const [period, setPeriod] = useState<ChartOptionPeriod>("All");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isShowDateRangePicker, setShowDateRangePicker] = useState(false);
  const onChangeDate = (dates: (Date | null)[]) => {
    const [start, end] = dates;
    if (!start && !end) {
      setPeriod("All");
    }
    setStartDate(start ?? undefined);
    setEndDate(end ?? undefined);
  };

  const chartTimeConfig = (() => {
    if (startDate) {
      const endDateForCalc = endDate || new Date();
      const dayCount = differenceInDays(endDateForCalc, startDate);
      return {
        dayCount,
        interval: 60 * 60 * 3,
      };
    }
    if (endDate) {
      return {
        dayCount: 365 * 10,
        interval: 60 * 60 * 3,
      };
    }
    return {
      dayCount: chartOptions[period].dayCount,
      interval: chartOptions[period].interval,
    };
  })();

  const { data, isPending: isPendingChart } = useChartData(
    market,
    chartTimeConfig.dayCount,
    chartTimeConfig.interval,
    endDate,
  );

  const { chartData = [], timestamps = [] } = data ?? {};

  const isScalarMarket = getMarketType(market) === MarketTypes.SCALAR;
  const isMultiCategoricalMarket = getMarketType(market) === MarketTypes.MULTI_CATEGORICAL;
  const series = useMemo(() => {
    const rawSeries = getSeries(market, chartData);
    if (!rawSeries.length) return rawSeries;

    let validStartIndex = 0;
    const dataLength = rawSeries[0].data.length;

    for (let i = 0; i < dataLength; i++) {
      const hasExtreme = rawSeries.some((series) => {
        const value = series.data[i][1];
        return value > 99.9 || value < 0.1;
      });

      if (!hasExtreme && i > 0) {
        validStartIndex = i;
        break;
      }
    }
    if (validStartIndex > 0) {
      return rawSeries.map((series) => ({
        ...series,
        data: series.data.slice(validStartIndex),
      }));
    }

    return rawSeries;
  }, [market, chartData]);

  const adjustedTimestamps = useMemo(() => {
    if (!timestamps.length || !series.length || series[0].data.length === timestamps.length) {
      return timestamps;
    }
    return timestamps.slice(timestamps.length - series[0].data.length);
  }, [timestamps, series]);

  const isSmallScreen = useIsSmallScreen();
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
      axisPointer: {
        type: "none",
      },
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
        for (let i = 0; i < series.length; i++) {
          const outcome = series[i].name;
          if (name === outcome) {
            if (isMultiCategoricalMarket) {
              return `${name} ${!isOdd(latestDataSet[i]) ? "NA" : (latestDataSet[i] / 100).toFixed(3)}`;
            }
            return `${name} ${!isOdd(latestDataSet[i]) ? "NA" : `${latestDataSet[i]}%`}`;
          }
        }
        return name;
      },
      ...(series.length > 10 && {
        type: "scroll",
        left: isSmallScreen ? 20 : 80,
        right: isSmallScreen ? 20 : 80,
        padding: [20, 10, 10, 10],
      }),
    },

    grid: {
      left: isSmallScreen ? "20%" : 80,
      right: isSmallScreen ? 20 : 80,
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
        customValues: adjustedTimestamps.filter(
          (_: number, index: number) => index % Math.floor(adjustedTimestamps.length / (isSmallScreen ? 2 : 5)) === 0,
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
        customValues: adjustedTimestamps.filter(
          (_: number, index: number) => index % Math.floor(adjustedTimestamps.length / (isSmallScreen ? 2 : 5)) === 0,
        ),
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
    series: (series[0]?.data?.length > 1
      ? series
      : series.map((x) => ({
          ...x,
          data: [x.data[0], [x.data[0][0] + 1, x.data[0][1]]],
        }))
    ).map((x) => ({
      ...x,
      symbol: "circle",
      symbolSize: 7,
      showSymbol: false,
    })),
  };

  const exportData = async () => {
    // Use resolved date for export if available
    const { chartData, timestamps }: ChartData = await fetchFullChartData(market);
    const series = getSeries(market, chartData);
    const headers = [
      {
        key: "date",
        title: "Date (UTC)",
      },
      {
        key: "timestamp",
        title: "Timestamp (UTC)",
      },
      ...series.map((x) => ({ key: x.name, title: x.name })),
    ];
    const rows = timestamps.map((timestamp, index) => {
      return {
        date: formatDate(timestamp, "MM-dd-yyyy HH:mm"),
        timestamp,
        ...series.reduce(
          (acc, curr) => {
            acc[curr.name] = curr.data[index][1];
            return acc;
          },
          {} as { [key: string]: number },
        ),
      };
    });
    downloadCsv(headers, rows, `seer-price-data-${slug(market.marketName).slice(0, 80)}`);
  };

  const mutateExport = useMutation({ mutationFn: exportData });

  return (
    <>
      <div className="w-full bg-white p-5 text-[12px] drop-shadow">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {Object.keys(chartOptions).map((option) => (
            <div
              key={option}
              onClick={() => {
                setPeriod(option as ChartOptionPeriod);
                setStartDate(undefined);
                setEndDate(undefined);
              }}
              className={clsx(
                "border border-transparent rounded-[300px] px-[16px] py-[6.5px] bg-purple-medium text-purple-primary text-[14px] hover:border-purple-primary text-center cursor-pointer",
                !startDate && !endDate && period === option && "!border-purple-primary",
              )}
            >
              {option}
            </div>
          ))}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDateRangePicker((state) => !state)}
              className={clsx(
                "border border-transparent rounded-[300px] px-[16px] py-[6.5px] bg-purple-medium text-purple-primary text-[14px] hover:border-purple-primary text-center cursor-pointer",
                (startDate || endDate) && "!border-purple-primary",
              )}
            >
              {!startDate && !endDate
                ? "Custom"
                : `${startDate ? format(startDate, "MMM d, yyyy") : "_"} - ${
                    endDate ? format(endDate, "MMM d, yyyy") : "_"
                  }`}
            </button>
            {isShowDateRangePicker && (
              <div className="absolute left-0 top-[60px] z-10">
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onChange={onChangeDate}
                  onClose={() => setShowDateRangePicker(false)}
                />
              </div>
            )}
          </div>
          <div className="tooltip">
            <p className="tooltiptext !whitespace-pre-wrap w-[250px] md:w-[400px] ">
              The chart represents the token distribution in the liquidity pool over time and may not fully align with
              the outcome odds, which are calculated based on potential token purchases.
            </p>
            <QuestionIcon fill="#9747FF" />
          </div>
          <button
            type="button"
            className="hover:opacity-80 ml-auto tooltip"
            onClick={() => mutateExport.mutate()}
            disabled={mutateExport.isPending}
          >
            {!mutateExport.isPending && <span className="tooltiptext">Export Data</span>}
            {mutateExport.isPending ? <Spinner className="bg-black-secondary" /> : <ExportIcon />}
          </button>
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

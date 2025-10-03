import { ChartData, fetchFullChartData, useChartData } from "@/hooks/chart/useChartData";
import { formatDate } from "@/lib/date";
import { ExportIcon, QuestionIcon } from "@/lib/icons";
import { Market } from "@/lib/market";
import { MarketTypes, getMarketType } from "@/lib/market";
import { INVALID_RESULT_OUTCOME_TEXT, downloadCsv } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";
import { differenceInDays, format } from "date-fns";
import { LineSeries, LineStyle, UTCTimestamp, createChart } from "lightweight-charts";
import { useEffect, useMemo, useRef, useState } from "react";
import slug from "slug";
import DateRangePicker from "../Portfolio/DateRangePicker";
import { Spinner } from "../Spinner";

const CHART_COLORS = [
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
  "#FF6F61",
  "#6B7280",
  "#FBBF24",
  "#34D399",
  "#3B82F6",
  "#EC4899",
  "#F97316",
  "#22D3EE",
  "#84CC16",
  "#A855F7",
  "#EF4444",
  "#10B981",
  "#6366F1",
  "#F59E0B",
  "#06B6D4",
  "#8B5CF6",
  "#D97706",
  "#14B8A6",
  "#7C3AED",
  "#F87171",
  "#4ADE80",
  "#2563EB",
  "#FBBF24",
  "#0EA5E9",
  "#A78BFA",
  "#EF6C00",
  "#2DD4BF",
  "#7E22CE",
  "#DC2626",
  "#22C55E",
  "#1D4ED8",
  "#EAB308",
  "#0891B2",
  "#9333EA",
  "#C2410C",
  "#14B8A6",
  "#6D28D9",
  "#B91C1C",
  "#16A34A",
  "#1E40AF",
  "#D97706",
  "#0E7490",
  "#7C3AED",
  "#991B1B",
  "#15803D",
  "#1E3A8A",
  "#B45309",
  "#0E7490",
  "#6B21A8",
  "#7F1D1D",
  "#047857",
];

const CHART_OPTION_PERIODS = {
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
  All: { dayCount: 365 * 10, interval: 60 * 30 },
};

type ChartOptionPeriod = keyof typeof CHART_OPTION_PERIODS;

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

function getFilteredSeries(market: Market, chartData: ChartData["chartData"]) {
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
}

async function exportData(market: Market) {
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
}

function getChartTimeConfig(period: ChartOptionPeriod, startDate: Date | undefined, endDate: Date | undefined) {
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
    dayCount: CHART_OPTION_PERIODS[period].dayCount,
    interval: CHART_OPTION_PERIODS[period].interval,
  };
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

  const chartTimeConfig = getChartTimeConfig(period, startDate, endDate);

  const { data, isPending: isPendingChart } = useChartData(
    market,
    chartTimeConfig.dayCount,
    chartTimeConfig.interval,
    endDate,
  );

  const { chartData = [] } = data ?? {};

  const series = useMemo(() => getFilteredSeries(market, chartData), [market, chartData]);

  const mutateExport = useMutation({ mutationFn: () => exportData(market) });

  return (
    <>
      <div className="w-full bg-white p-5 text-[12px] drop-shadow">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {Object.keys(CHART_OPTION_PERIODS).map((option) => (
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
                : `${startDate ? format(startDate, "MMM d, yyyy") : "_"} - ${endDate ? format(endDate, "MMM d, yyyy") : "_"}`}
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
          <>
            {/* <ReactECharts key={series[0].name} option={option} /> */}
            <LightweightChart
              series={series.map((serie, index) => ({
                outcome: { name: serie.name, color: CHART_COLORS?.[index] || "#000" },
                data: serie.data.map((d) => ({ time: d[0] as UTCTimestamp, value: d[1] })),
              }))}
            />
          </>
        ) : (
          <p className="mt-3 text-[16px]">No chart data.</p>
        )}
      </div>
    </>
  );
}

interface LegendProps {
  outcomesData: IOutcomeData[];
  visibleOutcomes: Set<string>;
  onToggleOutcome: (outcomeName: string) => void;
}

const Legend: React.FC<LegendProps> = ({ outcomesData, visibleOutcomes, onToggleOutcome }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  if (outcomesData.length === 0) {
    return null;
  }

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth;
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollButtons);
      return () => container.removeEventListener("scroll", checkScrollButtons);
    }
  }, [outcomesData]);

  return (
    <div className="relative flex items-center pr-16">
      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {outcomesData.map(({ outcome, data }, index) => {
          const isVisible = visibleOutcomes.has(outcome.name);
          const lastValue = data.slice(-1)?.[0]?.value;
          const formattedValue = lastValue
            ? lastValue % 1 === 0
              ? `${lastValue}%`
              : `${lastValue.toFixed(1)}%`
            : "0%";

          return (
            <div
              key={`item-${index}`}
              onClick={() => onToggleOutcome(outcome.name)}
              className="flex items-center justify-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs whitespace-nowrap transition-colors hover:bg-gray-50"
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: isVisible ? outcome.color : "#d1d5db",
                  opacity: isVisible ? 1 : 0.6,
                }}
              />
              <span className="truncate max-w-[120px]">{outcome.name}</span>
              <span className="text-gray-600">{formattedValue}</span>
            </div>
          );
        })}
      </div>

      {/* Navigation buttons on the right */}
      <div className="absolute right-0 flex gap-1">
        {/* Left arrow button */}
        <button
          type="button"
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          className={clsx(
            "w-6 h-6 flex items-center justify-center transition-opacity",
            !canScrollLeft && "opacity-30 cursor-not-allowed",
          )}
        >
          <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-r-[8px] border-t-transparent border-b-transparent border-r-gray-600" />
        </button>

        {/* Right arrow button */}
        <button
          type="button"
          onClick={scrollRight}
          disabled={!canScrollRight}
          className={clsx(
            "w-6 h-6 flex items-center justify-center transition-opacity",
            !canScrollRight && "opacity-30 cursor-not-allowed",
          )}
        >
          <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-gray-600" />
        </button>
      </div>
    </div>
  );
};

interface IOutcome {
  name: string;
  color: string;
}

interface IOutcomeData {
  outcome: IOutcome;
  data: Array<{ time: UTCTimestamp; value: number }>;
}

const shortenName = (name: string) => (name.length > 16 ? `${name.slice(0, 12)}...` : name);

function LightweightChart({ series }: { series: IOutcomeData[] }) {
  const outcomeNames = useMemo(() => series.map(({ outcome }) => outcome.name), [series]);

  const [visibleOutcomes, setVisibleOutcomes] = useState<Set<string>>(new Set(outcomeNames));
  const [tooltipData, setTooltipData] = useState<{
    time: UTCTimestamp;
    values: Array<{ name: string; value: number; color: string }>;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    setVisibleOutcomes(new Set(outcomeNames));
  }, [outcomeNames]);

  const handleToggleOutcome = (outcomeName: string) => {
    setVisibleOutcomes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(outcomeName)) {
        newSet.delete(outcomeName);
      } else {
        newSet.add(outcomeName);
      }
      return newSet;
    });
  };

  const accentColor = "#999";

  const gridLinesColor = "#e5e5e5";

  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef?.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef?.current, {
      layout: {
        background: {
          color: "transparent",
        },
        textColor: accentColor,
      },
      width: chartContainerRef?.current?.clientWidth,
      height: 300,
      autoSize: true,
      rightPriceScale: {
        borderVisible: false,
        visible: true,
      },
      leftPriceScale: {
        borderVisible: false,
        visible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        minBarSpacing: 0.001,
      },
      grid: {
        vertLines: {
          color: gridLinesColor,
          style: LineStyle.SparseDotted,
        },
        horzLines: {
          color: gridLinesColor,
          style: LineStyle.SparseDotted,
        },
      },
    });
    chart.timeScale().fitContent();

    const seriesInstances: Array<{ data: IOutcomeData; color: string }> = [];
    Object.values(series).forEach((outcomeData, i) => {
      if (visibleOutcomes.has(outcomeData.outcome.name)) {
        const series = chart.addSeries(LineSeries, {
          color: CHART_COLORS?.[i],
          lineWidth: 2,
          title: shortenName(outcomeData.outcome.name),
        });
        series.setData(outcomeData.data);
        seriesInstances.push({ data: outcomeData, color: CHART_COLORS?.[i] });
      }
    });

    // Add crosshair move event listener for tooltip
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current!.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current!.clientHeight
      ) {
        setTooltipData(null);
        return;
      }

      const time = param.time as UTCTimestamp;
      const values: Array<{ name: string; value: number; color: string }> = [];

      for (const { data, color } of seriesInstances) {
        if (visibleOutcomes.has(data.outcome.name)) {
          const dataPoint = data.data.find((d: { time: UTCTimestamp; value: number }) => d.time === time);
          if (dataPoint) {
            values.push({
              name: data.outcome.name,
              value: dataPoint.value,
              color: color || "#000",
            });
          }
        }
      }

      if (values.length > 0) {
        setTooltipData({
          time,
          values,
          x: param.point.x,
          y: param.point.y,
        });
      } else {
        setTooltipData(null);
      }
    });

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);

      chart.remove();
    };
  }, [series, Array.from(visibleOutcomes).join(",")]);

  return (
    <div className="mt-6 flex size-full flex-col px-[10px] relative">
      <Legend outcomesData={series} visibleOutcomes={visibleOutcomes} onToggleOutcome={handleToggleOutcome} />
      <div ref={chartContainerRef} />
      {tooltipData && (
        <div
          className="absolute bg-white rounded-lg shadow-lg p-3 z-10 pointer-events-none"
          style={{
            left: `${tooltipData.x + 10}px`,
            top: `${tooltipData.y - 10}px`,
            transform: "translateY(-100%)",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div className="text-sm text-gray-600 mb-2">
            {format(new Date(tooltipData.time * 1000), "MMM d, yyyy HH:mm")}
          </div>
          <div className="space-y-1">
            {tooltipData.values.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm">{item.name}:</span>
                <span className="text-sm text-gray-700">{item.value.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketChart;

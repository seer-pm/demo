import { fetchChartData, useChartData } from "@/hooks/chart/useChartData";
import { type ChartData, buildChartData } from "@/hooks/chart/utils";
import { formatDate } from "@/lib/date";
import { QuestionIcon } from "@/lib/icons";
import { downloadCsv } from "@/lib/utils";
import { Market, MarketTypes, getMarketType } from "@seer-pm/sdk";
import { INVALID_RESULT_OUTCOME_TEXT } from "@seer-pm/sdk";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";
import { differenceInDays, format } from "date-fns";
import { LineSeries, LineStyle, type Time, UTCTimestamp, createChart } from "lightweight-charts";
import { useEffect, useMemo, useRef, useState } from "react";
import slug from "slug";
import DateRangePicker from "../../Portfolio/DateRangePicker";
import { Spinner } from "../../Spinner";
import Legend from "./Legend";
import RulesNote from "./RulesNote";

export interface IOutcomeData {
  outcome: {
    name: string;
    color: string;
  };
  data: Array<{ time: UTCTimestamp; value: number }>;
}

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

async function fetchDailyChartHistory(market: Market) {
  const poolHourDataSets = await fetchChartData(market);
  return await buildChartData(market, poolHourDataSets!, 365 * 10, 60 * 60 * 24, undefined);
}

async function exportData(market: Market) {
  // Use resolved date for export if available
  const { chartData, timestamps }: ChartData = await fetchDailyChartHistory(market);
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
      <div className="card-box w-full p-[20px] text-[12px]">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="timeframe" role="tablist">
            {Object.keys(CHART_OPTION_PERIODS).map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => {
                  setPeriod(option as ChartOptionPeriod);
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
                className={clsx(!startDate && !endDate && period === option && "active")}
              >
                {option}
              </button>
            ))}
            <div className="relative inline-flex">
              <button
                type="button"
                onClick={() => setShowDateRangePicker((state) => !state)}
                className={clsx((startDate || endDate) && "active")}
              >
                {!startDate && !endDate
                  ? "Custom"
                  : `${startDate ? format(startDate, "MMM d, yyyy") : "_"} - ${
                      endDate ? format(endDate, "MMM d, yyyy") : "_"
                    }`}
              </button>
              {isShowDateRangePicker && (
                <div className="absolute left-0 top-[44px] z-10">
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onChange={onChangeDate}
                    onClose={() => setShowDateRangePicker(false)}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="tooltip flex items-center">
            <p className="tooltiptext !whitespace-pre-wrap w-[250px] md:w-[400px] ">
              The chart represents the token distribution in the liquidity pool over time and may not fully align with
              the outcome odds, which are calculated based on potential token purchases.
            </p>
            <QuestionIcon fill="var(--blue)" />
          </div>
          <button
            type="button"
            className="ml-auto flex items-center gap-1.5 text-ink-4 hover:text-ink-2 transition-colors"
            onClick={() => mutateExport.mutate()}
            disabled={mutateExport.isPending}
          >
            {mutateExport.isPending ? (
              <Spinner className="bg-black-secondary" />
            ) : (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="block shrink-0"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
            <span className="text-[12px] font-medium leading-none">Export Data</span>
          </button>
        </div>
        {isPendingChart ? (
          <div className="w-full mt-3 h-[200px] shimmer-container" />
        ) : series.length > 0 ? (
          <LightweightChart
            series={series.map((serie, index) => ({
              outcome: { name: serie.name, color: CHART_COLORS?.[index] || "#000" },
              data: serie.data.map((d) => ({ time: d[0] as UTCTimestamp, value: d[1] })),
            }))}
            market={market}
          />
        ) : (
          <p className="mt-3 text-[16px]">No chart data.</p>
        )}
        <RulesNote />
      </div>
    </>
  );
}

function LightweightChart({ series, market }: { series: IOutcomeData[]; market: Market }) {
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

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const rootStyles = getComputedStyle(document.documentElement);
    const accentColor = rootStyles.getPropertyValue("--ink-4").trim() || "#6b7280";
    const gridLinesColor = rootStyles.getPropertyValue("--border").trim() || "#ece8dc";

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef?.current?.clientWidth });
      renderMarkers();
    };

    // Categorical/Generic markets are scored 0–100%. We pin the scale to a fixed
    // 0–100 range and draw our own gridlines/labels at 0/25/50/75/100% (see
    // renderMarkers) so the chart matches the seerbeta mockup. Futarchy markets
    // use raw prices, so we keep the library's native auto scale there.
    const isPercentScale = market.type !== "Futarchy";

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
        // Hidden for percent markets — replaced by our own 0/25/50/75/100% labels.
        visible: !isPercentScale,
      },
      leftPriceScale: {
        borderVisible: false,
        visible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: false,
        secondsVisible: false,
        minBarSpacing: 0.001,
        tickMarkFormatter: (time: Time) => format(new Date((time as number) * 1000), "MMM d"),
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          // Native gridlines are replaced by the custom overlay for percent markets.
          visible: !isPercentScale,
          color: gridLinesColor,
          style: LineStyle.Solid,
        },
      },
    });

    const seriesInstances: Array<{
      data: IOutcomeData;
      color: string;
      api: ReturnType<typeof chart.addSeries>;
    }> = [];
    for (const outcomeData of series) {
      if (visibleOutcomes.has(outcomeData.outcome.name)) {
        const lineSeries = chart.addSeries(LineSeries, {
          color: outcomeData.outcome.color,
          lineWidth: 2,
          lastValueVisible: false,
          priceLineVisible: false,
          priceFormat: {
            type: "price",
            precision: market.type === "Futarchy" ? 3 : 2,
            minMove: 0.001,
          },
          // Pin percent markets to a fixed 0–100 range so the custom gridlines align.
          ...(isPercentScale ? { autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }) } : {}),
        });
        lineSeries.setData(outcomeData.data);
        seriesInstances.push({
          data: outcomeData,
          color: outcomeData.outcome.color,
          api: lineSeries,
        });
      }
    }

    // Default view: show the full series but leave a small margin on the right so
    // the terminal dot marker isn't clipped by the chart's right edge. The offset is
    // proportional to the point count so the margin stays consistent across periods.
    const maxDataLength = Math.max(0, ...seriesInstances.map(({ data }) => data.data.length));
    if (maxDataLength > 0) {
      const rightOffsetBars = Math.max(1, Math.round(maxDataLength * 0.025));
      chart.timeScale().setVisibleLogicalRange({ from: 0, to: maxDataLength - 1 + rightOffsetBars });
    } else {
      chart.timeScale().fitContent();
    }

    // Custom overlay: 0/25/50/75/100% gridlines + labels (percent markets only),
    // and a white-center terminal dot at each visible line's latest point.
    const renderMarkers = () => {
      const container = markersRef.current;
      if (!container) return;
      const timeScale = chart.timeScale();
      const parts: string[] = [];

      if (isPercentScale && seriesInstances.length > 0) {
        const refApi = seriesInstances[0].api;
        for (const pct of [100, 75, 50, 25, 0]) {
          const gy = refApi.priceToCoordinate(pct);
          if (gy === null) continue;
          parts.push(
            `<span style="position:absolute;left:0;right:0;top:${gy}px;height:1px;background:var(--border-2);"></span>`,
          );
          parts.push(
            `<span style="position:absolute;right:0;top:${gy}px;transform:translateY(-50%);padding-left:6px;background:var(--surface);font-family:'Geist Mono',ui-monospace,monospace;font-size:10px;font-weight:500;color:var(--ink-4);font-variant-numeric:tabular-nums;">${pct}%</span>`,
          );
        }
      }

      for (const { data, color, api } of seriesInstances) {
        const last = data.data[data.data.length - 1];
        if (!last) continue;
        const x = timeScale.timeToCoordinate(last.time);
        const y = api.priceToCoordinate(last.value);
        if (x === null || y === null) continue;
        // Outer translucent halo + solid core + white inner dot (seerbeta marker).
        parts.push(
          `<span style="position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;background:${color};opacity:0.25;"></span>`,
        );
        parts.push(
          `<span style="position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);width:8px;height:8px;border-radius:50%;background:${color};opacity:0.85;"></span>`,
        );
        parts.push(
          `<span style="position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);width:4px;height:4px;border-radius:50%;background:var(--surface);"></span>`,
        );
      }
      container.innerHTML = parts.join("");
    };
    chart.timeScale().subscribeVisibleTimeRangeChange(renderMarkers);

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
    // markers need a frame for coordinates to be available
    const raf = requestAnimationFrame(renderMarkers);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);

      chart.remove();
    };
  }, [series, Array.from(visibleOutcomes).join(",")]);

  return (
    <div className="mt-6 flex size-full flex-col relative">
      <div className="relative overflow-hidden">
        <div ref={chartContainerRef} />
        <div ref={markersRef} className="absolute inset-0 pointer-events-none z-[5] overflow-hidden" />
      </div>
      <Legend
        outcomesData={series}
        visibleOutcomes={visibleOutcomes}
        onToggleOutcome={handleToggleOutcome}
        market={market}
      />
      {tooltipData && (
        <div
          className="absolute bg-base-100 border border-[var(--border)] rounded-lg shadow-lg p-3 z-10 pointer-events-none"
          style={{
            left: `${tooltipData.x + 10}px`,
            top: `${tooltipData.y - 10}px`,
            transform: "translateY(-100%)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div className="text-sm text-base-content mb-2">
            {format(new Date(tooltipData.time * 1000), "MMM d, yyyy HH:mm")}
          </div>
          <div className="space-y-1">
            {tooltipData.values.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm">{item.name}:</span>
                <span className="text-sm text-gray-700">{item.value.toFixed(market.type === "Futarchy" ? 3 : 2)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketChart;

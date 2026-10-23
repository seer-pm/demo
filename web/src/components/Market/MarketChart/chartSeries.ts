import type { ChartData } from "@/hooks/chart/utils";
import { INVALID_RESULT_OUTCOME_TEXT, Market, MarketTypes, getMarketType } from "@seer-pm/sdk";

/**
 * Pale tints and violets sit at the end. A pale line or meter barely shows on a white surface, and
 * the selected outcome row is drawn in the brand violet, so a violet series would read as selected.
 */
export const CHART_COLORS = [
  "#36b8a0",
  "#e5a653",
  "#e27d9b",
  "#42d4f4",
  "#9A6324",
  "#469990",
  "#FF6F61",
  "#6B7280",
  "#FBBF24",
  "#34D399",
  "#3B82F6",
  "#EC4899",
  "#F97316",
  "#22D3EE",
  "#84CC16",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#06B6D4",
  "#D97706",
  "#14B8A6",
  "#F87171",
  "#4ADE80",
  "#2563EB",
  "#0EA5E9",
  "#EF6C00",
  "#2DD4BF",
  "#DC2626",
  "#22C55E",
  "#1D4ED8",
  "#EAB308",
  "#0891B2",
  "#C2410C",
  "#B91C1C",
  "#16A34A",
  "#1E40AF",
  "#0E7490",
  "#991B1B",
  "#15803D",
  "#1E3A8A",
  "#B45309",
  "#7F1D1D",
  "#047857",
  "#a275ef",
  "#dcbeff",
  "#fabed4",
  "#ffe119",
  "#A855F7",
  "#6366F1",
  "#8B5CF6",
  "#7C3AED",
  "#A78BFA",
  "#7E22CE",
  "#9333EA",
  "#6D28D9",
  "#6B21A8",
];

/** Yes and No keep the hues of the check and cross icons they carry, whichever side leads. */
const YES_NO_COLORS = new Map([
  ["yes", "#16A34A"],
  ["no", "#DC2626"],
]);

export const CHART_OPTION_PERIODS = {
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

export type ChartOptionPeriod = keyof typeof CHART_OPTION_PERIODS;

export function getSeries(market: Market, chartData: ChartData["chartData"]) {
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

/**
 * A Yes/No pair takes `YES_NO_COLORS`; any other series takes the colour at its position in
 * `getSeries`, so the leader is always the first colour. Lists that name the same outcomes read their
 * colour from here to stay in step with the chart.
 */
export function getSeriesColors(market: Market, chartData: ChartData["chartData"]): Record<string, string> {
  const series = getSeries(market, chartData);
  const isYesNo = series.length === 2 && series.every((serie) => YES_NO_COLORS.has(serie.name.toLowerCase()));
  return Object.fromEntries(
    series.map((serie, index) => [
      serie.name,
      isYesNo ? YES_NO_COLORS.get(serie.name.toLowerCase())! : CHART_COLORS[index % CHART_COLORS.length],
    ]),
  );
}

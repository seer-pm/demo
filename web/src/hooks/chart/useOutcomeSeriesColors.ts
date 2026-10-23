import { CHART_OPTION_PERIODS, getSeriesColors } from "@/components/Market/MarketChart/chartSeries";
import type { Market } from "@seer-pm/sdk";
import { useMemo } from "react";
import { useChartData } from "./useChartData";

/**
 * Chart colour per outcome name. It reads the chart's default period, which shares the chart's query
 * cache entry. Series rank by their latest point, so every period that ends now colours them the same.
 */
export function useOutcomeSeriesColors(market: Market): Record<string, string> {
  const { dayCount, interval } = CHART_OPTION_PERIODS.All;
  const { data } = useChartData(market, dayCount, interval, undefined);
  return useMemo(() => getSeriesColors(market, data?.chartData ?? []), [market, data]);
}

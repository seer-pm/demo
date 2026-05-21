import { isUndefined } from "@/lib/utils";
import type { SupportedChain } from "@seer-pm/sdk";
import { Market, type PoolHourDatasSets, fetchChartData } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import type { ChartData } from "./utils";
import { buildChartData } from "./utils";

export { fetchChartData } from "@seer-pm/sdk";

const getUseChartDataKey = (
  chainId: SupportedChain,
  marketId: Address,
  dayCount: number,
  intervalSeconds: number,
  endDate: Date | undefined,
) => ["useChartData", chainId, marketId, dayCount, intervalSeconds, endDate || "latest"];

export const getUsePoolHourDataSetsKey = (chainId: SupportedChain, marketId: Address) => [
  "usePoolHourDataSets",
  chainId,
  marketId,
];

const usePoolHourDataSets = (market: Market) => {
  return useQuery<PoolHourDatasSets | undefined, Error>({
    enabled: !!market,
    queryKey: getUsePoolHourDataSetsKey(market.chainId, market.id),
    retry: false,
    queryFn: async () => fetchChartData(market),
    refetchOnMount: "always",
  });
};

export const useChartData = (market: Market, dayCount: number, intervalSeconds: number, endDate: Date | undefined) => {
  const { data: poolHourDataSets } = usePoolHourDataSets(market);
  return useQuery<ChartData | undefined, Error>({
    enabled: !isUndefined(poolHourDataSets),
    queryKey: [
      ...getUseChartDataKey(market.chainId, market.id, dayCount, intervalSeconds, endDate),
      JSON.stringify(Array.isArray(poolHourDataSets) ? poolHourDataSets.map((x) => x.length) : poolHourDataSets),
    ],
    retry: false,
    queryFn: async () => await buildChartData(market, poolHourDataSets!, dayCount, intervalSeconds, endDate),
  });
};

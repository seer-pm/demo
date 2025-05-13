import { SupportedChain } from "@/lib/chains";
import { isUndefined } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { Market } from "../useMarket";
import { PoolHourDatasSets, filterChartData } from "./utils";

export type ChartData = {
  chartData: {
    name: string;
    type: string;
    data: number[][];
  }[];
  timestamps: number[];
};

export async function fetchPoolHourDataSets(market: Market) {
  const params = new URLSearchParams();
  params.append("marketId", market.id);
  params.append("chainId", market.chainId.toString());

  return fetch(`/.netlify/functions/market-chart?${params.toString()}`).then((res) => res.json());
}

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

export const usePoolHourDataSets = (market: Market) => {
  return useQuery<PoolHourDatasSets | undefined, Error>({
    enabled: !!market,
    queryKey: getUsePoolHourDataSetsKey(market.chainId, market.id),
    retry: false,
    queryFn: async () => fetchPoolHourDataSets(market),
    refetchOnMount: "always",
  });
};

export const useChartData = (market: Market, dayCount: number, intervalSeconds: number, endDate: Date | undefined) => {
  const { data: poolHourDataSets } = usePoolHourDataSets(market);
  return useQuery<ChartData | undefined, Error>({
    enabled: !isUndefined(poolHourDataSets),
    queryKey: [
      ...getUseChartDataKey(market.chainId, market.id, dayCount, intervalSeconds, endDate),
      JSON.stringify((poolHourDataSets as PoolHourDatasSets | undefined)?.map((x) => x.length) ?? []),
    ],
    retry: false,
    queryFn: async () => await filterChartData(market, poolHourDataSets!, dayCount, intervalSeconds, endDate),
  });
};

export async function fetchFullChartData(market: Market) {
  const poolHourDataSets = await fetchPoolHourDataSets(market);
  return await filterChartData(market, poolHourDataSets!, 365 * 10, 60 * 60 * 24, undefined);
}

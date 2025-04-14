import { SupportedChain } from "@/lib/chains";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { Market } from "../useMarket";

export type ChartData = {
  chartData: {
    name: string;
    type: string;
    data: number[][];
  }[];
  timestamps: number[];
};

export async function fetchChartData(
  market: Market,
  dayCount: number,
  intervalSeconds: number,
  endDate: Date | undefined,
) {
  const params = new URLSearchParams();
  params.append("marketId", market.id);
  params.append("chainId", market.chainId.toString());
  params.append("dayCount", dayCount.toString());
  params.append("intervalSeconds", intervalSeconds.toString());

  if (endDate) {
    params.append("endDate", Math.floor(endDate.getTime() / 1000).toString());
  }

  return fetch(`/.netlify/functions/market-chart?${params.toString()}`).then((res) => res.json());
}

export const getUseChartDataKey = (
  chainId: SupportedChain,
  marketId: Address,
  dayCount: number,
  intervalSeconds: number,
  endDate: Date | undefined,
) => ["useChartData", chainId, marketId, dayCount, intervalSeconds, endDate || "latest"];

export const useChartData = (market: Market, dayCount: number, intervalSeconds: number, endDate: Date | undefined) => {
  return useQuery<
    | {
        chartData: {
          name: string;
          type: string;
          data: number[][];
        }[];
        timestamps: number[];
      }
    | undefined,
    Error
  >({
    enabled: !!market,
    queryKey: getUseChartDataKey(market.chainId, market.id, dayCount, intervalSeconds, endDate),
    retry: false,
    queryFn: async () => fetchChartData(market, dayCount, intervalSeconds, endDate),
  });
};

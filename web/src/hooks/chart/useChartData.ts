import { useQuery } from "@tanstack/react-query";
import { Market } from "../useMarket";
import { getChartData } from "./getChartData";

export const useChartData = (market: Market, dayCount: number, intervalSeconds: number) => {
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
    gcTime: 1000 * 60 * 60 * 24, //24 hours
    staleTime: 0,
    queryKey: ["useChartData", market.chainId, market.id, dayCount, intervalSeconds],
    retry: false,
    queryFn: async () => getChartData(market, dayCount, intervalSeconds),
  });
};

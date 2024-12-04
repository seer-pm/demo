import { COLLATERAL_TOKENS } from "@/lib/config";
import { useQuery } from "@tanstack/react-query";
import { zeroAddress } from "viem";
import { Market } from "../useMarket";
import { useTokenInfo } from "../useTokenInfo";
import { getOddChart } from "./getOddChart";

export const useOddChartData = (market: Market, dayCount: number, intervalSeconds: number) => {
  const { data: parentCollateral } = useTokenInfo(
    market.parentMarket !== zeroAddress ? market.collateralToken : undefined,
    market.chainId,
  );
  const collateralToken = parentCollateral || COLLATERAL_TOKENS[market.chainId].primary;

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
    queryKey: ["useOddChartData", market.chainId, market.id, collateralToken, dayCount, intervalSeconds],
    retry: false,
    queryFn: async () => getOddChart(market, collateralToken, dayCount, intervalSeconds),
  });
};

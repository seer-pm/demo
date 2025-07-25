import { Market, getLiquidityPair } from "@/lib/market";
import { useQuery } from "@tanstack/react-query";
import { PoolInfo } from "../useMarketPools";
import { getPoolAndTicksData } from "./getTicksData";

export const useTicksData = (market: Market, outcomeTokenIndex: number) => {
  return useQuery<
    | {
        [key: string]: {
          ticks: {
            tickIdx: string;
            liquidityNet: string;
          }[];
          poolInfo: PoolInfo;
        };
      }
    | undefined,
    Error
  >({
    queryKey: ["useTicksData", market.id, outcomeTokenIndex],
    queryFn: async () => {
      const { token0, token1 } = getLiquidityPair(market, outcomeTokenIndex);
      return await getPoolAndTicksData(market.chainId, token0, token1);
    },
  });
};

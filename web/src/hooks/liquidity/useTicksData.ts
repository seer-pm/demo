import { getLiquidityPair } from "@/lib/market";
import { Market } from "@/lib/market";
import { useQuery } from "@tanstack/react-query";
import { getTicksData } from "./getTicksData";

export const useTicksData = (market: Market, outcomeTokenIndex: number) => {
  return useQuery<
    | {
        [key: string]: {
          tickIdx: string;
          liquidityNet: string;
        }[];
      }
    | undefined,
    Error
  >({
    queryKey: ["useTicksData", market.id, outcomeTokenIndex],
    queryFn: async () => {
      const { token0, token1 } = getLiquidityPair(market, outcomeTokenIndex);
      return await getTicksData(market.chainId, token0, token1);
    },
  });
};

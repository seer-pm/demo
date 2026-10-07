import { isTwoStringsEqual } from "@/lib/utils";
import { PoolInfo } from "@seer-pm/react";
import { Market, getLiquidityPair, getToken0Token1 } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import { Address, zeroAddress } from "viem";
import { useConfig } from "wagmi";
import { getPoolAndTicksData } from "./getTicksData";

/**
 * Ticks of the pool the outcome trades in. `collateral` selects the pair: a child outcome may be swapped
 * against the main collateral instead of the parent token, and the price impact must come from that pool.
 * Anything else resolves to the market pair, so every caller on a root market (where the swap collateral
 * can be xDAI or DAI, which have no pool of their own) shares one query and one GetTicks fetch per pool.
 */
export const useTicksData = (market: Market, outcomeTokenIndex: number, collateral?: Address) => {
  const config = useConfig();
  const isChildMarket = market.type === "Generic" && market.parentMarket.id !== zeroAddress;
  const pairCollateral =
    isChildMarket && collateral && !isTwoStringsEqual(collateral, market.collateralToken)
      ? (collateral.toLowerCase() as Address)
      : undefined;
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
    queryKey: ["useTicksData", market.id, outcomeTokenIndex, pairCollateral],
    queryFn: async () => {
      const { token0, token1 } = pairCollateral
        ? getToken0Token1(market.wrappedTokens[outcomeTokenIndex], pairCollateral)
        : getLiquidityPair(market, outcomeTokenIndex);
      return await getPoolAndTicksData(market.chainId, token0, token1, config);
    },
  });
};

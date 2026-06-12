import { isTwoStringsEqual } from "@/lib/utils";
import { Market, getVolumeUntilPrice, tickToPrice } from "@seer-pm/sdk";
import { Address } from "viem";
import { useTicksData } from "./useTicksData";

export { getVolumeUntilPrice } from "@seer-pm/sdk";

export function useVolumeUntilPrice(
  market: Market,
  outcome: Address,
  swapType: "buy" | "sell",
  targetPrice: number | undefined,
) {
  const { data: ticksByPool } = useTicksData(
    market,
    market.wrappedTokens.findIndex((x) => isTwoStringsEqual(x, outcome)),
  );
  if (!ticksByPool || !targetPrice || targetPrice > 1 || targetPrice < 0) {
    return;
  }

  const { ticks, poolInfo } = Object.values(ticksByPool)[0];
  const currentPrice = Number(tickToPrice(poolInfo.tick)[isTwoStringsEqual(poolInfo.token0, outcome) ? 0 : 1]);
  if (currentPrice === targetPrice) {
    return;
  }
  return getVolumeUntilPrice(poolInfo, ticks, targetPrice, outcome, swapType);
}

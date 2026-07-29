import { isTwoStringsEqual } from "@/lib/utils";
import { Market, getPriceFromVolume } from "@seer-pm/sdk";
import { Address } from "viem";
import { pickPoolForVolume } from "./pickPoolForVolume";
import { useTicksData } from "./useTicksData";

export { getPriceFromVolume } from "@seer-pm/sdk";

export function usePriceFromVolume(
  market: Market,
  outcome: Address,
  swapType: "buy" | "sell",
  targetVolume: number | undefined,
) {
  const { data: ticksByPool } = useTicksData(
    market,
    market.wrappedTokens.findIndex((x) => isTwoStringsEqual(x, outcome)),
  );

  if (!ticksByPool || !targetVolume || targetVolume <= 0) {
    return;
  }

  const pool = pickPoolForVolume(ticksByPool);
  if (!pool) {
    return;
  }

  const { ticks, poolInfo } = pool;
  return getPriceFromVolume(poolInfo, ticks, targetVolume, outcome, swapType);
}

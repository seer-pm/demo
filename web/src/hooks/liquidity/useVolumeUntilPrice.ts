import { SupportedChain } from "@/lib/chains";
import { Market } from "@/lib/market";
import { isTwoStringsEqual } from "@/lib/utils";
import { Price, Token } from "@uniswap/sdk-core";
import { TickMath, priceToClosestTick } from "@uniswap/v3-sdk";
import { Address, formatUnits } from "viem";
import { useTicksData } from "./useTicksData";

function getTargetTickFromPrice(
  price: number,
  token0Address: Address,
  token1Address: Address,
  isOutcomeToken0: boolean,
  chainId: SupportedChain,
): number {
  const token0 = new Token(chainId, token0Address, 18);
  const token1 = new Token(chainId, token1Address, 18);
  const p = new Price(
    isOutcomeToken0 ? token0 : token1,
    isOutcomeToken0 ? token1 : token0,
    1e6, // baseAmount
    Math.floor(price * 1e6), // quoteAmount
  );
  return priceToClosestTick(p);
}

export function getVolumeUntilPrice(
  pool: {
    liquidity: bigint;
    tickSpacing: number;
    tick: number;
    token0: Address;
    token1: Address;
  },
  ticks: { liquidityNet: string; tickIdx: string }[],
  targetPrice: number, // decimal price (not sqrtPriceX96)
  outcome: Address,
  chainId: SupportedChain,
  swapType: "buy" | "sell",
): number {
  const isOutcomeToken0 = isTwoStringsEqual(pool.token0, outcome);
  const targetTick = getTargetTickFromPrice(targetPrice, pool.token0, pool.token1, isOutcomeToken0, chainId);
  let currentLiquidity = pool.liquidity;
  let currentHighTick = pool.tick;
  let currentLowTick = pool.tick;
  let totalVolumeBuy = 0;
  let totalVolumeSell = 0;

  const mappedTicks = [...ticks.map((t) => ({ ...t, tickIdx: Number(t.tickIdx) }))];

  // ✅ Push target tick if missing
  if (!mappedTicks.some((t) => t.tickIdx === targetTick)) {
    mappedTicks.push({ tickIdx: targetTick, liquidityNet: "0" });
  }
  const higherTicks = mappedTicks
    .filter((t) => t.tickIdx > pool.tick && t.tickIdx <= targetTick)
    .sort((a, b) => a.tickIdx - b.tickIdx);
  const lowerTicks = mappedTicks
    .filter((t) => t.tickIdx < pool.tick && t.tickIdx >= targetTick)
    .sort((a, b) => a.tickIdx - b.tickIdx);

  for (let i = 0; i < higherTicks.length; i++) {
    currentLiquidity = currentLiquidity + BigInt(higherTicks[i - 1]?.liquidityNet ?? 0);
    const sqrtP = BigInt(TickMath.getSqrtRatioAtTick(currentHighTick).toString());
    const sqrtB = BigInt(TickMath.getSqrtRatioAtTick(Number(higherTicks[i].tickIdx)).toString());

    const amount0 = (currentLiquidity * 2n ** 96n * (sqrtB - sqrtP)) / (sqrtB * sqrtP);
    const amount1Need = (currentLiquidity * (sqrtB - sqrtP)) / 2n ** 96n;

    totalVolumeBuy += isOutcomeToken0 ? Number(formatUnits(amount0, 18)) : 0;
    totalVolumeSell += isOutcomeToken0 ? 0 : Number(formatUnits(amount1Need, 18));
    currentHighTick = Number(higherTicks[i].tickIdx);
  }
  currentLiquidity = pool.liquidity;
  for (let i = lowerTicks.length - 1; i > -1; i--) {
    currentLiquidity = currentLiquidity - BigInt(lowerTicks[i + 1]?.liquidityNet ?? 0);
    const sqrtA = BigInt(TickMath.getSqrtRatioAtTick(Number(lowerTicks[i].tickIdx)).toString());
    const sqrtP = BigInt(TickMath.getSqrtRatioAtTick(currentLowTick).toString());
    const amount1 = (currentLiquidity * (sqrtP - sqrtA)) / 2n ** 96n;
    const amount0Need = ((currentLiquidity * 2n ** 96n * (sqrtA - sqrtP)) / (sqrtA * sqrtP)) * -1n;
    totalVolumeBuy += isOutcomeToken0 ? 0 : Number(formatUnits(amount1, 18));
    totalVolumeSell += isOutcomeToken0 ? Number(formatUnits(amount0Need, 18)) : 0;
    currentLowTick = Number(lowerTicks[i].tickIdx);
  }
  return swapType === "buy" ? totalVolumeBuy : totalVolumeSell;
}

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
  return getVolumeUntilPrice(poolInfo, ticks, targetPrice, outcome, market.chainId, swapType);
}

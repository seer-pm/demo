import { SupportedChain } from "@/lib/chains";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { TickMath } from "@uniswap/v3-sdk";
import { Address, formatUnits } from "viem";
import { gnosis } from "viem/chains";
import { GetTicksQuery, OrderDirection, Tick_OrderBy, getSdk as getSwaprSdk } from "../queries/gql-generated-swapr";
import { getSdk as getUniswapSdk } from "../queries/gql-generated-uniswap";
import { getPools } from "../useMarketPools";
async function getTicks(chainId: SupportedChain, poolId: string) {
  const graphQLClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);

  if (!graphQLClient) {
    throw new Error("Subgraph not available");
  }

  const graphQLSdk = chainId === gnosis.id ? getSwaprSdk : getUniswapSdk;
  let total: GetTicksQuery["ticks"] = [];
  let attempt = 1;
  let tickIdx = "";
  while (true) {
    const { ticks } = await graphQLSdk(graphQLClient).GetTicks({
      first: 1000,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderBy: Tick_OrderBy.TickIdx as any,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderDirection: OrderDirection.Asc as any,
      where: {
        poolAddress: poolId,
        liquidityNet_not: "0",
        ...(tickIdx && { tickIdx_gt: tickIdx }),
      },
    });
    total = total.concat(ticks);
    tickIdx = ticks[ticks.length - 1]?.tickIdx;
    attempt++;
    if (ticks.length < 1000) {
      break;
    }
  }
  return total;
}

export async function getLiquidityChart(chainId: SupportedChain, token0: Address, token1: Address) {
  try {
    const pools = await getPools(chainId).fetch({ token0, token1 });

    const ticksByPool = await Promise.all(pools.map((pool) => getTicks(chainId, pool.id)));
    const amounts = ticksByPool.map((ticks, index) => {
      const pool = pools[index];
      const higherTicks = ticks.filter((tick) => Number(tick.tickIdx) > pool.tick);
      const lowerTicks = ticks.filter((tick) => Number(tick.tickIdx) < pool.tick);
      let currentLiquidity = pool.liquidity;
      let currentHighTick = pool.tick;
      let currentLowTick = pool.tick;
      const rangeMapping: {
        [key: string]: {
          amount0: number;
          amount1: number;
          activeLiquidity: bigint;
          currentTick: number;
        };
      } = {};
      const price0List = lowerTicks
        .map((t) => t.price0)
        .concat(pool.token1Price.toString())
        .concat(higherTicks.map((t) => t.price0))
        .map((x) => Number(x).toFixed(4));
      const price1List = lowerTicks
        .map((t) => t.price1)
        .concat(pool.token0Price.toString())
        .concat(higherTicks.map((t) => t.price1))
        .map((x) => Number(x).toFixed(4));
      for (let i = 0; i < higherTicks.length; i++) {
        currentLiquidity = currentLiquidity + BigInt(higherTicks[i - 1]?.liquidityNet ?? 0);
        const sqrtP = BigInt(TickMath.getSqrtRatioAtTick(currentHighTick).toString());
        const sqrtB = BigInt(TickMath.getSqrtRatioAtTick(Number(higherTicks[i].tickIdx)).toString());

        const amount0 = (currentLiquidity * 2n ** 96n * (sqrtB - sqrtP)) / (sqrtB * sqrtP);
        rangeMapping[`${currentHighTick}-${Number(higherTicks[i].tickIdx)}`] = {
          amount0: Number(formatUnits(amount0, 18)),
          amount1: 0,
          activeLiquidity: currentLiquidity,
          currentTick: currentHighTick,
        };
        currentHighTick = Number(higherTicks[i].tickIdx);
      }
      currentLiquidity = pool.liquidity;
      for (let i = lowerTicks.length - 1; i > -1; i--) {
        currentLiquidity = currentLiquidity - BigInt(lowerTicks[i + 1]?.liquidityNet ?? 0);
        const sqrtA = BigInt(TickMath.getSqrtRatioAtTick(Number(lowerTicks[i].tickIdx)).toString());
        const sqrtP = BigInt(TickMath.getSqrtRatioAtTick(currentLowTick).toString());
        const amount1 = (currentLiquidity * (sqrtP - sqrtA)) / 2n ** 96n;
        rangeMapping[`${Number(lowerTicks[i].tickIdx)}-${currentLowTick}`] = {
          amount1: Number(formatUnits(amount1, 18)),
          amount0: 0,
          activeLiquidity: currentLiquidity,
          currentTick: Number(lowerTicks[i].tickIdx),
        };
        currentLowTick = Number(lowerTicks[i].tickIdx);
      }
      const [amount0List, amount1List] = Object.values(rangeMapping)
        .sort((a, b) => Number(a.currentTick) - Number(b.currentTick))
        .reduce(
          (acc, curr) => {
            acc[0].push(curr.amount0);
            acc[1].push(curr.amount1);
            return acc;
          },
          [[], []] as number[][],
        );

      return {
        price0List,
        price1List,
        amount0List,
        amount1List,
      };
    });
    return pools.reduce(
      (acc, curr, index) => {
        acc[curr.id] = amounts[index];
        return acc;
      },
      {} as {
        [key: string]: { price0List: string[]; price1List: string[]; amount0List: number[]; amount1List: number[] };
      },
    );
  } catch (e) {
    console.log(e);
  }
}

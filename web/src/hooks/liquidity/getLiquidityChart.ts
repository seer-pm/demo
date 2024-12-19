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
        // liquidityNet_not: "0",
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
          nextTick: number;
          amount0Need: number;
          amount1Need: number;
        };
      } = {};
      for (let i = 0; i < higherTicks.length; i++) {
        currentLiquidity = currentLiquidity + BigInt(higherTicks[i - 1]?.liquidityNet ?? 0);
        if (currentLiquidity === 0n) {
          continue;
        }
        const sqrtP = BigInt(TickMath.getSqrtRatioAtTick(currentHighTick).toString());
        const sqrtB = BigInt(TickMath.getSqrtRatioAtTick(Number(higherTicks[i].tickIdx)).toString());

        const amount0 = (currentLiquidity * 2n ** 96n * (sqrtB - sqrtP)) / (sqrtB * sqrtP);
        const amount1Need = (currentLiquidity * (sqrtB - sqrtP)) / 2n ** 96n;

        rangeMapping[`${currentHighTick}-${Number(higherTicks[i].tickIdx)}`] = {
          amount0: Number(formatUnits(amount0, 18)),
          amount1: 0,
          amount0Need: 0,
          amount1Need: Number(formatUnits(amount1Need, 18)),
          activeLiquidity: currentLiquidity,
          currentTick: currentHighTick,
          nextTick: Number(higherTicks[i].tickIdx),
        };
        currentHighTick = Number(higherTicks[i].tickIdx);
      }
      currentLiquidity = pool.liquidity;
      for (let i = lowerTicks.length - 1; i > -1; i--) {
        currentLiquidity = currentLiquidity - BigInt(lowerTicks[i + 1]?.liquidityNet ?? 0);
        if (currentLiquidity === 0n) {
          continue;
        }
        const sqrtA = BigInt(TickMath.getSqrtRatioAtTick(Number(lowerTicks[i].tickIdx)).toString());
        const sqrtP = BigInt(TickMath.getSqrtRatioAtTick(currentLowTick).toString());
        const amount1 = (currentLiquidity * (sqrtP - sqrtA)) / 2n ** 96n;
        const amount0Need = ((currentLiquidity * 2n ** 96n * (sqrtA - sqrtP)) / (sqrtA * sqrtP)) * -1n;
        rangeMapping[`${Number(lowerTicks[i].tickIdx)}-${currentLowTick}`] = {
          amount1: Number(formatUnits(amount1, 18)),
          amount0: 0,
          amount0Need: Number(formatUnits(amount0Need, 18)),
          amount1Need: 0,
          activeLiquidity: currentLiquidity,
          currentTick: Number(lowerTicks[i].tickIdx),
          nextTick: currentLowTick,
        };
        currentLowTick = Number(lowerTicks[i].tickIdx);
      }
      const [amount0List, amount1List, amount0NeedList, amount1NeedList] = Object.values(rangeMapping)
        .sort((a, b) => Number(a.currentTick) - Number(b.currentTick))
        .reduce(
          (acc, curr) => {
            acc[0].push(curr.amount0);
            acc[1].push(curr.amount1);
            acc[2].push(curr.amount0Need);
            acc[3].push(curr.amount1Need);
            return acc;
          },
          [[], [], [], []] as number[][],
        );
      const tickToPriceMapping = ticks.reduce(
        (acc, curr) => {
          acc[curr.tickIdx] = { price0: Number(curr.price0).toFixed(4), price1: Number(curr.price1).toFixed(4) };
          return acc;
        },
        {} as { [key: string]: { price0: string; price1: string } },
      );
      console.log(tickToPriceMapping);
      const sortedTickIndices = [
        ...new Set(
          Object.values(rangeMapping).reduce((acc, curr) => {
            acc.push(curr.currentTick);
            acc.push(curr.nextTick);
            return acc;
          }, [] as number[]),
        ),
      ].sort((a, b) => a - b);
      const price0List = sortedTickIndices.map(
        (tickIdx) => tickToPriceMapping[tickIdx.toString()]?.price0 ?? pool.token1Price.toFixed(4),
      );
      const price1List = sortedTickIndices.map(
        (tickIdx) => tickToPriceMapping[tickIdx.toString()]?.price1 ?? pool.token0Price.toFixed(4),
      );
      return {
        price0List,
        price1List,
        amount0List,
        amount1List,
        amount0NeedList,
        amount1NeedList,
      };
    });
    return pools.reduce(
      (acc, curr, index) => {
        acc[curr.id] = amounts[index];
        return acc;
      },
      {} as {
        [key: string]: {
          price0List: string[];
          price1List: string[];
          amount0List: number[];
          amount1List: number[];
          amount0NeedList: number[];
          amount1NeedList: number[];
        };
      },
    );
  } catch (e) {
    console.log(e);
  }
}

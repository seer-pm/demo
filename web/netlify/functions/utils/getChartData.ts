import { PoolHourDatasSets } from "@/hooks/chart/utils";
import { tickToPrice } from "@/hooks/liquidity/utils";
import {
  GetPoolHourDatasQuery,
  GetSwapsQuery,
  OrderDirection,
  PoolHourData_OrderBy,
  Swap_OrderBy,
  GetPoolHourDatasDocument as SwaprGetPoolHourDatasDocument,
  GetPoolHourDatasQuery as SwaprGetPoolHourDatasQuery,
} from "@/hooks/queries/gql-generated-swapr";
import { getSdk as getSwaprSdk } from "@/hooks/queries/gql-generated-swapr";
import {
  GetPoolHourDatasDocument as UniswapGetPoolHourDatasDocument,
  GetPoolHourDatasQuery as UniswapGetPoolHourDatasQuery,
} from "@/hooks/queries/gql-generated-uniswap";
import { getSdk as getUniswapSdk } from "@/hooks/queries/gql-generated-uniswap";
import { SupportedChain } from "@/lib/chains";
import { Market } from "@/lib/market";
import { Token0Token1, getMarketPoolsPairs } from "@/lib/market";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { TickMath } from "@uniswap/v3-sdk";
import combineQuery from "graphql-combine-query";
import { gnosis } from "viem/chains";

async function getLastNotEmptyStartTime(poolsPairs: Token0Token1[], chainId: SupportedChain, startTime: number) {
  if (poolsPairs.length === 0) {
    return [];
  }
  const graphQLClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);

  if (!graphQLClient) {
    throw new Error("Subgraph not available");
  }

  const GetPoolHourDatasDocument =
    chainId === gnosis.id ? SwaprGetPoolHourDatasDocument : UniswapGetPoolHourDatasDocument;

  const { document, variables } = combineQuery("GetPoolHourDatas").addN(
    GetPoolHourDatasDocument,
    poolsPairs.map((poolPairs) => {
      return {
        first: 1,
        orderBy: PoolHourData_OrderBy.PeriodStartUnix,
        orderDirection: OrderDirection.Desc,
        where: {
          and: [
            { or: [{ liquidity_not: "0" }, { pool_: { liquidity_not: "0" } }] },
            {
              pool_: poolPairs,
              periodStartUnix_lte: startTime,
              periodStartUnix_gte: startTime - 60 * 60 * 24 * 30, // add this to improve query time
            },
          ],
        },
      };
    }),
  );

  if (chainId === gnosis.id) {
    const result = Object.values(
      await graphQLClient.request<Record<string, SwaprGetPoolHourDatasQuery["poolHourDatas"]>>(document, variables),
    );
    return result.map((x) => x[0]?.periodStartUnix);
  }
  const result = Object.values(
    await graphQLClient.request<Record<string, UniswapGetPoolHourDatasQuery["poolHourDatas"]>>(document, variables),
  );
  return result.map((x) => x[0]?.periodStartUnix);
}

async function getSwapsByToken(
  poolPairs: Token0Token1,
  initialStartTime: number,
  chainId: SupportedChain,
): Promise<GetSwapsQuery["swaps"]> {
  const graphQLClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);

  if (!graphQLClient) {
    throw new Error("Subgraph not available");
  }

  const graphQLSdk = chainId === gnosis.id ? getSwaprSdk : getUniswapSdk;
  let total: GetSwapsQuery["swaps"] = [];
  const maxAttempts = 20;
  let attempt = 1;
  let startTime = initialStartTime;
  while (attempt < maxAttempts) {
    const dateOperator = attempt === 1 ? "timestamp_gte" : "timestamp_gt";
    const { swaps } = await graphQLSdk(graphQLClient).GetSwaps({
      first: 1000,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderBy: Swap_OrderBy.Timestamp as any,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderDirection: OrderDirection.Asc as any,
      where: {
        pool_: poolPairs,
        [dateOperator]: startTime,
      },
    });
    total = total.concat(swaps);
    if (!swaps[swaps.length - 1]?.timestamp || Number(swaps[swaps.length - 1]?.timestamp) === startTime) {
      break;
    }
    if (swaps.length < 1000) {
      break;
    }
    startTime = Number(swaps[swaps.length - 1].timestamp);
    attempt++;
  }

  return total;
}

async function getPoolHourDatasByToken(
  poolPairs: Token0Token1,
  initialStartTime: number,
  chainId: SupportedChain,
): Promise<GetPoolHourDatasQuery["poolHourDatas"]> {
  const graphQLClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);

  if (!graphQLClient) {
    throw new Error("Subgraph not available");
  }

  const graphQLSdk = chainId === gnosis.id ? getSwaprSdk : getUniswapSdk;
  let total: GetPoolHourDatasQuery["poolHourDatas"] = [];
  const maxAttempts = 20;
  let attempt = 1;
  let startTime = initialStartTime;
  while (attempt < maxAttempts) {
    const dateOperator = attempt === 1 ? "periodStartUnix_gte" : "periodStartUnix_gt";
    const { poolHourDatas } = await graphQLSdk(graphQLClient).GetPoolHourDatas({
      first: 1000,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderBy: PoolHourData_OrderBy.PeriodStartUnix as any,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderDirection: OrderDirection.Asc as any,
      where: {
        and: [
          { or: [{ liquidity_not: "0" }, { pool_: { liquidity_not: "0" } }] },
          {
            pool_: poolPairs,
            [dateOperator]: startTime,
          },
        ],
      },
    });
    total = total.concat(poolHourDatas);
    if (poolHourDatas[poolHourDatas.length - 1]?.periodStartUnix === startTime) {
      break;
    }
    if (poolHourDatas.length < 1000) {
      break;
    }
    startTime = poolHourDatas[poolHourDatas.length - 1]?.periodStartUnix;
    attempt++;
  }

  return total;
}

async function getSwapsByTokenAsPoolHourDatas(
  poolPairs: Token0Token1,
  initialStartTime: number,
  chainId: SupportedChain,
): Promise<GetPoolHourDatasQuery["poolHourDatas"]> {
  try {
    const swaps = await getSwapsByToken(poolPairs, initialStartTime, chainId);
    return swaps.map((swap) => {
      const [token1Price, token0Price] = tickToPrice(Number(swap.tick));
      return {
        token0Price,
        token1Price,
        periodStartUnix: Number(swap.timestamp),
        sqrtPrice: TickMath.getSqrtRatioAtTick(Number(swap.tick)).toString(),
        pool: swap.pool,
      };
    }) as GetPoolHourDatasQuery["poolHourDatas"];
  } catch (e) {
    return [];
  }
}

async function getPoolHourDatas(
  poolsPairs: Token0Token1[],
  chainId: SupportedChain,
  startTime: number,
): Promise<PoolHourDatasSets> {
  if (poolsPairs.length === 0) {
    return [];
  }

  const lastNotEmptyStartTimes = await getLastNotEmptyStartTime(poolsPairs, chainId, startTime);

  return await Promise.all(
    poolsPairs.map(async (poolPairs, index) => {
      const [poolHourDatas, swaps] = await Promise.all([
        getPoolHourDatasByToken(poolPairs, lastNotEmptyStartTimes[index] ?? startTime, chainId),
        getSwapsByTokenAsPoolHourDatas(poolPairs, lastNotEmptyStartTimes[index] ?? startTime, chainId),
      ]);

      return poolHourDatas.concat(swaps).sort((a, b) => a.periodStartUnix - b.periodStartUnix);
    }),
  );
}

export async function getChartData(market: Market): Promise<PoolHourDatasSets> {
  const poolsPairs = getMarketPoolsPairs(market);

  try {
    const firstTimestamp = market.blockTimestamp || Math.floor(new Date("2024-01-01").getTime() / 1000);

    return await getPoolHourDatas(poolsPairs, market.chainId, firstTimestamp);
  } catch (e) {
    return [];
  }
}

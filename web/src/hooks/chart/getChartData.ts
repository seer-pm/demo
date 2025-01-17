import { SupportedChain } from "@/lib/chains";
import { MarketTypes, Token0Token1, getMarketEstimate, getMarketPoolsPairs, getMarketType, isOdd } from "@/lib/market";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { subDays } from "date-fns";
import combineQuery from "graphql-combine-query";
import { formatUnits } from "viem";
import { gnosis } from "viem/chains";
import {
  GetPoolHourDatasQuery,
  OrderDirection,
  PoolHourData_OrderBy,
  GetPoolHourDatasDocument as SwaprGetPoolHourDatasDocument,
  GetPoolHourDatasQuery as SwaprGetPoolHourDatasQuery,
} from "../queries/gql-generated-swapr";
import { getSdk as getSwaprSdk } from "../queries/gql-generated-swapr";
import {
  Mint_OrderBy,
  GetPoolHourDatasDocument as UniswapGetPoolHourDatasDocument,
  GetPoolHourDatasQuery as UniswapGetPoolHourDatasQuery,
} from "../queries/gql-generated-uniswap";
import { getSdk as getUniswapSdk } from "../queries/gql-generated-uniswap";
import { Market } from "../useMarket";
import { normalizeOdds } from "../useMarketOdds";
import { findClosestLessThanOrEqualToTimestamp, getNearestRoundedDownTimestamp } from "./utils";

function calculateTokenPricesFromSqrtPrice(sqrtPrice: string) {
  const sqrtPriceBigInt = BigInt(sqrtPrice);
  const token0Price = (2n ** 192n * 10n ** 18n) / (sqrtPriceBigInt * sqrtPriceBigInt);
  const token1Price = (sqrtPriceBigInt * sqrtPriceBigInt * 10n ** 18n) / 2n ** 192n;
  return { token0Price, token1Price };
}

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

  const { document, variables } = (() =>
    combineQuery("GetPoolHourDatas").addN(
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
    ))();
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

async function getPoolHourDatasByToken(
  poolPairs: Token0Token1,
  initialStartTime: number,
  lastPointBeforeStartTime: boolean,
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
    const dateOperator = lastPointBeforeStartTime
      ? "periodStartUnix_lte"
      : attempt === 1
        ? "periodStartUnix_gte"
        : "periodStartUnix_gt";
    const { poolHourDatas } = await graphQLSdk(graphQLClient).GetPoolHourDatas({
      first: lastPointBeforeStartTime ? 1 : 1000,
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

type PoolHourDatasSets = GetPoolHourDatasQuery["poolHourDatas"][];

async function getChartHourDatas(poolPairs: Token0Token1, startTime: number, endTime: number, chainId: SupportedChain) {
  let poolHourData = await getPoolHourDatasByToken(poolPairs, startTime, false, chainId);

  if (poolHourData.length > 0) {
    return poolHourData;
  }

  // If no data exists for the requested time period, fetch the last available data point before this period
  // and use it to create a constant line across the entire period
  poolHourData = await getPoolHourDatasByToken(poolPairs, startTime, true, chainId);

  if (poolHourData.length === 1) {
    poolHourData[0].periodStartUnix = startTime;
    poolHourData.push({ ...poolHourData[0], periodStartUnix: endTime });
  }

  return poolHourData;
}

async function getPoolHourDatas(
  poolsPairs: Token0Token1[],
  chainId: SupportedChain,
  startTime: number,
  endTime: number,
): Promise<PoolHourDatasSets> {
  if (poolsPairs.length === 0) {
    return [];
  }
  const lastNotEmptyStartTimes = await Promise.any([
    getLastNotEmptyStartTime(poolsPairs, chainId, startTime),
    new Promise<number[]>((resolve) => {
      setTimeout(() => {
        resolve([]);
      }, 8000);
    }),
  ]);
  return await Promise.all(
    poolsPairs.map((poolPairs, index) => {
      return getChartHourDatas(poolPairs, lastNotEmptyStartTimes[index] ?? startTime, endTime, chainId);
    }),
  );
}

function getFirstAndLastTimestamps(market: Market, interval: number, dayCount: number) {
  const lastTimestamp = getNearestRoundedDownTimestamp(Math.floor(new Date().getTime() / 1000), interval);
  let firstTimestamp = getNearestRoundedDownTimestamp(
    Math.floor(subDays(new Date(), dayCount).getTime() / 1000),
    interval,
  );

  const marketBlockTimestamp = market.blockTimestamp;

  if (marketBlockTimestamp) {
    firstTimestamp = Math.max(getNearestRoundedDownTimestamp(marketBlockTimestamp, interval), firstTimestamp);
  }

  return { firstTimestamp, lastTimestamp };
}

function getTimestamps(
  firstTimestamp: number,
  lastTimestamp: number,
  interval: number,
  latestPoolHourDataTimestamp: number,
) {
  let currentTimestamp = firstTimestamp;
  let timestamps: number[] = [];
  while (currentTimestamp <= lastTimestamp) {
    timestamps.push(currentTimestamp);
    currentTimestamp += interval;
  }

  timestamps = timestamps.filter((timestamp) => timestamp <= latestPoolHourDataTimestamp);

  if (timestamps.length) {
    timestamps = [...timestamps, latestPoolHourDataTimestamp];
  }
  return timestamps;
}

function getGenericMarketData(
  market: Market,
  timestamps: number[],
  poolsPairs: Token0Token1[],
  poolHourDatasSets: PoolHourDatasSets,
) {
  const oddsMapping = timestamps.reduce(
    (acc, timestamp) => {
      const tokenPrices = poolsPairs.map(({ token1 }, tokenIndex) => {
        const poolHourDatas = poolHourDatasSets[tokenIndex];
        const poolHourTimestamps = poolHourDatas.map((x) => x.periodStartUnix);
        const poolHourDataIndex = findClosestLessThanOrEqualToTimestamp(poolHourTimestamps, timestamp);
        let { token0Price = "0", token1Price = "0", sqrtPrice } = poolHourDatas[poolHourDataIndex] ?? {};

        if (token0Price === "0" && token1Price === "0" && sqrtPrice && sqrtPrice !== "0") {
          const { token0Price: _token0Price, token1Price: _token1Price } = calculateTokenPricesFromSqrtPrice(sqrtPrice);
          token0Price = formatUnits(_token0Price, 18);
          token1Price = formatUnits(_token1Price, 18);
        }

        return token1.toLocaleLowerCase() > market.collateralToken.toLocaleLowerCase()
          ? Number(token0Price)
          : Number(token1Price);
      });

      const odds = normalizeOdds(tokenPrices);

      if (odds.some((odd) => !isOdd(odd)) || odds.every((odd) => odd === 0)) {
        // some odd is invalid or all odds are 0
        acc[String(timestamp)] = null;
        return acc;
      }

      acc[String(timestamp)] = odds;
      return acc;
    },
    {} as { [key: string]: number[] | null },
  );

  // biome-ignore lint/style/noParameterAssign:
  timestamps = timestamps.filter((x) => oddsMapping[String(x)]);

  if (!timestamps.length) {
    return { chartData: [], timestamps: [] };
  }

  if (getMarketType(market) === MarketTypes.SCALAR) {
    const chartData = [
      {
        name: "Market Estimate",
        type: "line",
        data: timestamps.map((timestamp) => {
          const odds = oddsMapping[String(timestamp)]!;
          const marketEstimate = getMarketEstimate(odds, market);
          return [timestamp, Number(marketEstimate)];
        }),
      },
    ];

    return { chartData, timestamps };
  }

  const chartData = poolsPairs.map((_, tokenIndex) => {
    return {
      name: market.outcomes[tokenIndex],
      type: "line",
      data: timestamps.map((timestamp) => {
        const odd = oddsMapping[String(timestamp)]![tokenIndex];
        return [timestamp, Number.isNaN(odd) ? 0 : odd];
      }),
    };
  });

  return { chartData, timestamps };
}

async function getFutarchyMarketData(
  market: Market,
  timestamps: number[],
  poolsPairs: Token0Token1[],
  poolHourDatasSets: PoolHourDatasSets,
) {
  const pricesMapping = timestamps.reduce(
    (acc, timestamp) => {
      const tokenPrices = poolsPairs.map((_, tokenIndex) => {
        const poolHourDatas = poolHourDatasSets[tokenIndex];
        const poolHourTimestamps = poolHourDatas.map((x) => x.periodStartUnix);
        const poolHourDataIndex = findClosestLessThanOrEqualToTimestamp(poolHourTimestamps, timestamp);
        let { token0Price = "0", token1Price = "0", sqrtPrice } = poolHourDatas[poolHourDataIndex] ?? {};

        if (token0Price === "0" && token1Price === "0" && sqrtPrice && sqrtPrice !== "0") {
          const { token0Price: _token0Price, token1Price: _token1Price } = calculateTokenPricesFromSqrtPrice(sqrtPrice);
          token0Price = formatUnits(_token0Price, 18);
          token1Price = formatUnits(_token1Price, 18);
        }

        return tokenIndex === 1 ? Number(token0Price) : Number(token1Price);
      });

      // tokenPrices[0] is the price of YES_GNO/YES_wstETH (e.g. 1 YES_GNO = 0.079 YES_wstETH)
      const yesPrice = tokenPrices[0] > 0 ? 1 / tokenPrices[0] : 0;
      const noPrice = tokenPrices[1] > 0 ? 1 / tokenPrices[1] : 0;

      acc[String(timestamp)] = Number.isNaN(yesPrice) || Number.isNaN(noPrice) ? null : [yesPrice, noPrice];
      return acc;
    },
    {} as { [key: string]: number[] | null },
  );

  // Check if first price mapping is [0,0] and replace with initial liquidity if so
  if (timestamps.length > 0 && pricesMapping?.[timestamps[0]]?.[0] === 0 && pricesMapping?.[timestamps[0]]?.[1] === 0) {
    const initialLiquidity = await Promise.all(
      poolsPairs.map((poolPair, tokenIndex) => getInitialLiquidityPrice(market.chainId, poolPair, tokenIndex)),
    );

    if (initialLiquidity[0] > 0 || initialLiquidity[1] > 0) {
      pricesMapping[timestamps[0]] = initialLiquidity;
    }
  }

  // biome-ignore lint/style/noParameterAssign:
  timestamps = timestamps.filter((x) => pricesMapping[String(x)]);

  if (!timestamps.length) {
    return { chartData: [], timestamps: [] };
  }

  const chartData = ["Yes", "No"].map((token, tokenIndex) => {
    return {
      name: token,
      type: "line",
      data: timestamps.map((timestamp) => {
        const price = pricesMapping[String(timestamp)]![tokenIndex];
        return [timestamp, Number.isNaN(price) ? 0 : price];
      }),
    };
  });

  return { chartData, timestamps };
}

export async function getInitialLiquidityPrice(
  chainId: SupportedChain,
  poolPair: Token0Token1,
  tokenIndex: number,
): Promise<number> {
  const graphQLClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);
  if (!graphQLClient) {
    throw new Error("Subgraph not available");
  }
  const graphQLSdk = chainId === gnosis.id ? getSwaprSdk : getUniswapSdk;

  const { mints } = await graphQLSdk(graphQLClient).GetMints({
    // biome-ignore lint/suspicious/noExplicitAny:
    orderBy: Mint_OrderBy.Timestamp as any,
    // biome-ignore lint/suspicious/noExplicitAny:
    orderDirection: OrderDirection.Asc as any,
    first: 1,
    where: {
      pool_: poolPair,
    },
  });

  if (mints.length === 0) {
    return 0;
  }

  const amount0 = Number.parseFloat(mints[0].amount0);
  const amount1 = Number.parseFloat(mints[0].amount1);

  if (amount0 === 0 || amount1 === 0) {
    return 0;
  }

  const price0Per1 = amount1 / amount0;
  const price1Per0 = amount0 / amount1;
  return tokenIndex === 0 ? Number(price0Per1) : Number(price1Per0);
}

export type ChartData = {
  chartData: {
    name: string;
    type: string;
    data: number[][];
  }[];
  timestamps: number[];
};

export async function getChartData(market: Market, dayCount: number, interval: number): Promise<ChartData> {
  if (!interval) {
    return { chartData: [], timestamps: [] };
  }

  const poolsPairs = getMarketPoolsPairs(market);

  try {
    const { firstTimestamp, lastTimestamp } = getFirstAndLastTimestamps(market, interval, dayCount);

    const poolHourDatasSets = await getPoolHourDatas(poolsPairs, market.chainId, firstTimestamp, lastTimestamp);

    const latestPoolHourDataTimestamp = Math.max(...poolHourDatasSets.flat().map((x) => x.periodStartUnix));

    const timestamps = getTimestamps(firstTimestamp, lastTimestamp, interval, latestPoolHourDataTimestamp);

    return market.type === "Generic"
      ? getGenericMarketData(market, timestamps, poolsPairs, poolHourDatasSets)
      : getFutarchyMarketData(market, timestamps, poolsPairs, poolHourDatasSets);
  } catch (e) {
    return { chartData: [], timestamps: [] };
  }
}

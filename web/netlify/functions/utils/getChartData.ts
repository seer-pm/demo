import { ChartData } from "@/hooks/chart/useChartData";
import { tickToPrice } from "@/hooks/liquidity/getLiquidityChartData";
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
  Mint_OrderBy,
  GetPoolHourDatasDocument as UniswapGetPoolHourDatasDocument,
  GetPoolHourDatasQuery as UniswapGetPoolHourDatasQuery,
} from "@/hooks/queries/gql-generated-uniswap";
import { getSdk as getUniswapSdk } from "@/hooks/queries/gql-generated-uniswap";
import { Market } from "@/hooks/useMarket";
import { normalizeOdds } from "@/hooks/useMarketOdds";
import { SupportedChain } from "@/lib/chains";
import { MarketTypes, Token0Token1, getMarketEstimate, getMarketPoolsPairs, getMarketType, isOdd } from "@/lib/market";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { TickMath } from "@uniswap/v3-sdk";
import { subDays } from "date-fns";
import combineQuery from "graphql-combine-query";
import { formatUnits } from "viem";
import { gnosis } from "viem/chains";

function getNearestRoundedDownTimestamp(timestamp: number, interval: number) {
  return Math.floor(timestamp / interval) * interval;
}

function findClosestLessThanOrEqualToTimestamp(sortedTimestamps: number[], targetTimestamp: number) {
  let left = 0;
  let right = sortedTimestamps.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (sortedTimestamps[mid] <= targetTimestamp) {
      result = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}

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
  if (lastPointBeforeStartTime) {
    return total;
  }
  // we will also try to get swap records to supplement the chart
  try {
    const swaps = await getSwapsByToken(poolPairs, initialStartTime, chainId);
    const swapsToPoolHourDatas = swaps.map((swap) => {
      const [token1Price, token0Price] = tickToPrice(Number(swap.tick));
      return {
        token0Price,
        token1Price,
        periodStartUnix: Number(swap.timestamp),
        sqrtPrice: TickMath.getSqrtRatioAtTick(Number(swap.tick)).toString(),
        pool: swap.pool,
      };
    }) as GetPoolHourDatasQuery["poolHourDatas"];
    return [...total, ...swapsToPoolHourDatas].sort((a, b) => a.periodStartUnix - b.periodStartUnix);
  } catch (e) {
    return total;
  }
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

  const lastNotEmptyStartTimes = await getLastNotEmptyStartTime(poolsPairs, chainId, startTime);

  return await Promise.all(
    poolsPairs.map((poolPairs, index) => {
      return getChartHourDatas(poolPairs, lastNotEmptyStartTimes[index] ?? startTime, endTime, chainId);
    }),
  );
}

function getFirstAndLastTimestamps(
  market: Market,
  interval: number,
  dayCount: number,
  initialEndDate: Date | undefined,
) {
  const now = new Date();
  const marketResolvedDate =
    market.payoutReported && market.finalizeTs > 0 ? new Date(market.finalizeTs * 1000) : undefined;

  let endDate = initialEndDate ? (initialEndDate > now ? now : initialEndDate) : now;

  if (marketResolvedDate && marketResolvedDate < endDate) {
    endDate = marketResolvedDate;
  }

  const lastTimestamp = getNearestRoundedDownTimestamp(Math.floor(endDate.getTime() / 1000), interval);
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

function getTimestamps(firstTimestamp: number, lastTimestamp: number, interval: number) {
  let currentTimestamp = firstTimestamp;
  const timestamps: number[] = [];
  while (currentTimestamp <= lastTimestamp) {
    timestamps.push(currentTimestamp);
    currentTimestamp += interval;
  }

  return Array.from(new Set(timestamps));
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

async function getInitialLiquidityPrice(
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

export async function getChartData(
  market: Market,
  dayCount: number,
  interval: number,
  endDate: Date | undefined,
): Promise<ChartData> {
  if (!interval) {
    return { chartData: [], timestamps: [] };
  }

  const poolsPairs = getMarketPoolsPairs(market);

  try {
    const { firstTimestamp, lastTimestamp } = getFirstAndLastTimestamps(market, interval, dayCount, endDate);

    const poolHourDatasSets = await getPoolHourDatas(poolsPairs, market.chainId, firstTimestamp, lastTimestamp);

    const timestamps = getTimestamps(firstTimestamp, lastTimestamp, interval);

    return market.type === "Generic"
      ? getGenericMarketData(market, timestamps, poolsPairs, poolHourDatasSets)
      : getFutarchyMarketData(market, timestamps, poolsPairs, poolHourDatasSets);
  } catch (e) {
    return { chartData: [], timestamps: [] };
  }
}

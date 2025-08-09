import { getSdk as getUniswapSdk } from "@/hooks/queries/gql-generated-uniswap";
import { SupportedChain } from "@/lib/chains";
import { Market, MarketTypes, Token0Token1, getMarketPoolsPairs, getMarketType, isOdd } from "@/lib/market";
import { getMarketEstimate } from "@/lib/market-odds";
import { normalizeOdds } from "@/lib/market-odds";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { subDays } from "date-fns";
import { formatUnits } from "viem";
import { gnosis } from "viem/chains";
import {
  GetPoolHourDatasQuery,
  Mint_OrderBy,
  OrderDirection,
  getSdk as getSwaprSdk,
} from "../queries/gql-generated-swapr";
import { ChartData } from "./useChartData";

export type PoolHourDatasSets = GetPoolHourDatasQuery["poolHourDatas"][];

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

/**
 * Calculates the first and last timestamps for chart data based on market conditions and parameters
 * @param market - The market object
 * @param interval - The time interval in seconds between data points
 * @param dayCount - Number of days to look back for historical data
 * @param initialEndDate - Optional end date for the chart data
 * @returns Object containing firstTimestamp and lastTimestamp for the chart data range
 */
function getFirstAndLastTimestamps(
  market: Market,
  interval: number,
  dayCount: number,
  initialEndDate: Date | undefined,
) {
  const now = new Date();

  // If market is resolved, use the finalization timestamp as the end date
  const marketResolvedDate =
    market.payoutReported && market.finalizeTs > 0 ? new Date(market.finalizeTs * 1000) : undefined;

  // Use the earlier of: provided end date, current time, or market resolution date
  let endDate = initialEndDate ? (initialEndDate > now ? now : initialEndDate) : now;
  if (marketResolvedDate && marketResolvedDate < endDate) {
    endDate = marketResolvedDate;
  }

  // Round down the last timestamp to the nearest interval
  const lastTimestamp = getNearestRoundedDownTimestamp(Math.floor(endDate.getTime() / 1000), interval);

  // Calculate first timestamp by going back dayCount days and rounding down to interval
  let firstTimestamp = getNearestRoundedDownTimestamp(
    Math.floor(subDays(new Date(), dayCount).getTime() / 1000),
    interval,
  );

  // If market has a block timestamp, ensure first timestamp is not before market creation
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

function getGenericMarketData(
  market: Market,
  timestamps: number[],
  poolsPairs: Token0Token1[],
  poolHourDatasSets: PoolHourDatasSets,
): ChartData {
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
): Promise<ChartData> {
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

export async function filterChartData(
  market: Market,
  poolHourDatasSets: PoolHourDatasSets,
  dayCount: number,
  interval: number,
  endDate: Date | undefined,
): Promise<ChartData> {
  if (!interval) {
    return { chartData: [], timestamps: [] };
  }

  try {
    const poolsPairs = getMarketPoolsPairs(market);
    const { firstTimestamp, lastTimestamp } = getFirstAndLastTimestamps(market, interval, dayCount, endDate);
    const timestamps = getTimestamps(firstTimestamp, lastTimestamp, interval);

    return filterChartDataByTimestamp(
      market.type === "Generic"
        ? getGenericMarketData(market, timestamps, poolsPairs, poolHourDatasSets)
        : await getFutarchyMarketData(market, timestamps, poolsPairs, poolHourDatasSets),
      firstTimestamp,
      lastTimestamp,
    );
  } catch (e) {
    return { chartData: [], timestamps: [] };
  }
}

function filterChartDataByTimestamp(chartData: ChartData, firstTimestamp: number, lastTimestamp: number): ChartData {
  // Filter timestamps that are within the range
  const filteredTimestamps = chartData.timestamps.filter(
    (timestamp) => timestamp >= firstTimestamp && timestamp <= lastTimestamp,
  );

  // If no timestamps are within the range, return empty chart data
  if (filteredTimestamps.length === 0) {
    return { chartData: [], timestamps: [] };
  }

  // Filter chart data points for each series based on the filtered timestamps
  const filteredChartData = chartData.chartData.map((series) => {
    const filteredData = series.data.filter(([timestamp]) => timestamp >= firstTimestamp && timestamp <= lastTimestamp);
    return {
      ...series,
      data: filteredData,
    };
  });

  return {
    chartData: filteredChartData,
    timestamps: filteredTimestamps,
  };
}

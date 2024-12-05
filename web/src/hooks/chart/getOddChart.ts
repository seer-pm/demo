import { SupportedChain } from "@/lib/chains";
import {
  CollateralByOutcome,
  MarketTypes,
  getCollateralByOutcome,
  getMarketEstimate,
  getMarketType,
  getToken1Token0,
  isOdd,
} from "@/lib/market";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { subDays } from "date-fns";
import { BigNumber } from "ethers";
import combineQuery from "graphql-combine-query";
import { Address, formatUnits } from "viem";
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
  GetPoolHourDatasDocument as UniswapGetPoolHourDatasDocument,
  GetPoolHourDatasQuery as UniswapGetPoolHourDatasQuery,
} from "../queries/gql-generated-uniswap";
import { getSdk as getUniswapSdk } from "../queries/gql-generated-uniswap";
import { Market } from "../useMarket";
import { normalizeOdds } from "../useMarketOdds";
import { findClosestLessThanOrEqualToTimestamp, getNearestRoundedDownTimestamp } from "./utils";

function calculateTokenPricesFromSqrtPrice(sqrtPrice: string) {
  const sqrtPriceBN = BigNumber.from(sqrtPrice);
  const token0PriceBN = BigNumber.from(2).pow(192).mul(BigNumber.from(10).pow(18)).div(sqrtPriceBN.mul(sqrtPriceBN));
  const token1PriceBN = sqrtPriceBN.mul(sqrtPriceBN).mul(BigNumber.from(10).pow(18)).div(BigNumber.from(2).pow(192));
  return { token0PriceBN, token1PriceBN };
}

async function getLastNotEmptyStartTime(
  collateralByOutcome: CollateralByOutcome[],
  chainId: SupportedChain,
  startTime: number,
) {
  if (collateralByOutcome.length === 0) {
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
      collateralByOutcome.map(({ tokenId, collateralToken }) => {
        return {
          first: 1,
          orderBy: PoolHourData_OrderBy.PeriodStartUnix,
          orderDirection: OrderDirection.Desc,
          where: {
            and: [
              { or: [{ liquidity_not: "0" }, { pool_: { liquidity_not: "0" } }] },
              {
                pool_: getToken1Token0(tokenId, collateralToken),
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
  tokenId: Address,
  collateral: Address,
  initialStartTime: number,
  chainId: SupportedChain,
) {
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
            pool_: getToken1Token0(tokenId, collateral),
            ...(attempt === 1 ? { periodStartUnix_gte: startTime } : { periodStartUnix_gt: startTime }),
          },
        ],
      },
    });
    total = total.concat(poolHourDatas);
    startTime = poolHourDatas[poolHourDatas.length - 1]?.periodStartUnix;
    attempt++;
    if (poolHourDatas.length < 1000) {
      break;
    }
  }
  return total;
}

async function getHistoryOdds(collateralByOutcome: CollateralByOutcome[], chainId: SupportedChain, startTime: number) {
  if (collateralByOutcome.length === 0) {
    return [];
  }
  const lastNotEmptyStartTimes = await Promise.any([
    getLastNotEmptyStartTime(collateralByOutcome, chainId, startTime),
    new Promise<number[]>((resolve) => {
      setTimeout(() => {
        resolve([]);
      }, 8000);
    }),
  ]);
  return await Promise.all(
    collateralByOutcome.map(({ tokenId, collateralToken }, index) => {
      return getPoolHourDatasByToken(tokenId, collateralToken, lastNotEmptyStartTimes[index] ?? startTime, chainId);
    }),
  );
}

export async function getOddChart(market: Market, dayCount: number, interval: number) {
  if (!interval) return;
  const collateralByOutcome = getCollateralByOutcome(market);
  const marketBlockTimestamp = market.blockTimestamp;
  const isScalarMarket = getMarketType(market) === MarketTypes.SCALAR;
  try {
    const lastTimestamp = getNearestRoundedDownTimestamp(Math.floor(new Date().getTime() / 1000), interval);
    let firstTimestamp = getNearestRoundedDownTimestamp(
      Math.floor(subDays(new Date(), dayCount).getTime() / 1000),
      interval,
    );

    if (marketBlockTimestamp) {
      firstTimestamp = Math.max(getNearestRoundedDownTimestamp(marketBlockTimestamp, interval), firstTimestamp);
    }

    let currentTimestamp = firstTimestamp;
    let timestamps: number[] = [];
    while (currentTimestamp <= lastTimestamp) {
      timestamps.push(currentTimestamp);
      currentTimestamp += interval;
    }

    const poolHourDatasSets = await getHistoryOdds(collateralByOutcome, market.chainId, firstTimestamp);
    const latestPoolHourDataTimestamp = Math.max(...poolHourDatasSets.flat().map((x) => x.periodStartUnix));
    timestamps = timestamps.filter((timestamp) => timestamp < latestPoolHourDataTimestamp);
    if (timestamps.length) {
      timestamps = [...timestamps, latestPoolHourDataTimestamp];
    }
    const oddsMapping = timestamps.reduce(
      (acc, timestamp) => {
        const tokenPrices = collateralByOutcome.map((token, tokenIndex) => {
          const poolHourDatas = poolHourDatasSets[tokenIndex];
          const poolHourTimestamps = poolHourDatas.map((x) => x.periodStartUnix);
          const poolHourDataIndex = findClosestLessThanOrEqualToTimestamp(poolHourTimestamps, timestamp);
          let { token0Price = "0", token1Price = "0", sqrtPrice } = poolHourDatas[poolHourDataIndex] ?? {};

          if (token0Price === "0" && token1Price === "0" && sqrtPrice && sqrtPrice !== "0") {
            const { token0PriceBN, token1PriceBN } = calculateTokenPricesFromSqrtPrice(sqrtPrice);
            token0Price = formatUnits(token0PriceBN.toBigInt(), 18);
            token1Price = formatUnits(token1PriceBN.toBigInt(), 18);
          }

          return token.tokenId.toLocaleLowerCase() > token.collateralToken.toLocaleLowerCase()
            ? Number(token0Price)
            : Number(token1Price);
        });

        const odds = normalizeOdds(tokenPrices);
        let isShowDataPoint = true;
        let total = 0;
        for (const odd of odds) {
          if (!isOdd(odd)) {
            isShowDataPoint = false;
            break;
          }
          total += odd;
        }
        if (total === 0) {
          isShowDataPoint = false;
        }
        acc[String(timestamp)] = isShowDataPoint ? odds : null;
        return acc;
      },
      {} as { [key: string]: number[] | null },
    );
    timestamps = timestamps.filter((x) => oddsMapping[String(x)]);
    if (!timestamps.length) {
      return { chartData: [], timestamps: [] };
    }
    if (isScalarMarket) {
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

    const chartData = collateralByOutcome.map((token, tokenIndex) => {
      return {
        name: token.outcomeName,
        type: "line",
        data: timestamps.map((timestamp) => {
          let odd = oddsMapping[String(timestamp)]![tokenIndex];
          odd = Number.isNaN(odd) ? 0 : odd;
          return [timestamp, odd];
        }),
      };
    });

    return { chartData, timestamps };
  } catch (e) {
    return { chartData: [], timestamps: [] };
  }
}

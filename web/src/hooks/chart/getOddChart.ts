import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { MarketTypes, getMarketType } from "@/lib/market";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { Token } from "@/lib/tokens";
import { subDays } from "date-fns";
import combineQuery from "graphql-combine-query";
import { gnosis } from "viem/chains";
import {
  OrderDirection,
  PoolHourData_OrderBy,
  GetPoolHourDatasDocument as SwaprGetPoolHourDatasDocument,
  GetPoolHourDatasQuery as SwaprGetPoolHourDatasQuery,
} from "../queries/gql-generated-swapr";
import {
  GetPoolHourDatasDocument as UniswapGetPoolHourDatasDocument,
  GetPoolHourDatasQuery as UniswapGetPoolHourDatasQuery,
} from "../queries/gql-generated-uniswap";
import { Market } from "../useMarket";
import { normalizeOdds } from "../useMarketOdds";
import { findClosestLesserTimestamp, getNearestRoundedDownTimestamp } from "./utils";

export async function getLastNotEmptyStartTime(
  tokens: { tokenId: string; parentTokenId?: string }[],
  chainId: SupportedChain,
  startTime: number,
) {
  if (tokens.length === 0) {
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
      tokens.map(({ tokenId, parentTokenId }) => {
        const collateral = parentTokenId
          ? parentTokenId.toLocaleLowerCase()
          : COLLATERAL_TOKENS[chainId].primary.address;
        return {
          first: 1,
          orderBy: PoolHourData_OrderBy.PeriodStartUnix,
          orderDirection: OrderDirection.Desc,
          where: {
            pool_:
              tokenId.toLocaleLowerCase() > collateral
                ? { token1: tokenId.toLocaleLowerCase(), token0: collateral }
                : { token0: tokenId.toLocaleLowerCase(), token1: collateral },
            periodStartUnix_lte: startTime,
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

export async function getHistoryOdds(
  tokens: { tokenId: string; parentTokenId?: string }[],
  chainId: SupportedChain,
  startTime: number,
) {
  if (tokens.length === 0) {
    return [];
  }
  const graphQLClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);

  if (!graphQLClient) {
    throw new Error("Subgraph not available");
  }

  const GetPoolHourDatasDocument =
    chainId === gnosis.id ? SwaprGetPoolHourDatasDocument : UniswapGetPoolHourDatasDocument;

  const lastNotEmptyStartTimes = await getLastNotEmptyStartTime(tokens, chainId, startTime);
  const { document, variables } = (() =>
    combineQuery("GetPoolHourDatas").addN(
      GetPoolHourDatasDocument,
      tokens.map(({ tokenId, parentTokenId }, index) => {
        const collateral = parentTokenId
          ? parentTokenId.toLocaleLowerCase()
          : COLLATERAL_TOKENS[chainId].primary.address;
        return {
          first: 1000,
          orderBy: PoolHourData_OrderBy.PeriodStartUnix,
          orderDirection: OrderDirection.Desc,
          where: {
            pool_:
              tokenId.toLocaleLowerCase() > collateral
                ? { token1: tokenId.toLocaleLowerCase(), token0: collateral }
                : { token0: tokenId.toLocaleLowerCase(), token1: collateral },
            periodStartUnix_gte: lastNotEmptyStartTimes[index] ?? startTime,
          },
        };
      }),
    ))();
  if (chainId === gnosis.id) {
    return Object.values(
      await graphQLClient.request<Record<string, SwaprGetPoolHourDatasQuery["poolHourDatas"]>>(document, variables),
    );
  }
  return Object.values(
    await graphQLClient.request<Record<string, UniswapGetPoolHourDatasQuery["poolHourDatas"]>>(document, variables),
  );
}

export async function getOddChart(market: Market, collateralToken: Token, dayCount: number, interval: number) {
  if (!interval) return;
  const outcomeTokens = market.wrappedTokens.map((token, index) => ({
    tokenId: token,
    outcomeName: market.outcomes[index],
  }));
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

    const poolHourDatasSets = await getHistoryOdds(
      outcomeTokens.map(({ tokenId }) => ({ tokenId, parentTokenId: collateralToken.address })),
      market.chainId,
      firstTimestamp,
    );
    const oddsMapping = timestamps.reduce(
      (acc, timestamp) => {
        const tokenPrices = outcomeTokens.map((token, tokenindex) => {
          const poolHourDatas = [...poolHourDatasSets[tokenindex]].reverse();
          const poolHourTimestamps = poolHourDatas.map((x) => x.periodStartUnix);
          const poolHourDataIndex = findClosestLesserTimestamp(poolHourTimestamps, timestamp);
          const { token0Price = "0", token1Price = "0" } = poolHourDatas[poolHourDataIndex] ?? {};
          return token.tokenId.toLocaleLowerCase() > collateralToken.address.toLocaleLowerCase()
            ? Number(token0Price)
            : Number(token1Price);
        });
        const odds = normalizeOdds(tokenPrices);
        let isShowDataPoint = true;
        let total = 0;
        for (const odd of odds) {
          if (Number.isNaN(odd)) {
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
            const marketEstimate =
              ((odds[0] || 0) * Number(market.lowerBound) + (odds[1] || 0) * Number(market.upperBound)) / 100;
            return [timestamp, marketEstimate];
          }),
        },
      ];
      return { chartData, timestamps };
    }

    const chartData = outcomeTokens.map((token, tokenIndex) => {
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

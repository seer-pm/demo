import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { uniswapGraphQLClient } from "@/lib/subgraph";
import { Token } from "@/lib/tokens";
import { subDays } from "date-fns";
import combineQuery from "graphql-combine-query";
import {
  GetPoolHourDatasDocument,
  GetPoolHourDatasQuery,
  OrderDirection,
  PoolHourData_OrderBy,
} from "../queries/gql-generated-uniswap";
import { normalizeOdds } from "../useMarketOdds";
import { findClosestLesserTimestamp, getNearestRoundedDownTimestamp } from "./utils";

export async function getUniswapHistoryOdds(
  tokens: { tokenId: string; parentTokenId?: string }[],
  chainId: SupportedChain,
  startTime: number,
) {
  if (tokens.length === 0) {
    return [];
  }
  const subgraphClient = uniswapGraphQLClient(chainId);

  if (!subgraphClient) {
    throw new Error("Subgraph not available");
  }

  const { document, variables } = (() =>
    combineQuery("GetPoolHourDatas").addN(
      GetPoolHourDatasDocument,
      tokens.map(({ tokenId, parentTokenId }) => {
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
            periodStartUnix_gte: startTime,
          },
        };
      }),
    ))();

  return Object.values(
    await subgraphClient.request<Record<string, GetPoolHourDatasQuery["poolHourDatas"]>>(document, variables),
  );
}

export async function getUniswapOddChart(
  chainId: SupportedChain,
  outcomeTokens: {
    tokenId: `0x${string}`;
    outcomeName: string;
  }[],
  collateralToken: Token,
  dayCount: number,
  interval: number,
  marketBlockTimestamp?: number,
) {
  if (!interval) return;

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

    const poolHourDatasSets = await getUniswapHistoryOdds(
      outcomeTokens.map(({ tokenId }) => ({ tokenId, parentTokenId: collateralToken.address })),
      chainId,
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
        acc[String(timestamp)] = Number.isNaN(odds[0]) ? null : odds;
        return acc;
      },
      {} as { [key: string]: number[] | null },
    );
    timestamps = timestamps.filter((x) => oddsMapping[String(x)]);
    if (!timestamps.length) {
      return { chartData: [], timestamps: [] };
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

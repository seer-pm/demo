import { SupportedChain, gnosis } from "@/lib/chains";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { Token } from "@/lib/tokens";
import { isTwoStringsEqual } from "@/lib/utils";
import { subDays } from "date-fns";
import { Address } from "viem";
import { getBlockNumbersAtTimes } from "../portfolio/utils";
import { getSdk as getSwaprSdk } from "../queries/gql-generated-swapr";
import { getSdk as getUniswapSdk } from "../queries/gql-generated-uniswap";
import { normalizeOdds } from "../useMarketOdds";

export async function getOutcomeTokensOddMappingByBlockNumber(
  chainId: SupportedChain,
  outcomeTokens: string[],
  collateralToken: Token,
  blockNumber: number,
) {
  const graphQLClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);

  if (!graphQLClient) {
    throw new Error("Subgraph not available");
  }

  const graphQLSdk = chainId === gnosis.id ? getSwaprSdk : getUniswapSdk;

  const { pools } = await graphQLSdk(graphQLClient).GetPools({
    where: {
      or: [
        { token0_: { id: collateralToken.address.toLocaleLowerCase() as Address } },
        { token1_: { id: collateralToken.address.toLocaleLowerCase() as Address } },
      ],
    },
    block: {
      number: blockNumber,
    },
  });
  const tokenPrices = outcomeTokens.map((outcomeToken) => {
    if (outcomeToken.toLocaleLowerCase() > collateralToken.address.toLocaleLowerCase()) {
      return Number(
        pools.find(
          (pool) =>
            isTwoStringsEqual(pool.token1.id, outcomeToken) &&
            isTwoStringsEqual(pool.token0.id, collateralToken.address),
        )?.token0Price ?? "0",
      );
    }
    return Number(
      pools.find(
        (pool) =>
          isTwoStringsEqual(pool.token0.id, outcomeToken) && isTwoStringsEqual(pool.token1.id, collateralToken.address),
      )?.token1Price ?? "0",
    );
  });
  const odds = normalizeOdds(tokenPrices);
  return outcomeTokens.reduce(
    (acc, outcomeToken, index) => {
      acc[outcomeToken] = Number.isNaN(odds[index]) ? 0 : odds[index];
      return acc;
    },
    {} as { [key: string]: number },
  );
}

function getNearestRoundedDownTimestamp(timestamp: number, interval: number) {
  return Math.floor(timestamp / interval) * interval;
}

export async function getOutcomeTokensOddChart(
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
    const timestamps: number[] = [];
    while (currentTimestamp <= lastTimestamp) {
      timestamps.push(currentTimestamp);
      currentTimestamp += interval;
    }
    const blockNumbers = await getBlockNumbersAtTimes(timestamps);
    const outcomeTokensOdds = await Promise.all(
      blockNumbers.map((blockNumber) =>
        getOutcomeTokensOddMappingByBlockNumber(
          chainId,
          outcomeTokens.map((x) => x.tokenId),
          collateralToken,
          blockNumber,
        ),
      ),
    );
    const chartData = outcomeTokens.map((token) => {
      return {
        name: token.outcomeName,
        type: "line",
        data: timestamps.map((timestamp, index) => {
          return [timestamp, outcomeTokensOdds[index][token.tokenId]];
        }),
      };
    });

    return { chartData, timestamps };
  } catch (e) {
    return { chartData: [], timestamps: [] };
  }
}

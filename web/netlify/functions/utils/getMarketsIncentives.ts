import pLimit from "p-limit";
import { formatUnits } from "viem";
import { gnosis } from "viem/chains";
import { getMarketPoolsPairs } from "./common.ts";
import { POOL_SUBGRAPH_URLS, SWAPR_ALGEBRA_FARMING_SUBGRAPH_URLS } from "./constants.ts";
import { Market, Token0Token1 } from "./types.ts";

interface Pool {
  id: string;
  token0: { id: string };
  token1: { id: string };
  token0Price: string;
  token1Price: string;
  chainId: number;
  outcomesCountWithoutInvalid: number;
  marketId: string;
}

async function fetchPoolsPerPair(market: Market, tokenPair: Token0Token1) {
  try {
    const chainId = market.chainId.toString();
    const query = `{
      pools(first: 1000, where: { token0: "${tokenPair.token0}", token1: "${tokenPair.token1}" }) {
        id
        token0 {
          id
        }
        token1 {
          id
        }
        token0Price
        token1Price
      }
    }`;
    const results = await fetch(POOL_SUBGRAPH_URLS[chainId]!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
      }),
    });
    const json = await results.json();
    const pools = json?.data?.pools ?? [];
    return pools.map((pool) => ({
      ...pool,
      chainId: Number(chainId),
      marketId: market.id,
      outcomesCountWithoutInvalid: market.wrappedTokens.length - 1,
    })) as Pool[];
  } catch (e) {
    console.log(e);
  }
}

async function fetchEternalFarmings(poolIds: string[]) {
  try {
    const query = `{
      eternalFarmings(first: 1000, where: {pool_in:${JSON.stringify(poolIds)}}) {
        id
        pool
        rewardToken
        bonusRewardToken
        reward
        rewardRate
        startTime
        endTime
      }
    }`;
    const results = await fetch(SWAPR_ALGEBRA_FARMING_SUBGRAPH_URLS[gnosis.id.toString()]!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
      }),
    });
    const json = await results.json();
    return json?.data?.eternalFarmings ?? [];
  } catch (e) {
    console.log(e);
    return [];
  }
}

async function fetchMarketPools(market: Market) {
  return await Promise.all(
    getMarketPoolsPairs(market).map((poolPair) => {
      return fetchPoolsPerPair(market, poolPair);
    }),
  );
}

export async function getMarketsIncentive(markets: Market[]) {
  const limit = pLimit(20);
  const allPossiblePools = (
    await Promise.all(
      markets.map((market) => {
        return limit(() => fetchMarketPools(market));
      }),
    )
  )
    .flat(2)
    .filter((x) => x) as Pool[];
  const eternalFarmings = await fetchEternalFarmings(allPossiblePools.map((pool) => pool.id));
  const incentiveToPoolMapping = eternalFarmings.reduce(
    (acc, curr) => {
      const incentive = Number(formatUnits(BigInt(curr.rewardRate) * 86400n, 18));
      acc[curr.pool] = (acc[curr.pool] ?? 0) + incentive;
      return acc;
    },
    {} as { [key: string]: number },
  );
  const marketToIncentiveMapping = allPossiblePools.reduce(
    (acc, curr) => {
      const incentive = incentiveToPoolMapping[curr.id] ?? 0;
      acc[curr.marketId] = (acc[curr.marketId] ?? 0) + incentive;
      return acc;
    },
    {} as { [key: string]: number },
  );
  return marketToIncentiveMapping;
}

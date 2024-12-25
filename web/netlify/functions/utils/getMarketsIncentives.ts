import pLimit from "p-limit";
import { formatUnits } from "viem";
import { gnosis } from "viem/chains";
import { COLLATERAL_TOKENS } from "./config.ts";
import { POOL_SUBGRAPH_URLS, SWAPR_ALGEBRA_FARMING_SUBGRAPH_URLS } from "./constants.ts";
import { Market } from "./types.ts";

interface Pool {
  id: string;
  token0: { id: string };
  token1: { id: string };
  token0Price: string;
  token1Price: string;
  isToken0Collateral: boolean;
  chainId: number;
  outcomesCountWithoutInvalid: number;
  marketId: string;
}

export async function fetchPoolsPerPair(market: Market, tokenPair: string[], isToken0Collateral: boolean) {
  try {
    const chainId = market.chainId.toString();
    const query = `{
      pools(first: 1000, where: { token0: "${tokenPair[0].toLocaleLowerCase()}", token1: "${tokenPair[1].toLocaleLowerCase()}" }) {
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
      isToken0Collateral,
      chainId: Number(chainId),
      marketId: market.id,
      outcomesCountWithoutInvalid: market.wrappedTokens.length - 1,
    })) as Pool[];
  } catch (e) {
    console.log(e);
  }
}

export async function fetchEternalFarmings(poolIds: string[]) {
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

async function fetchMarketPools(market: Market, collateralTokenAddress: string) {
  return await Promise.all(
    market.wrappedTokens.map((outcomeToken) => {
      const isToken0Collateral = outcomeToken.toLocaleLowerCase() > collateralTokenAddress.toLocaleLowerCase();
      const tokenPair = isToken0Collateral
        ? [collateralTokenAddress, outcomeToken]
        : [outcomeToken, collateralTokenAddress];
      return fetchPoolsPerPair(market, tokenPair, isToken0Collateral);
    }),
  );
}

export async function getMarketsIncentive(markets: Market[]) {
  const marketIdToMarketMapping = markets.reduce(
    (acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    },
    {} as { [key: string]: Market },
  );
  const limit = pLimit(20);
  const allPossiblePools = (
    await Promise.all(
      markets.map((market) => {
        const parentMarket = marketIdToMarketMapping[market.parentMarket.id];
        const parentCollateral = parentMarket?.wrappedTokens?.[Number(market.parentOutcome)];
        const collateralToken = parentCollateral || COLLATERAL_TOKENS[market.chainId].primary.address;
        return limit(() => fetchMarketPools(market, collateralToken));
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

import { readContracts } from "@wagmi/core";
import { Address, erc20Abi, formatUnits, zeroAddress } from "viem";
import { chainIds, config, gnosis } from "./config.ts";

import { OrderDirection, Pool_OrderBy, getSdk as getSwaprSdk } from "@/hooks/queries/gql-generated-swapr.ts";
import { getSdk as getUniswapSdk } from "@/hooks/queries/gql-generated-uniswap";
import { SupportedChain } from "@/lib/chains.ts";
import { Market, Token0Token1, getMarketPoolsPairs, getTokensPairKey } from "@/lib/market.ts";
import { isTwoStringsEqual } from "@/lib/utils.ts";
import pLimit from "p-limit";
import { swaprGraphQLClient, uniswapGraphQLClient } from "./subgraph.ts";

interface SubgraphPool {
  id: string;
  token0: { id: string; symbol: string };
  token1: { id: string; symbol: string };
  token0Price: string;
  token1Price: string;
  volumeToken0: string;
  volumeToken1: string;
}
export interface Pool extends SubgraphPool {
  balance0: number;
  balance1: number;
  isToken0Collateral: boolean;
  chainId: SupportedChain;
  outcomesCountWithoutInvalid: number;
  market: Market;
}

export async function fetchTokenBalances(
  tokenList: { token: Address; owner: Address }[],
  chainId: SupportedChain,
  groupCount: number,
  retry?: boolean,
) {
  try {
    // try to batch call
    let balances: bigint[] = [];
    for (let i = 0; i < Math.ceil(tokenList.length / groupCount); i++) {
      const data = await readContracts(config, {
        allowFailure: false,
        contracts: tokenList.slice(i * groupCount, (i + 1) * groupCount).map(({ token, owner }) => ({
          address: token,
          abi: erc20Abi,
          args: [owner],
          functionName: "balanceOf",
          chainId,
        })),
        batchSize: 0,
      });
      balances = balances.concat(data as bigint[]);
      // wait 200 ms to not reach max rate limit
      await new Promise((res) => setTimeout(res, 200));
    }
    return balances;
  } catch (e) {
    if (retry) {
      return await fetchTokenBalances(tokenList, chainId, 8);
    }
    throw e;
  }
}

async function fetchPoolsByTokenPairs(chainId: SupportedChain, tokenPairs: Token0Token1[]) {
  const subgraphClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);
  if (!subgraphClient) {
    return [];
  }
  const graphQLSdk = chainId === gnosis.id ? getSwaprSdk : getUniswapSdk;
  const maxAttempts = 20;
  let attempt = 0;
  let id = undefined;
  let total: SubgraphPool[] = [];
  while (attempt < maxAttempts) {
    const { pools }: { pools: SubgraphPool[] } = await graphQLSdk(subgraphClient).GetPools({
      where: {
        and: [
          {
            or: tokenPairs,
          },
          { id_lt: id },
        ],
      },
      first: 1000,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderBy: Pool_OrderBy.Id as any,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderDirection: OrderDirection.Desc as any,
    });
    total = total.concat(pools);
    if (pools[pools.length - 1]?.id === id) {
      break;
    }
    if (pools.length < 1000) {
      break;
    }
    id = pools[pools.length - 1]?.id;
    attempt++;
  }
  return total;
}

export async function fetchPools(chainId: SupportedChain, tokenPairs: Token0Token1[]) {
  const batchSize = 100;
  const limit = pLimit(2);

  const batches = Array.from({ length: Math.ceil(tokenPairs.length / batchSize) }, (_, i) =>
    tokenPairs.slice(i * batchSize, (i + 1) * batchSize),
  );

  const results = await Promise.all(batches.map((batch) => limit(() => fetchPoolsByTokenPairs(chainId, batch))));

  return results.flat();
}

export async function getAllMarketPools(markets: Market[]) {
  const tokenPairToMarketMapping = markets.reduce(
    (acc, curr) => {
      for (const token of curr.wrappedTokens) {
        for (const collateral of [curr.collateralToken, curr.collateralToken1, curr.collateralToken2]) {
          if (!isTwoStringsEqual(collateral, zeroAddress)) {
            acc[collateral > token ? `${token}-${collateral}` : `${collateral}-${token}`] = curr;
          }
        }
      }
      return acc;
    },
    {} as { [key: string]: Market },
  );
  const allPools = (
    await Promise.all(
      chainIds.map(async (chainId) => {
        const marketsByChain = markets.filter((market) => market.chainId === chainId);
        const tokenPairsByChain = marketsByChain.flatMap((market) => getMarketPoolsPairs(market));
        const poolsByChain = await fetchPools(chainId, tokenPairsByChain);
        const tokenPoolList = poolsByChain.reduce(
          (acc, curr) => {
            acc.push({
              token: curr.token0.id as Address,
              owner: curr.id as Address,
            });
            acc.push({
              token: curr.token1.id as Address,
              owner: curr.id as Address,
            });
            return acc;
          },
          [] as { token: Address; owner: Address }[],
        );
        const poolTokenBalances = (await fetchTokenBalances(tokenPoolList, chainId, 50, true)) as bigint[];
        const poolTokenBalanceMapping = tokenPoolList.reduce(
          (acc, curr, index) => {
            acc[`${curr.token}-${curr.owner}`] = Number(Number(formatUnits(poolTokenBalances[index], 18)).toFixed(4));
            return acc;
          },
          {} as { [key: string]: number },
        );
        const poolsByChainWithMarketData = poolsByChain.map((pool) => {
          const market = tokenPairToMarketMapping[getTokensPairKey(pool.token0.id, pool.token1.id)];
          if (!market) return;
          return {
            ...pool,
            market,
            balance0: poolTokenBalanceMapping[`${pool.token0.id}-${pool.id}`],
            balance1: poolTokenBalanceMapping[`${pool.token1.id}-${pool.id}`],
            // For generic markets, isToken0Collateral indicates whether token0 is the market's collateral token.
            // For futarchy markets, this flag is unused since they have two collateral tokens.
            isToken0Collateral: isTwoStringsEqual(pool.token0.id, market.collateralToken),
            chainId: Number(chainId),
            outcomesCountWithoutInvalid: market.wrappedTokens.length - 1,
          };
        });
        return poolsByChainWithMarketData.filter((x) => x);
      }),
    )
  ).flat() as Pool[];
  return allPools;
}

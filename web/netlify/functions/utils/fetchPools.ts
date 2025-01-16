import { readContracts } from "@wagmi/core";
import { erc20Abi, formatUnits } from "viem";
import { getMarketPoolsPairs, isTwoStringsEqual } from "./common.ts";
import { SupportedChain, chainIds, config } from "./config.ts";
import { POOL_SUBGRAPH_URLS, zeroAddress } from "./constants.ts";

import { Address, Market, Token0Token1 } from "./types.ts";
export interface Pool {
  id: Address;
  token0: { id: Address; symbol: string };
  token1: { id: Address; symbol: string };
  token0Price: string;
  token1Price: string;
  balance0: number;
  balance1: number;
  isToken0Collateral: boolean;
  chainId: SupportedChain;
  outcomesCountWithoutInvalid: number;
  market: Market;
}

export async function fetchTokenBalances(tokenList: { token: Address; owner: Address }[], chainId: SupportedChain) {
  try {
    return await readContracts(config, {
      allowFailure: false,
      contracts: tokenList.map(({ token, owner }) => ({
        address: token,
        abi: erc20Abi,
        args: [owner],
        functionName: "balanceOf",
        chainId,
      })),
      batchSize: 0,
    });
  } catch (e) {
    // try to batch call 8 each
    const groupCount = 8;
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
  }
}

export async function fetchPools(chainId: string, tokenPairs: Token0Token1[]) {
  const maxAttempts = 20;
  let attempt = 0;
  let allPools: Pool[] = [];
  let currentId = undefined;
  while (attempt < maxAttempts) {
    const query = `{
        pools(first: 1000, orderBy: id, orderDirection: asc, where: 
          { 
            and: [
              {
                or: [${tokenPairs.map((tokenPair) => `{token0: "${tokenPair.token0}", token1: "${tokenPair.token1}"}`)}]
              }${currentId ? `,{id_gt: "${currentId}"}` : ""}
            ]
          }) {
          id
          token0 {
            id
            symbol
          }
          token1 {
            id
            symbol
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
    const pools = (json?.data?.pools ?? []) as Pool[];
    allPools = allPools.concat(pools);
    if (pools[pools.length - 1]?.id === currentId) {
      break;
    }
    if (pools.length < 1000) {
      break; // We've fetched all pools
    }
    currentId = pools[pools.length - 1]?.id;
    attempt++;
  }
  return allPools;
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
        const poolsByChain = await fetchPools(chainId.toString(), tokenPairsByChain);
        const tokenPoolList = poolsByChain.reduce(
          (acc, curr) => {
            acc.push({
              token: curr.token0.id,
              owner: curr.id,
            });
            acc.push({
              token: curr.token1.id,
              owner: curr.id,
            });
            return acc;
          },
          [] as { token: `0x${string}`; owner: `0x${string}` }[],
        );
        const poolTokenBalances = (await fetchTokenBalances(tokenPoolList, chainId)) as bigint[];
        const poolTokenBalanceMapping = tokenPoolList.reduce(
          (acc, curr, index) => {
            acc[`${curr.token}-${curr.owner}`] = Number(Number(formatUnits(poolTokenBalances[index], 18)).toFixed(4));
            return acc;
          },
          {} as { [key: string]: number },
        );
        const poolsByChainWithMarketData = poolsByChain.map((pool) => {
          const market = tokenPairToMarketMapping[`${pool.token0.id}-${pool.token1.id}`];
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

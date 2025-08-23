import { GetPoolHourDatasQuery } from "@/hooks/queries/gql-generated-swapr";
import { SupportedChain, mainnet, optimism } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Token0Token1, getToken0Token1 } from "@/lib/market";
import pLimit from "p-limit";
import { Address } from "viem";
import { START_TIME, SUBGRAPHS } from "./constants";

export async function getPoolHourDatasByTokenPair(chainId: SupportedChain, tokenPair: Token0Token1) {
  let allData: GetPoolHourDatasQuery["poolHourDatas"] = [];
  const initialPeriodStartUnix = START_TIME[chainId as 1 | 100];
  let currentPeriodStartUnix = initialPeriodStartUnix;

  const maxRetries = 3;
  let counter = 0;

  while (true) {
    let retries = 0;
    let success = false;
    let poolHourDatas = [];

    while (retries < maxRetries && !success) {
      try {
        const query = `{
                    poolHourDatas(first: 1000, orderBy: periodStartUnix, orderDirection: asc${
                      currentPeriodStartUnix
                        ? `, where: {periodStartUnix_gt: ${currentPeriodStartUnix}, pool_: {token0: "${tokenPair.token0}", token1: "${tokenPair.token1}"}}`
                        : `, where: {pool_: {token0: "${tokenPair.token0}", token1: "${tokenPair.token1}"}}`
                    }) {
                    id
                    token0Price
                    token1Price
                    periodStartUnix
                    sqrtPrice
                    liquidity
                    pool {
                        id
                        liquidity
                        token0 {
                            id
                            name
                        }
                        token1 {
                            id
                            name
                        }
                    }
                    }
                }`;

        const results = await fetch(
          chainId === mainnet.id || chainId === optimism.id ? SUBGRAPHS["uniswap"][chainId] : SUBGRAPHS["algebra"][100],
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }),
          },
        );
        if (!results.ok) {
          throw new Error(`HTTP error! status: ${results.status}`);
        }

        const json = await results.json();
        if (json.errors?.length) {
          throw json.errors[0].message;
        }
        poolHourDatas = json?.data?.poolHourDatas ?? [];
        success = true;
        counter++;
      } catch (error) {
        retries++;

        if (retries === maxRetries) {
          throw new Error(`Max retries reached for periodStartUnix ${currentPeriodStartUnix}. ${error.message}`);
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** retries));
      }
    }

    allData = allData.concat(poolHourDatas);

    // Break conditions
    if (
      poolHourDatas.length === 0 ||
      poolHourDatas[poolHourDatas.length - 1]?.periodStartUnix === currentPeriodStartUnix
    ) {
      break;
    }
    if (poolHourDatas.length < 1000) {
      break; // We've fetched all
    }

    currentPeriodStartUnix = poolHourDatas[poolHourDatas.length - 1]?.periodStartUnix;

    // wait 300ms between calls
    await new Promise((res) => setTimeout(res, 300));
  }
  return allData;
}

export async function getPoolHourDatasByTokenPairs(
  chainId: SupportedChain,
  tokenPairs: { tokenId: Address; parentTokenId?: Address }[],
) {
  const limit = pLimit(50);
  const sortedTokenPairs = tokenPairs.map(({ tokenId, parentTokenId }) => {
    const collateral = parentTokenId
      ? parentTokenId.toLocaleLowerCase()
      : COLLATERAL_TOKENS[chainId].primary.address.toLocaleLowerCase();
    return getToken0Token1(tokenId, collateral as Address);
  });
  const promises = [];
  for (const tokenPair of sortedTokenPairs) {
    promises.push(limit(() => getPoolHourDatasByTokenPair(chainId, tokenPair)));
  }
  const allData = (await Promise.all(promises)).flat();
  allData.sort((a, b) => Number(b.periodStartUnix) - Number(a.periodStartUnix));
  return allData;
}

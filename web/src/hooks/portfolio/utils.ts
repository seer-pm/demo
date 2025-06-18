import { SupportedChain, gnosis } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { config } from "@/wagmi";
import { getBlock, readContracts } from "@wagmi/core";
import { Address, erc20Abi } from "viem";
import { getSdk as getSwaprSdk } from "../queries/gql-generated-swapr";
import { getSdk as getUniswapSdk } from "../queries/gql-generated-uniswap";
import { PortfolioPosition } from "./positionsTab/usePortfolioPositions";

export function getTokenPricesMapping(
  positions: PortfolioPosition[],
  pools: { token0: { id: string }; token1: { id: string }; token0Price: string; token1Price: string }[],
  chainId: SupportedChain,
) {
  const [simpleTokens, conditionalTokens] = positions.reduce(
    (acc, curr) => {
      acc[!isUndefined(curr.parentMarketId) ? 1 : 0].push(curr);
      return acc;
    },
    [[], []] as PortfolioPosition[][],
  );

  const simpleTokensMapping = simpleTokens.reduce(
    (acc, { tokenId }) => {
      let isTokenPrice0 = true;
      const correctPool = pools.find((pool) => {
        const sDAIAddress = COLLATERAL_TOKENS[chainId].primary.address;
        if (sDAIAddress > tokenId.toLocaleLowerCase()) {
          isTokenPrice0 = false;
          return isTwoStringsEqual(pool.token0.id, tokenId) && isTwoStringsEqual(pool.token1.id, sDAIAddress);
        }
        return isTwoStringsEqual(pool.token1.id, tokenId) && isTwoStringsEqual(pool.token0.id, sDAIAddress);
      });

      acc[tokenId.toLocaleLowerCase()] = correctPool
        ? isTokenPrice0
          ? Number(correctPool.token0Price)
          : Number(correctPool.token1Price)
        : 0;
      return acc;
    },
    {} as { [key: string]: number | undefined },
  );

  const conditionalTokensMapping = conditionalTokens.reduce(
    (acc, { tokenId, collateralToken }) => {
      let isTokenPrice0 = true;
      const correctPool = pools.find((pool) => {
        if (collateralToken!.toLocaleLowerCase() > tokenId.toLocaleLowerCase()) {
          isTokenPrice0 = false;
          return isTwoStringsEqual(pool.token0.id, tokenId) && isTwoStringsEqual(pool.token1.id, collateralToken);
        }
        return isTwoStringsEqual(pool.token1.id, tokenId) && isTwoStringsEqual(pool.token0.id, collateralToken);
      });

      const relativePrice = correctPool
        ? isTokenPrice0
          ? Number(correctPool.token0Price)
          : Number(correctPool.token1Price)
        : 0;

      acc[tokenId.toLocaleLowerCase()] =
        relativePrice * (simpleTokensMapping?.[collateralToken!.toLocaleLowerCase()] || 0);
      return acc;
    },
    {} as { [key: string]: number },
  );

  return { ...simpleTokensMapping, ...conditionalTokensMapping };
}

export async function getBlockTimestamp(initialBlockNumber: number) {
  let blockNumber = initialBlockNumber;
  const maxAttempts = 10; // Limit the number of attempts
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const block = await getBlock(config, { blockNumber: BigInt(blockNumber) });
      if (block.timestamp) {
        return Number(block.timestamp);
      }
      // Increment block number and attempts
      blockNumber++;
      attempts++;
    } catch (error) {
      blockNumber++;
      attempts++;
    }
  }
}

export async function getAllPools(
  tokens: { tokenId: string; parentTokenId?: string }[] | undefined,
  chainId: SupportedChain,
) {
  if (!tokens) return [];
  const graphQLClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);

  if (!graphQLClient) {
    throw new Error("Subgraph not available");
  }

  const graphQLSdk = chainId === gnosis.id ? getSwaprSdk : getUniswapSdk;

  const { pools } = await graphQLSdk(graphQLClient).GetPools({
    where: {
      or: tokens.reduce(
        (acc, { tokenId, parentTokenId }) => {
          if (parentTokenId) {
            acc.push(
              tokenId.toLocaleLowerCase() > parentTokenId.toLocaleLowerCase()
                ? { token1: tokenId.toLocaleLowerCase(), token0: parentTokenId.toLocaleLowerCase() }
                : { token0: tokenId.toLocaleLowerCase(), token1: parentTokenId.toLocaleLowerCase() },
            );
          } else {
            acc.push({ token0: tokenId.toLocaleLowerCase() }, { token1: tokenId.toLocaleLowerCase() });
          }
          return acc;
        },
        [] as { [key: string]: string }[],
      ),
    },
    first: 1000,
  });

  return pools;
}

export async function getTokensInfo(tokenAddresses: readonly Address[], account: Address) {
  const functions = [
    {
      name: "balanceOf",
      args: [account],
    },
    {
      name: "name",
      args: [],
    },
    {
      name: "decimals",
      args: [],
    },
  ];
  const data = await Promise.all(
    functions.map(({ name, args }) =>
      readContracts(config, {
        contracts: tokenAddresses.map((wrappedAddress) => ({
          abi: erc20Abi,
          address: wrappedAddress,
          functionName: name,
          args,
        })),
        allowFailure: false,
      }),
    ),
  );
  const balances = data[0] as bigint[];
  const names = data[1] as string[];
  const decimals = data[2] as bigint[];
  return { balances, names, decimals };
}

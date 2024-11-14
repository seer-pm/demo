import { SupportedChain, gnosis } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { isTwoStringsEqual } from "@/lib/utils";
import { config } from "@/wagmi";
import { ChainId } from "@swapr/sdk";
import { readContracts } from "@wagmi/core";
import { getBlock } from "@wagmi/core";
import { Address, erc20Abi } from "viem";
import { getSdk as getSwaprSdk } from "../queries/gql-generated-swapr";
import { getSdk as getUniswapSdk } from "../queries/gql-generated-uniswap";

export function getTokenPricesMapping(
  tokens: { tokenId: string; parentTokenId?: string }[],
  pools: { token0: { id: string }; token1: { id: string }; token0Price: string; token1Price: string }[],
  chainId: ChainId,
) {
  const [simpleTokens, conditionalTokens] = tokens.reduce(
    (acc, curr) => {
      acc[curr.parentTokenId ? 1 : 0].push(curr);
      return acc;
    },
    [[], []] as {
      tokenId: string;
      parentTokenId?: string;
    }[][],
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
    (acc, { tokenId, parentTokenId }) => {
      let isTokenPrice0 = true;
      const correctPool = pools.find((pool) => {
        if (parentTokenId!.toLocaleLowerCase() > tokenId.toLocaleLowerCase()) {
          isTokenPrice0 = false;
          return isTwoStringsEqual(pool.token0.id, tokenId) && isTwoStringsEqual(pool.token1.id, parentTokenId);
        }
        return isTwoStringsEqual(pool.token1.id, tokenId) && isTwoStringsEqual(pool.token0.id, parentTokenId);
      });

      const relativePrice = correctPool
        ? isTokenPrice0
          ? Number(correctPool.token0Price)
          : Number(correctPool.token1Price)
        : 0;

      acc[tokenId.toLocaleLowerCase()] =
        relativePrice * (simpleTokensMapping?.[parentTokenId!.toLocaleLowerCase()] || 0);
      return acc;
    },
    {} as { [key: string]: number },
  );

  return { ...simpleTokensMapping, ...conditionalTokensMapping };
}

type BlockNumberAtTime = { timestamp: bigint; number: bigint };

export async function getBlockNumberAtTime(
  timestamp: bigint,
  parentBlockCache?: Map<number, BlockNumberAtTime>,
): Promise<bigint> {
  const blockCache = parentBlockCache ?? new Map<number, BlockNumberAtTime>();

  // Get the latest block
  const latestBlock = await getBlock(config);

  // Binary search to find the block closest to the target timestamp
  let left = 1n;
  let right = latestBlock.number;

  while (left <= right) {
    const mid = (left + right) / 2n;
    let block: BlockNumberAtTime;

    if (blockCache.has(Number(mid))) {
      block = blockCache.get(Number(mid))!;
    } else {
      block = await getBlock(config, {
        blockNumber: BigInt(mid),
      });
      blockCache.set(Number(mid), block);
    }

    if (block.timestamp === timestamp) {
      return block.number;
    }
    if (block.timestamp < timestamp) {
      left = mid + 1n;
    } else {
      right = mid - 1n;
    }
  }

  // Return the closest block number
  return right;
}

export async function getBlockTimestamp(initialBlockNumber: number): Promise<bigint | undefined> {
  let blockNumber = BigInt(initialBlockNumber);
  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const block = await getBlock(config, {
        blockNumber,
      });

      if (block.timestamp) {
        return block.timestamp;
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

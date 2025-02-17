import { COLLATERAL_TOKENS } from "@/lib/config";
import { isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { config } from "@/wagmi";
import { ChainId } from "@swapr/sdk";
import { getBlock, readContracts } from "@wagmi/core";
import { Address, Block, erc20Abi } from "viem";
import { PortfolioPosition } from "./positionsTab/usePortfolioPositions";

export function getTokenPricesMapping(
  positions: PortfolioPosition[],
  pools: { token0: { id: string }; token1: { id: string }; token0Price: string; token1Price: string }[],
  chainId: ChainId,
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
        if (collateralToken.toLocaleLowerCase() > tokenId.toLocaleLowerCase()) {
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

async function getBlockNumberAtTime(timestamp: number, parentBlockCache?: Map<number, Block>): Promise<number> {
  const blockCache = parentBlockCache ?? new Map<number, Block>();

  // Get the latest block
  const latestBlock = await getBlock(config);

  // Binary search to find the block closest to the target timestamp
  let left = 1;
  let right = Number(latestBlock.number!);

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    let block: Block;
    if (blockCache.has(mid)) {
      block = blockCache.get(mid)!;
    } else {
      block = await getBlock(config, { blockNumber: BigInt(mid) });
      blockCache.set(mid, block);
    }

    if (Number(block.timestamp) === timestamp) {
      return Number(block.number);
    }
    if (Number(block.timestamp) < timestamp) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // Return the closest block number
  return right;
}

export async function getBlockNumbersAtTimes(timestamps: number[]) {
  const blockCache = new Map();
  return await Promise.all(timestamps.map((timestamp) => getBlockNumberAtTime(timestamp, blockCache)));
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

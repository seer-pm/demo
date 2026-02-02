import { AlgebraPoolAbi } from "@/abi/AlgebraPoolAbi";
import { sqrtPriceX96ToPrice } from "@/hooks/liquidity/utils";
import { SupportedChain, gnosis } from "@/lib/chains";
import { Market, getMarketPoolsPairs } from "@/lib/market";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { isUndefined } from "@/lib/utils";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { FeeAmount, TICK_SPACINGS } from "@uniswap/v3-sdk";
import { getPublicClient, readContracts } from "@wagmi/core";
import * as batshit from "@yornaath/batshit";
import memoize from "micro-memoize";
import { AbiEvent, Address, formatUnits } from "viem";
import {
  GetDepositsQuery,
  GetEternalFarmingsQuery,
  GetPositionsQuery,
  OrderDirection,
  Pool_OrderBy as SwaprPool_OrderBy,
  getSdk as getSwaprSdk,
} from "./queries/gql-generated-swapr";
import { Pool_OrderBy as UniswapPool_OrderBy, getSdk as getUniswapSdk } from "./queries/gql-generated-uniswap";
import { POOL_FACTORY_ADDRESSES, computePoolAddress } from "./useComputedPoolAddresses";

export interface PoolIncentive {
  reward: bigint;
  rewardRate: bigint;
  apr: number;
  rewardToken: Address;
  bonusRewardToken: Address;
  startTime: bigint;
  endTime: bigint;
  realEndTime: bigint;
}

export interface PoolInfo {
  id: Address;
  dex: string;
  fee: number;
  token0: Address;
  token1: Address;
  token0Price: number;
  token1Price: number;
  token0Symbol: string;
  token1Symbol: string;
  totalValueLockedToken0: number;
  totalValueLockedToken1: number;
  incentives: PoolIncentive[];
  liquidity: bigint;
  tick: number;
  tickSpacing: number;
}

function getPoolApr(_seerRewardPerDay: number /*, stakedTvl: number*/): number {
  /*const seerUsdPrice = 2; // TODO: get SEER price
  const stakedTvl = 10000; // TODO: get pool TVL
  const usdCoinsPerYear = seerRewardPerDay * 365 * seerUsdPrice
  const yearlyAPR = usdCoinsPerYear / stakedTvl * 100;
  return yearlyAPR;*/
  return 0;
}

function mapEternalFarming(eternalFarming: GetEternalFarmingsQuery["eternalFarmings"][0]): PoolIncentive {
  const rewardSeconds =
    eternalFarming.rewardRate !== "0" ? BigInt(eternalFarming.reward) / BigInt(eternalFarming.rewardRate) : 0n;
  const endTime = BigInt(eternalFarming.startTime) + rewardSeconds;
  return {
    reward: BigInt(eternalFarming.reward),
    rewardRate: BigInt(eternalFarming.rewardRate),
    apr: getPoolApr(Number(formatUnits(BigInt(eternalFarming.reward), 18))),
    rewardToken: eternalFarming.rewardToken,
    bonusRewardToken: eternalFarming.bonusRewardToken,
    startTime: BigInt(eternalFarming.startTime),
    // endTime is the value we need to use when interacting with the farming smart contract
    endTime: BigInt(eternalFarming.endTime),
    // realEndTime represents the actual end date displayed in the UI, calculated as min(endTime, reward/rewardRate)
    realEndTime: BigInt(eternalFarming.endTime) > endTime ? endTime : BigInt(eternalFarming.endTime),
  };
}

const eternalFarming = memoize((chainId: SupportedChain) => {
  return batshit.create({
    name: "eternalFarmings",
    fetcher: async (ids: Address[]) => {
      const algebraFarmingClient = swaprGraphQLClient(chainId, "algebrafarming");

      if (!algebraFarmingClient) {
        throw new Error("Subgraph not available");
      }

      const { eternalFarmings } = await getSwaprSdk(algebraFarmingClient).GetEternalFarmings({
        where: { pool_in: ids },
      });

      return eternalFarmings;
    },
    scheduler: batshit.windowScheduler(10),
    resolver: (eternalFarmings, poolId) => eternalFarmings.filter((eternalFarming) => eternalFarming.pool === poolId),
  });
});

/**
 * Fetches a single Swapr (Algebra) pool on-chain
 */
async function getSwaprPoolOnChain(
  chainId: SupportedChain,
  pair: { token0: Address; token1: Address },
): Promise<PoolInfo[]> {
  const factoryAddress = POOL_FACTORY_ADDRESSES[chainId];
  if (!factoryAddress) {
    return [];
  }

  const poolAddress = computePoolAddress({
    factoryAddress,
    tokenA: pair.token0,
    tokenB: pair.token1,
  });

  const results = await readContracts(config, {
    allowFailure: true,
    contracts: [
      { address: poolAddress, abi: AlgebraPoolAbi, functionName: "liquidity", chainId },
      { address: poolAddress, abi: AlgebraPoolAbi, functionName: "token0", chainId },
      { address: poolAddress, abi: AlgebraPoolAbi, functionName: "token1", chainId },
      { address: poolAddress, abi: AlgebraPoolAbi, functionName: "globalState", chainId },
      { address: poolAddress, abi: AlgebraPoolAbi, functionName: "tickSpacing", chainId },
    ],
  });

  const [liquidityResult, token0Result, token1Result, globalStateResult, tickSpacingResult] = results;
  if (
    liquidityResult.status === "failure" ||
    token0Result.status === "failure" ||
    token1Result.status === "failure" ||
    globalStateResult.status === "failure" ||
    tickSpacingResult.status === "failure"
  ) {
    return [];
  }

  const liquidity = liquidityResult.result;
  const token0 = token0Result.result.toLowerCase() as Address;
  const token1 = token1Result.result.toLowerCase() as Address;
  const globalState = globalStateResult.result;
  const [sqrtPriceX96, tickNumber, feeNumber] = globalState;
  const tickSpacing = Number(tickSpacingResult.result);

  if (liquidity === 0n) {
    return [];
  }

  const [token0PriceStr, token1PriceStr] = sqrtPriceX96ToPrice(sqrtPriceX96);
  const token0Price = Number(token0PriceStr);
  const token1Price = Number(token1PriceStr);

  return [
    {
      id: poolAddress as Address,
      dex: "Swapr",
      fee: feeNumber,
      token0,
      token1,
      token0Price,
      token1Price,
      token0Symbol: "",
      token1Symbol: "",
      totalValueLockedToken0: 0,
      totalValueLockedToken1: 0,
      incentives: await getEternalFarmingsOnChain(chainId, poolAddress),
      liquidity,
      tick: tickNumber,
      tickSpacing,
    },
  ];
}

const EternalFarmingCreatedEvent = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      internalType: "contract IERC20Minimal",
      name: "rewardToken",
      type: "address",
    },
    {
      indexed: true,
      internalType: "contract IERC20Minimal",
      name: "bonusRewardToken",
      type: "address",
    },
    {
      indexed: true,
      internalType: "contract IAlgebraPool",
      name: "pool",
      type: "address",
    },
    {
      indexed: false,
      internalType: "address",
      name: "virtualPool",
      type: "address",
    },
    {
      indexed: false,
      internalType: "uint256",
      name: "startTime",
      type: "uint256",
    },
    {
      indexed: false,
      internalType: "uint256",
      name: "endTime",
      type: "uint256",
    },
    {
      indexed: false,
      internalType: "uint256",
      name: "reward",
      type: "uint256",
    },
    {
      indexed: false,
      internalType: "uint256",
      name: "bonusReward",
      type: "uint256",
    },
    {
      components: [
        {
          internalType: "uint256",
          name: "tokenAmountForTier1",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "tokenAmountForTier2",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "tokenAmountForTier3",
          type: "uint256",
        },
        {
          internalType: "uint32",
          name: "tier1Multiplier",
          type: "uint32",
        },
        {
          internalType: "uint32",
          name: "tier2Multiplier",
          type: "uint32",
        },
        {
          internalType: "uint32",
          name: "tier3Multiplier",
          type: "uint32",
        },
      ],
      indexed: false,
      internalType: "struct IAlgebraFarming.Tiers",
      name: "tiers",
      type: "tuple",
    },
    {
      indexed: false,
      internalType: "address",
      name: "multiplierToken",
      type: "address",
    },
    {
      indexed: false,
      internalType: "uint24",
      name: "minimalAllowedPositionWidth",
      type: "uint24",
    },
  ],
  name: "EternalFarmingCreated",
  type: "event",
} as AbiEvent;

export async function getEternalFarmingsOnChain(chainId: SupportedChain, pool: Address) {
  if (chainId !== gnosis.id) return [];
  const publicClient = getPublicClient(config, { chainId });
  if (!publicClient) return [];
  try {
    const logs = await publicClient.getLogs({
      address: "0x607BbfD4CEbd869AaD04331F8a2AD0C3C396674b",
      event: EternalFarmingCreatedEvent,
      fromBlock: 36404701n,
      toBlock: "latest",
      args: {
        pool,
      },
    });
    const eventData = {
      ...logs[0].args,
      rewardRate: "0",
    } as GetEternalFarmingsQuery["eternalFarmings"][0];
    const eternalFarming = mapEternalFarming(eventData);
    return [eternalFarming];
  } catch {
    return [];
  }
}

async function getEternalFarmingsWithFallback(chainId: SupportedChain, pool: Address) {
  try {
    return (await eternalFarming(chainId).fetch(pool as Address)).map((eternalFarming) =>
      mapEternalFarming(eternalFarming),
    );
  } catch {
    return getEternalFarmingsOnChain(chainId, pool);
  }
}

async function getSwaprPools(
  chainId: SupportedChain,
  tokens: { token0: Address; token1: Address }[],
): Promise<PoolInfo[]> {
  await getEternalFarmingsOnChain(100, "0x85286729ceFbd646373d9bEeCF27feC4178f661a");

  const algebraClient = swaprGraphQLClient(chainId, "algebra");

  if (!algebraClient) {
    throw new Error("Subgraph not available");
  }

  try {
    const { pools } = await getSwaprSdk(algebraClient).GetPools({
      where: {
        or: tokens.map((t) => ({
          token0: t.token0.toLocaleLowerCase(),
          token1: t.token1.toLocaleLowerCase(),
        })),
      },
      orderBy: SwaprPool_OrderBy.TotalValueLockedUsd,
      orderDirection: OrderDirection.Desc,
      first: 1000,
    });

    return await Promise.all(
      pools.map(async (pool) => ({
        id: pool.id as Address,
        dex: "Swapr",
        fee: Number(pool.fee),
        token0: pool.token0.id.toLowerCase() as Address,
        token1: pool.token1.id.toLowerCase() as Address,
        token0Price: Number(pool.token0Price),
        token1Price: Number(pool.token1Price),
        liquidity: BigInt(pool.liquidity),
        tick: Number(pool.tick),
        tickSpacing: Number(pool.tickSpacing),
        token0Symbol: pool.token0.symbol,
        token1Symbol: pool.token1.symbol,
        totalValueLockedToken0: Number(pool.totalValueLockedToken0),
        totalValueLockedToken1: Number(pool.totalValueLockedToken1),
        incentives: await getEternalFarmingsWithFallback(chainId, pool.id as Address),
      })),
    );
  } catch {
    // Fallback: fetch pools on-chain when subgraph request fails
    const results = await Promise.all(tokens.map((pair) => getSwaprPoolOnChain(chainId, pair)));
    return results.flat();
  }
}

async function getUniswapPools(
  chainId: SupportedChain,
  tokens: { token0: Address; token1: Address }[],
): Promise<PoolInfo[]> {
  const uniswapClient = uniswapGraphQLClient(chainId);

  if (!uniswapClient) {
    throw new Error("Subgraph not available");
  }

  const { pools } = await getUniswapSdk(uniswapClient).GetPools({
    where: {
      or: tokens.map((t) => ({
        token0: t.token0.toLocaleLowerCase(),
        token1: t.token1.toLocaleLowerCase(),
      })),
    },
    orderBy: UniswapPool_OrderBy.Liquidity,
    orderDirection: OrderDirection.Desc,
    first: 1000,
  });

  return await Promise.all(
    pools.map(async (pool) => ({
      id: pool.id as Address,
      dex: "Bunni",
      fee: Number(pool.feeTier),
      token0: pool.token0.id as Address,
      token1: pool.token1.id as Address,
      token0Price: Number(pool.token0Price),
      token1Price: Number(pool.token1Price),
      liquidity: BigInt(pool.liquidity),
      tick: Number(pool.tick),
      tickSpacing: TICK_SPACINGS[Number(pool.feeTier) as FeeAmount] ?? 60,
      token0Symbol: pool.token0.symbol,
      token1Symbol: pool.token1.symbol,
      totalValueLockedToken0: Number(pool.totalValueLockedToken0),
      totalValueLockedToken1: Number(pool.totalValueLockedToken1),
      incentives: [], // TODO
    })),
  );
}

export const getPools = memoize((chainId: SupportedChain) => {
  return batshit.create({
    name: "getPools",
    fetcher: async (tokens: { token0: Address; token1: Address }[]) => {
      return chainId === gnosis.id ? getSwaprPools(chainId, tokens) : getUniswapPools(chainId, tokens);
    },
    scheduler: batshit.windowScheduler(10),
    resolver: (pools, tokens) =>
      pools.filter(
        (p) => p.token0 === tokens.token0.toLocaleLowerCase() && p.token1 === tokens.token1.toLocaleLowerCase(),
      ),
  });
});

export const useMarketPools = (market: Market) => {
  return useQuery<Array<PoolInfo[]> | undefined, Error>({
    queryKey: ["useMarketPools", market.id],
    retry: false,
    queryFn: async () => {
      return await Promise.all(getMarketPoolsPairs(market).map((poolPair) => getPools(market.chainId).fetch(poolPair)));
    },
  });
};

export type PoolDeposit = GetDepositsQuery["deposits"][0];
type PoolsDeposits = Record<Address, PoolDeposit[]>;

export const usePoolsDeposits = (chainId: SupportedChain, pools: Address[], owner?: Address) => {
  return useQuery<PoolsDeposits | undefined, Error>({
    queryKey: ["usePoolsDeposits", chainId, pools, owner],
    enabled: !!owner,
    refetchOnWindowFocus: "always",
    queryFn: async () => {
      const algebraFarmingClient = swaprGraphQLClient(chainId, "algebrafarming");

      if (!algebraFarmingClient || pools.length === 0) {
        return {};
      }

      const { deposits } = await getSwaprSdk(algebraFarmingClient).GetDeposits({
        where: { pool_in: pools, owner, liquidity_not: "0" },
      });

      return deposits.reduce((acum, curr) => {
        if (isUndefined(acum[curr.pool])) {
          acum[curr.pool] = [];
        }

        acum[curr.pool].push(curr);

        return acum;
      }, {} as PoolsDeposits);
    },
  });
};

export type NftPosition = GetPositionsQuery["positions"][0];

export const useNftPositions = (chainId: SupportedChain, ids: string[]) => {
  return useQuery<Record<string, NftPosition> | undefined, Error>({
    queryKey: ["useNftPositions", chainId, ids],
    enabled: ids.length > 0,
    refetchOnWindowFocus: "always",
    queryFn: async () => {
      const algebraClient = swaprGraphQLClient(chainId, "algebra");

      if (!algebraClient) {
        throw new Error("Subgraph not available");
      }

      const { positions } = await getSwaprSdk(algebraClient).GetPositions({
        where: { id_in: ids },
      });

      return positions.reduce(
        (acc, curr) => {
          acc[curr.id] = curr;
          return acc;
        },
        {} as Record<string, NftPosition>,
      );
    },
  });
};

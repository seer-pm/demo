import { SupportedChain, gnosis } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { Token } from "@/lib/tokens";
import { isUndefined } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import * as batshit from "@yornaath/batshit";
import memoize from "micro-memoize";
import { Address, formatUnits, zeroAddress } from "viem";
import {
  GetDepositsQuery,
  GetEternalFarmingsQuery,
  OrderDirection,
  Pool_OrderBy as SwaprPool_OrderBy,
  getSdk as getSwaprSdk,
} from "./queries/gql-generated-swapr";
import { Pool_OrderBy as UniswapPool_OrderBy, getSdk as getUniswapSdk } from "./queries/gql-generated-uniswap";
import { Market } from "./useMarket";
import { useTokenInfo } from "./useTokenInfo";

export interface PoolIncentive {
  reward: bigint;
  rewardRate: bigint;
  apr: number;
  rewardToken: Address;
  bonusRewardToken: Address;
  startTime: bigint;
  endTime: bigint;
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
  return {
    reward: BigInt(eternalFarming.reward),
    rewardRate: BigInt(eternalFarming.rewardRate),
    apr: getPoolApr(Number(formatUnits(BigInt(eternalFarming.reward), 18))),
    rewardToken: eternalFarming.rewardToken,
    bonusRewardToken: eternalFarming.bonusRewardToken,
    startTime: BigInt(eternalFarming.startTime),
    endTime: BigInt(eternalFarming.endTime),
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

async function getSwaprPools(
  chainId: SupportedChain,
  tokens: { token0: Address; token1: Address }[],
): Promise<PoolInfo[]> {
  const algebraClient = swaprGraphQLClient(chainId, "algebra");

  if (!algebraClient) {
    throw new Error("Subgraph not available");
  }

  const { pools } = await getSwaprSdk(algebraClient).GetPools({
    where: {
      or: tokens.map((t) => ({ token0: t.token0.toLocaleLowerCase(), token1: t.token1.toLocaleLowerCase() })),
    },
    orderBy: SwaprPool_OrderBy.TotalValueLockedUsd,
    orderDirection: OrderDirection.Desc,
  });

  return await Promise.all(
    pools.map(async (pool) => ({
      id: pool.id as Address,
      dex: "Swapr",
      fee: Number(pool.fee),
      token0: pool.token0.id as Address,
      token1: pool.token1.id as Address,
      token0Price: Number(pool.token0Price),
      token1Price: Number(pool.token1Price),
      token0Symbol: pool.token0.symbol,
      token1Symbol: pool.token1.symbol,
      totalValueLockedToken0: Number(pool.totalValueLockedToken0),
      totalValueLockedToken1: Number(pool.totalValueLockedToken1),
      incentives: (await eternalFarming(chainId).fetch(pool.id as Address)).map((eternalFarming) =>
        mapEternalFarming(eternalFarming),
      ),
    })),
  );
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
      or: tokens.map((t) => ({ token0: t.token0.toLocaleLowerCase(), token1: t.token1.toLocaleLowerCase() })),
    },
    orderBy: UniswapPool_OrderBy.Liquidity,
    orderDirection: OrderDirection.Desc,
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
      token0Symbol: pool.token0.symbol,
      token1Symbol: pool.token1.symbol,
      totalValueLockedToken0: Number(pool.totalValueLockedToken0),
      totalValueLockedToken1: Number(pool.totalValueLockedToken1),
      incentives: [], // TODO
    })),
  );
}

const getPools = memoize((chainId: SupportedChain) => {
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
  const { data: parentCollateral, isLoading } = useTokenInfo(
    market.parentMarket !== zeroAddress ? market.collateralToken : undefined,
    market.chainId,
  );
  const collateralToken = parentCollateral || COLLATERAL_TOKENS[market.chainId].primary;
  const tokens = market.wrappedTokens.map((outcomeToken) => {
    return outcomeToken.toLocaleLowerCase() > collateralToken.address.toLocaleLowerCase()
      ? [collateralToken.address, outcomeToken]
      : [outcomeToken, collateralToken.address];
  });
  return useQuery<Array<PoolInfo[]> | undefined, Error>({
    enabled: tokens && tokens.length > 0 && !isLoading,
    queryKey: ["useMarketPools", market.id, tokens],
    retry: false,
    queryFn: async () => {
      return await Promise.all(tokens.map(([token0, token1]) => getPools(market.chainId).fetch({ token0, token1 })));
    },
  });
};

interface OutcomePool {
  token0: {
    symbol: string;
    id: string;
  };
  token1: {
    symbol: string;
    id: string;
  };
  liquidity: string;
}

export const useAllOutcomePools = (chainId: SupportedChain, collateralToken: Token) => {
  return useQuery<OutcomePool[], Error>({
    queryKey: ["useAllOutcomePools", chainId, collateralToken.address],
    retry: false,
    queryFn: async () => {
      const graphQLClient =
        chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);

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
      });
      return pools;
    },
  });
};

type PoolsDeposits = Record<Address, GetDepositsQuery["deposits"]>;

export const usePoolsDeposits = (chainId: SupportedChain, pools: Address[], owner?: Address) => {
  return useQuery<PoolsDeposits | undefined, Error>({
    queryKey: ["usePoolsDeposits", chainId, pools, owner],
    enabled: !!owner,
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

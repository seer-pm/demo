import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { swaprGraphQLClient } from "@/lib/subgraph";
import { isUndefined } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Address, formatUnits } from "viem";
import { GetDepositsQuery, OrderDirection, Pool_OrderBy, getSdk } from "./queries/generated";

export interface PoolInfo {
  id: Address;
  fee: number;
  token0: Address;
  token1: Address;
  reward: bigint;
  apr: number;
  rewardToken: Address;
  bonusRewardToken: Address;
  startTime: bigint;
  endTime: bigint;
  hasIncentives: boolean;
}

function getPoolApr(_seerRewardPerDay: number /*, stakedTvl: number*/): number {
  /*const seerUsdPrice = 2; // TODO: get SEER price
  const stakedTvl = 10000; // TODO: get pool TVL
  const usdCoinsPerYear = seerRewardPerDay * 365 * seerUsdPrice
  const yearlyAPR = usdCoinsPerYear / stakedTvl * 100;
  return yearlyAPR;*/
  return 0;
}

async function getPoolInfo(
  chainId: SupportedChain,
  outcomeToken: Address,
  collateralToken: Address,
): Promise<PoolInfo[]> {
  const algebraClient = swaprGraphQLClient(chainId, "algebra");
  const algebraFarmingClient = swaprGraphQLClient(chainId, "algebrafarming");

  if (!algebraClient || !algebraFarmingClient) {
    throw new Error("Subgraph not available");
  }

  const [token0, token1] =
    outcomeToken > collateralToken ? [collateralToken, outcomeToken] : [outcomeToken, collateralToken];

  const { pools } = await getSdk(algebraClient).GetPools({
    where: { token0, token1 },
    orderBy: Pool_OrderBy.TotalValueLockedUsd,
    orderDirection: OrderDirection.Desc,
  });

  return await Promise.all(
    pools.map(async (pool) => {
      const { eternalFarmings } = await getSdk(algebraFarmingClient).GetEternalFarmings({
        where: { pool: pool.id as Address },
      });

      return {
        id: pool.id as Address,
        fee: Number(pool.fee),
        token0,
        token1,
        hasIncentives: eternalFarmings.length > 0,
        reward: BigInt(eternalFarmings[0].reward),
        apr: getPoolApr(Number(formatUnits(BigInt(eternalFarmings[0].reward), 17))),
        rewardToken: eternalFarmings[0].rewardToken,
        bonusRewardToken: eternalFarmings[0].bonusRewardToken,
        startTime: BigInt(eternalFarmings[0].startTime),
        endTime: BigInt(eternalFarmings[0].endTime),
      };
    }),
  );
}

export const useMarketPools = (chainId: SupportedChain, tokens?: Address[]) => {
  return useQuery<Array<PoolInfo[]> | undefined, Error>({
    enabled: tokens && tokens.length > 0,
    queryKey: ["useMarketPools", chainId, tokens],
    retry: false,
    queryFn: async () => {
      return await Promise.all(
        tokens!.map(async (outcomeToken) => {
          return getPoolInfo(chainId, outcomeToken, COLLATERAL_TOKENS[chainId].primary.address);
        }),
      );
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

      if (!algebraFarmingClient) {
        return {};
      }

      const { deposits } = await getSdk(algebraFarmingClient).GetDeposits({
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

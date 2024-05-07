import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { swaprGraphQLClient } from "@/lib/subgraph";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { OrderDirection, Pool_OrderBy, getSdk } from "./queries/generated";

export interface PoolInfo {
  id: Address;
  fee: number;
  token0: Address;
  token1: Address;
  reward: bigint;
  hasIncentives: boolean;
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

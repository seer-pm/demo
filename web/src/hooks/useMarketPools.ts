import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { swaprGraphQLClient } from "@/lib/subgraph";
import { useQuery } from "@tanstack/react-query";
import { Address, zeroAddress } from "viem";
import { OrderDirection, Pool_OrderBy, getSdk } from "./queries/generated";

interface PoolInfo {
  id: Address;
  hasIncentives: boolean;
}

async function getPoolInfo(
  chainId: SupportedChain,
  outcomeToken: Address,
  collateralToken: Address,
): Promise<PoolInfo> {
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

  if (pools.length === 0) {
    throw new Error(`No pool found for outcome token ${outcomeToken}`);
  }

  const mainPool = pools[0];

  const { eternalFarmings } = await getSdk(algebraFarmingClient).GetEternalFarmings({
    where: { pool: mainPool.id as Address },
  });

  return {
    id: mainPool.id as Address,
    hasIncentives: eternalFarmings.length > 0,
  };
}

export const useMarketPools = (chainId: SupportedChain, tokens?: Address[]) => {
  return useQuery<PoolInfo[] | undefined, Error>({
    enabled: tokens && tokens.length > 0,
    queryKey: ["useMarketPools", chainId, tokens],
    retry: false,
    queryFn: async () => {
      return (
        await Promise.allSettled(
          tokens!.map(async (outcomeToken) => {
            return getPoolInfo(chainId, outcomeToken, COLLATERAL_TOKENS[chainId].primary.address);
          }),
        )
      ).map((res) => (res.status === "fulfilled" ? res.value : { id: zeroAddress, hasIncentives: false }));
    },
  });
};

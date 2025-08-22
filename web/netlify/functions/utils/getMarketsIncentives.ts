import { EternalFarming_OrderBy, OrderDirection, getSdk } from "@/hooks/queries/gql-generated-swapr.ts";
import { Address, formatUnits } from "viem";
import { gnosis } from "viem/chains";
import { Pool } from "./fetchPools.ts";
import { getSubgraphUrl, swaprGraphQLClient } from "./subgraph.ts";

interface EternalFarming {
  id: string;
  rewardRate: string;
  reward: string;
  endTime: string;
  startTime: string;
  pool: string;
}

async function fetchEternalFarmings(poolIds: Address[]): Promise<EternalFarming[]> {
  if (poolIds.length === 0) {
    return [];
  }

  const maxAttempts = 20;
  let attempt = 0;
  let allFarmings: EternalFarming[] = [];
  const algebraFarmingClient = swaprGraphQLClient(gnosis.id, "algebrafarming");

  if (!algebraFarmingClient) {
    throw new Error("Subgraph not available");
  }

  let id = undefined;
  while (attempt < maxAttempts) {
    const { eternalFarmings: farmings } = await getSdk(algebraFarmingClient).GetEternalFarmings({
      where: { pool_in: poolIds, id_lt: id },
      first: 1000,
      orderBy: EternalFarming_OrderBy.Id,
      orderDirection: OrderDirection.Desc,
    });
    allFarmings = allFarmings.concat(farmings);
    if (farmings[farmings.length - 1]?.id === id) {
      break;
    }
    if (farmings.length < 1000) {
      break;
    }
    id = farmings[farmings.length - 1]?.id;
    attempt++;
  }
  return allFarmings;
}

export async function getMarketsIncentive(pools: Pool[]) {
  const eternalFarmings = await fetchEternalFarmings(pools.map((pool) => pool.id as Address));

  const incentiveToPoolMapping = eternalFarmings.reduce(
    (acc, curr) => {
      const rewardSeconds = BigInt(curr.reward) / BigInt(curr.rewardRate);
      let endTime = BigInt(curr.startTime) + rewardSeconds;
      endTime = BigInt(curr.endTime) > endTime ? endTime : BigInt(curr.endTime);
      const isRewardEnded = Number(endTime) * 1000 < new Date().getTime();
      const incentive = isRewardEnded ? 0 : Number(formatUnits(BigInt(curr.rewardRate) * 86400n, 18));
      acc[curr.pool] = (acc[curr.pool] ?? 0) + incentive;
      return acc;
    },
    {} as { [key: string]: number },
  );

  const marketToIncentiveMapping = pools.reduce(
    (acc, curr) => {
      const incentive = incentiveToPoolMapping[curr.id] ?? 0;
      acc[curr.market.id] = (acc[curr.market.id] ?? 0) + incentive;
      return acc;
    },
    {} as { [key: string]: number },
  );
  return marketToIncentiveMapping;
}

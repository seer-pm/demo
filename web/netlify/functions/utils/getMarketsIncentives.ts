import { formatUnits } from "viem";
import { gnosis } from "viem/chains";
import { Pool } from "./fetchPools.ts";
import { SUBGRAPHS } from "./subgraph.ts";

interface EternalFarming {
  id: string;
  rewardRate: string;
  pool: string;
}

async function fetchEternalFarmings(poolIds: string[]): Promise<EternalFarming[]> {
  const maxAttempts = 20;
  let attempt = 0;
  let allFarmings: EternalFarming[] = [];
  let currentId = undefined;
  while (attempt < maxAttempts) {
    const query = `{
        eternalFarmings(first: 1000, orderBy: id, orderDirection: asc, where: {pool_in:${JSON.stringify(poolIds)}${
          currentId ? `,id_gt: "${currentId}"` : ""
        }}) {
          id
          pool
          rewardToken
          bonusRewardToken
          reward
          rewardRate
          startTime
          endTime
        }
      }`;
    const results = await fetch(SUBGRAPHS.algebra[gnosis.id]!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
      }),
    });
    const json = await results.json();
    const farmings = (json?.data?.eternalFarmings ?? []) as EternalFarming[];
    allFarmings = allFarmings.concat(farmings);
    if (farmings[farmings.length - 1]?.id === currentId) {
      break;
    }
    if (farmings.length < 1000) {
      break; // We've fetched all pools
    }
    currentId = farmings[farmings.length - 1]?.id;
    attempt++;
  }
  return allFarmings;
}

export async function getMarketsIncentive(pools: Pool[]) {
  const eternalFarmings = await fetchEternalFarmings(pools.map((pool) => pool.id));
  const incentiveToPoolMapping = eternalFarmings.reduce(
    (acc, curr) => {
      const incentive = Number(formatUnits(BigInt(curr.rewardRate) * 86400n, 18));
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

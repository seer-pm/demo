import { formatUnits } from "viem";
import { gnosis } from "viem/chains";
import { isUndefined } from "./common.ts";
import { SWAPR_ALGEBRA_FARMING_SUBGRAPH_URLS } from "./constants.ts";
import { Pool } from "./fetchPools.ts";

interface EternalFarming {
  id: string;
  rewardRate: string;
  reward: string;
  endTime: string;
  startTime: string;
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
    const results = await fetch(SWAPR_ALGEBRA_FARMING_SUBGRAPH_URLS[gnosis.id.toString()]!, {
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

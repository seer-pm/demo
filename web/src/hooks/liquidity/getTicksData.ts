import { PoolInfo, getPools } from "@seer-pm/react";
import type { SupportedChain } from "@seer-pm/sdk";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@seer-pm/sdk";
import { GetTicksQuery, OrderDirection, Tick_OrderBy, getSdk as getSwaprSdk } from "@seer-pm/sdk/subgraph/swapr";
import { getSdk as getUniswapSdk } from "@seer-pm/sdk/subgraph/uniswap";
import type { Config } from "@wagmi/core";
import { Address } from "viem";
import { gnosis } from "viem/chains";

async function getTicks(chainId: SupportedChain, poolId: string) {
  const graphQLClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);

  if (!graphQLClient) {
    throw new Error("Subgraph not available");
  }

  const graphQLSdk = chainId === gnosis.id ? getSwaprSdk : getUniswapSdk;
  let total: GetTicksQuery["ticks"] = [];
  let attempt = 1;
  let tickIdx = "";
  while (true) {
    const { ticks } = await graphQLSdk(graphQLClient).GetTicks({
      first: 1000,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderBy: Tick_OrderBy.TickIdx as any,
      // biome-ignore lint/suspicious/noExplicitAny:
      orderDirection: OrderDirection.Asc as any,
      where: {
        poolAddress: poolId,
        // liquidityNet_not: "0",
        ...(tickIdx && { tickIdx_gt: tickIdx }),
      },
    });
    total = total.concat(ticks);
    tickIdx = ticks[ticks.length - 1]?.tickIdx;
    attempt++;
    if (ticks.length < 1000) {
      break;
    }
  }
  return total;
}

export async function getPoolAndTicksData(chainId: SupportedChain, token0: Address, token1: Address, config: Config) {
  try {
    const pools = await getPools(chainId, config).fetch({ token0, token1 });

    const ticksByPool = await Promise.all(pools.map((pool) => getTicks(chainId, pool.id)));

    return pools.reduce(
      (acc, curr, index) => {
        acc[curr.id] = {
          ticks: ticksByPool[index],
          poolInfo: pools[index],
        };
        return acc;
      },
      {} as {
        [key: string]: {
          ticks: {
            tickIdx: string;
            liquidityNet: string;
          }[];
          poolInfo: PoolInfo;
        };
      },
    );
  } catch (e) {
    console.error("getTicksData", e);
    return {};
  }
}

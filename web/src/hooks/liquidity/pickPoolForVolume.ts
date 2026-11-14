import type { PoolInfo } from "@seer-pm/react";

export type PoolTicksEntry = {
  ticks: {
    tickIdx: string;
    liquidityNet: string;
  }[];
  poolInfo: PoolInfo;
};

function hasTicks(entry: PoolTicksEntry): boolean {
  return entry.ticks.some((tick) => tick.liquidityNet !== "0");
}

/**
 * Pick the pool with the highest on-chain liquidity (V3 or V4).
 * Pools whose tick data is missing (e.g. a subgraph that has not caught up yet) lose to any pool
 * that has ticks, because the volume math needs them.
 */
export function pickPoolForVolume(ticksByPool: Record<string, PoolTicksEntry>): PoolTicksEntry | undefined {
  let best: PoolTicksEntry | undefined;
  for (const entry of Object.values(ticksByPool)) {
    if (!best) {
      best = entry;
      continue;
    }
    const entryHasTicks = hasTicks(entry);
    const bestHasTicks = hasTicks(best);
    if (entryHasTicks !== bestHasTicks) {
      if (entryHasTicks) best = entry;
      continue;
    }
    if (entry.poolInfo.liquidity > best.poolInfo.liquidity) {
      best = entry;
    }
  }
  if (!best || best.poolInfo.liquidity === 0n) {
    return undefined;
  }
  return best;
}

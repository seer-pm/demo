import type { PoolInfo } from "@seer-pm/react";

export type PoolTicksEntry = {
  ticks: {
    tickIdx: string;
    liquidityNet: string;
  }[];
  poolInfo: PoolInfo;
};

/** Pick the pool with the highest on-chain liquidity (V3 or V4). */
export function pickPoolForVolume(ticksByPool: Record<string, PoolTicksEntry>): PoolTicksEntry | undefined {
  let best: PoolTicksEntry | undefined;
  for (const entry of Object.values(ticksByPool)) {
    if (!best || entry.poolInfo.liquidity > best.poolInfo.liquidity) {
      best = entry;
    }
  }
  if (!best || best.poolInfo.liquidity === 0n) {
    return undefined;
  }
  return best;
}

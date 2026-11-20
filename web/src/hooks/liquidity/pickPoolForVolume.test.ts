import type { PoolInfo } from "@seer-pm/react";
import { describe, expect, it } from "vitest";
import { type PoolTicksEntry, pickPoolForVolume } from "./pickPoolForVolume";

function entry(id: string, liquidity: bigint, ticks: PoolTicksEntry["ticks"]): PoolTicksEntry {
  return { ticks, poolInfo: { id, liquidity } as unknown as PoolInfo };
}

const someTicks = [
  { tickIdx: "-120", liquidityNet: "1000" },
  { tickIdx: "120", liquidityNet: "-1000" },
];

describe("pickPoolForVolume", () => {
  it("picks the pool with the most liquidity when all have ticks", () => {
    const picked = pickPoolForVolume({
      a: entry("a", 10n, someTicks),
      b: entry("b", 20n, someTicks),
    });
    expect(picked?.poolInfo.id).toBe("b");
  });

  it("prefers a pool with tick data over a deeper pool without it", () => {
    const picked = pickPoolForVolume({
      v4: entry("v4", 1_000n, []),
      v3: entry("v3", 10n, someTicks),
    });
    expect(picked?.poolInfo.id).toBe("v3");
  });

  it("treats ticks with zero liquidityNet as no tick data", () => {
    const picked = pickPoolForVolume({
      empty: entry("empty", 1_000n, [{ tickIdx: "0", liquidityNet: "0" }]),
      real: entry("real", 10n, someTicks),
    });
    expect(picked?.poolInfo.id).toBe("real");
  });

  it("falls back to liquidity when no pool has ticks", () => {
    const picked = pickPoolForVolume({
      a: entry("a", 10n, []),
      b: entry("b", 20n, []),
    });
    expect(picked?.poolInfo.id).toBe("b");
  });

  it("returns undefined when the best pool has no liquidity", () => {
    expect(pickPoolForVolume({ a: entry("a", 0n, someTicks) })).toBeUndefined();
    expect(pickPoolForVolume({})).toBeUndefined();
  });
});

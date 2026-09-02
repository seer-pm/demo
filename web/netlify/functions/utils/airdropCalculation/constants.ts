import { gnosis, mainnet } from "viem/chains";

export const SER_LPP = {
  [gnosis.id]: "0xa7a7f8d1770c08e2e1f55d8c6427c1f8213a34da",
  [mainnet.id]: "0xd14ef697281404646d8e2437a0050794a6a22fd6",
};

/** First airdrop snapshot: October 11, 2024. */
export const GENESIS_TIMESTAMP = 1728579600;

/** 200M SEER over 30 days. */
export const SEER_PER_DAY = 200000000 / 30;

/**
 * Share of the daily emission going to the holdings pool and to the PoH pool respectively.
 *
 * The two together are 50% of the whole airdrop. The other 50% is the SER LPP liquidity program,
 * which is a separate calculation entirely — `ser-lpp-calculation-background.ts` only snapshots raw
 * LP token balances and computes no SEER allocation.
 */
export const POOL_SHARE_FACTOR = 0.25;

/**
 * Number of daily snapshots the program has emitted through `lastTimestamp`.
 *
 * Derived from genesis rather than counted in SQL on purpose: `airdrops` has no index on
 * `timestamp` alone (only `(address, timestamp)`, see supabase/sql/airdrops_indexes.sql), so a
 * `count(distinct "timestamp")` over one row per user per day would be a sequential scan and risks
 * the same statement timeout `get_airdrop_summary_by_user` exists to avoid. One snapshot is written
 * per UTC day and `airdrop-calculation-background` backfills any day it missed, so counting days is
 * equivalent to counting snapshots.
 */
export function countSnapshotDays(lastTimestamp: number): number {
  if (!Number.isFinite(lastTimestamp) || lastTimestamp < GENESIS_TIMESTAMP) {
    return 0;
  }
  return Math.floor((lastTimestamp - GENESIS_TIMESTAMP) / 86400) + 1;
}

/**
 * An allocation as a percentage of the WHOLE airdrop emitted over `snapshotDays`, LP program
 * included.
 *
 * `allocation` is one pool's SEER or both pools' together — the denominator is the same either
 * way, which is what lets the leaderboard's holdings and PoH columns be read side by side and
 * added. Every day the program emits `SEER_PER_DAY` in total, of which these two pools take half
 * (`POOL_SHARE_FACTOR` each), so over `snapshotDays` days the whole airdrop is
 * `snapshotDays * SEER_PER_DAY` and this is simply the user's slice of it. One pool taken entirely
 * is 25%; a tenth of the PoH pool is 2.5%. `SEER_PER_DAY` cancels
 * between numerator and denominator, which is what makes this number trustworthy while the absolute
 * SEER figures are not: `SEER_PER_DAY` is defined as 200M over 30 days, but snapshots have accrued
 * daily since genesis with no stop, so the amounts run far above the nominal budget. A share is
 * immune to that; an amount is not.
 *
 * Returns 0 rather than dividing by zero before the first snapshot exists.
 */
export function computePctOfAirdrop(allocation: number, snapshotDays: number): number {
  if (snapshotDays <= 0) {
    return 0;
  }
  return (allocation / (snapshotDays * SEER_PER_DAY)) * 100;
}

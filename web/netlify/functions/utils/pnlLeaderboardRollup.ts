import { capitalUsdFromRow, roiFromCapitalUsd } from "./pnlLeaderboardMetrics";
import { type OwnerMap, canonicalAddress } from "./tradeExecutorOwnersCore";

export type LeaderboardCandidate = {
  address: string;
  /** UTC day of this wallet's most recent analytics activity; 0 when unknown. */
  lastActivityDay?: number;
};

/** One materialized row from `pnl_leaderboard` before executor rollup. */
export type MaterializedLeaderboardRow = {
  address: string;
  chainId: number;
  pnlUsd: number;
  volumeUsd: number;
  valueStart: number;
  /** Native primary put to work (swap buys + scoped splits). */
  capitalDeployed: number;
  collateralPriceUsd: number;
  marketCount: number;
  updatedAt: string | null;
};

/** Rolled-up row shown on the public leaderboard (one participant). */
export type RolledUpLeaderboardRow = {
  address: string;
  pnlUsd: number;
  volumeUsd: number;
  capitalUsd: number;
  marketCount: number;
  updatedAt: string | null;
  roi: number | null;
  /** Every address merged into this row, including the canonical owner. */
  members: string[];
};

export type LeaderboardSortKey = "pnl" | "volume" | "roi" | "markets";
export type LeaderboardSortDir = "asc" | "desc";

export const LEADERBOARD_SORT_KEYS: readonly LeaderboardSortKey[] = ["pnl", "volume", "roi", "markets"];
export const LEADERBOARD_SORT_DIRS: readonly LeaderboardSortDir[] = ["asc", "desc"];

function metricValue(row: RolledUpLeaderboardRow, sort: LeaderboardSortKey): number | null {
  switch (sort) {
    case "pnl":
      return row.pnlUsd;
    case "volume":
      return row.volumeUsd;
    case "roi":
      return row.roi;
    case "markets":
      return row.marketCount;
  }
}

/**
 * Compare two rolled-up rows for ranking.
 * ROI nulls (capital dust) always sort last, regardless of direction. Address is the tie-break.
 */
export function compareLeaderboardRows(
  a: RolledUpLeaderboardRow,
  b: RolledUpLeaderboardRow,
  sort: LeaderboardSortKey,
  dir: LeaderboardSortDir,
): number {
  const aVal = metricValue(a, sort);
  const bVal = metricValue(b, sort);
  const aNull = aVal == null || !Number.isFinite(aVal);
  const bNull = bVal == null || !Number.isFinite(bVal);
  if (aNull && bNull) return a.address.localeCompare(b.address);
  if (aNull) return 1;
  if (bNull) return -1;

  const cmp = aVal - bVal;
  if (cmp !== 0) return dir === "asc" ? cmp : -cmp;
  return a.address.localeCompare(b.address);
}

export function sortLeaderboardRows(
  rows: RolledUpLeaderboardRow[],
  sort: LeaderboardSortKey,
  dir: LeaderboardSortDir,
): RolledUpLeaderboardRow[] {
  return [...rows].sort((a, b) => compareLeaderboardRows(a, b, sort, dir));
}

function capitalUsdForRow(row: MaterializedLeaderboardRow): number {
  return capitalUsdFromRow({
    capitalDeployed: row.capitalDeployed,
    collateralPriceUsd: row.collateralPriceUsd,
  });
}

const DAY_SECONDS = 86_400;

/** Where a candidate sits in the refresh queue. Lower runs first. */
export type RefreshPriority = 0 | 1 | 2;

/**
 * Order candidates for refresh: never materialized, then dirty, then oldest.
 *
 * The previous selection was "any wallet with analytics activity in the last 5 UTC days, oldest
 * `updated_at` first". That window is the wrong instrument twice over:
 *
 * - it **excludes** wallets whose last activity is older than the window but which have never been
 *   computed, or were computed before that activity. Measured on production, it left optimism with
 *   5 wallet-days of candidates and base with 0, so those boards were effectively frozen;
 * - it **includes** wallets already recomputed after their last activity, which cost a full pass to
 *   reproduce the same numbers.
 *
 * Dirty means "activity on or after the day we last materialized this wallet". Mark-to-market still
 * drifts without activity, so wallets that are merely old keep their place in the queue behind the
 * dirty ones rather than being dropped.
 */
export function refreshPriority(args: {
  lastActivityDay: number;
  lastUpdatedMs: number | null;
}): RefreshPriority {
  if (args.lastUpdatedMs == null) return 0;
  const lastUpdatedDay = Math.floor(args.lastUpdatedMs / 1000 / DAY_SECONDS) * DAY_SECONDS;
  return args.lastActivityDay >= lastUpdatedDay ? 1 : 2;
}

export function rankRefreshCandidates(
  candidates: LeaderboardCandidate[],
  lastUpdatedMsByAddress: Map<string, number | null>,
): LeaderboardCandidate[] {
  const keyed = candidates.map((candidate) => {
    const address = candidate.address.toLowerCase();
    const lastUpdatedMs = lastUpdatedMsByAddress.get(address) ?? null;
    return {
      candidate,
      priority: refreshPriority({ lastActivityDay: candidate.lastActivityDay ?? 0, lastUpdatedMs }),
      lastUpdatedMs,
      address,
    };
  });

  keyed.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    // Within a tier, oldest first; never-materialized rows have no timestamp to compare.
    const aMs = a.lastUpdatedMs ?? Number.NEGATIVE_INFINITY;
    const bMs = b.lastUpdatedMs ?? Number.NEGATIVE_INFINITY;
    if (aMs !== bMs) return aMs - bMs;
    return a.address.localeCompare(b.address);
  });

  return keyed.map((k) => k.candidate);
}

/**
 * Add each candidate's trade-executor contracts to the refresh list.
 *
 * Analytics keys off tx sender; executors hold outcome tokens but never appear as candidates.
 */
export function withExecutors(candidates: LeaderboardCandidate[], owners: OwnerMap): LeaderboardCandidate[] {
  const set = new Set(candidates.map((candidate) => candidate.address.toLowerCase()));
  for (const [executor, owner] of Object.entries(owners)) {
    if (set.has(owner)) set.add(executor);
  }
  return [...set].sort().map((address) => ({ address }));
}

/**
 * Collapse executor rows into the owner EOA, summing additive metrics and recomputing ROI.
 */
export function rollUpRows(rows: MaterializedLeaderboardRow[], owners: OwnerMap): RolledUpLeaderboardRow[] {
  const groups = new Map<string, MaterializedLeaderboardRow[]>();
  for (const row of rows) {
    const canonical = canonicalAddress(row.address, owners);
    if (!groups.has(canonical)) groups.set(canonical, []);
    groups.get(canonical)!.push({ ...row, address: row.address.toLowerCase() });
  }

  return [...groups.entries()].map(([address, group]) => {
    const pnlUsd = group.reduce((total, row) => total + row.pnlUsd, 0);
    const volumeUsd = group.reduce((total, row) => total + row.volumeUsd, 0);
    const marketCount = group.reduce((total, row) => total + row.marketCount, 0);
    const capitalUsd = group.reduce((total, row) => total + capitalUsdForRow(row), 0);
    const updatedAt =
      group.reduce<string | null>((latest, row) => {
        if (!row.updatedAt) return latest;
        if (!latest || row.updatedAt > latest) return row.updatedAt;
        return latest;
      }, null) ?? null;

    return {
      address,
      pnlUsd,
      volumeUsd,
      capitalUsd,
      marketCount,
      updatedAt,
      roi: roiFromCapitalUsd(pnlUsd, capitalUsd),
      members: group.map((row) => row.address),
    };
  });
}

/** Sum rolled-up or per-chain rows that share the same address (all-chains view). */
export function aggregateRowsAcrossChains(rows: RolledUpLeaderboardRow[]): RolledUpLeaderboardRow[] {
  const groups = new Map<string, RolledUpLeaderboardRow[]>();
  for (const row of rows) {
    const key = row.address.toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  return [...groups.entries()].map(([address, group]) => {
    const pnlUsd = group.reduce((total, row) => total + row.pnlUsd, 0);
    const volumeUsd = group.reduce((total, row) => total + row.volumeUsd, 0);
    const capitalUsd = group.reduce((total, row) => total + row.capitalUsd, 0);
    const marketCount = group.reduce((total, row) => total + row.marketCount, 0);
    const members = [...new Set(group.flatMap((row) => row.members))].sort();
    const updatedAt =
      group.reduce<string | null>((latest, row) => {
        if (!row.updatedAt) return latest;
        if (!latest || row.updatedAt > latest) return row.updatedAt;
        return latest;
      }, null) ?? null;

    return {
      address,
      pnlUsd,
      volumeUsd,
      capitalUsd,
      marketCount,
      updatedAt,
      roi: roiFromCapitalUsd(pnlUsd, capitalUsd),
      members,
    };
  });
}

/** Match a hex fragment against any merged wallet, not only the canonical row address. */
export function matchesAddressSearch(row: RolledUpLeaderboardRow, searchHex: string): boolean {
  return row.members.some((member) => member.includes(searchHex));
}

export function rankForAddress(
  rows: RolledUpLeaderboardRow[],
  address: string,
): {
  address: string;
  rank: number | null;
  total: number;
} {
  const lower = address.toLowerCase();
  const index = rows.findIndex((row) => row.members.includes(lower) || row.address === lower);
  return { address: lower, rank: index === -1 ? null : index + 1, total: rows.length };
}

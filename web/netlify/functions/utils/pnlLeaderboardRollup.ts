import { capitalUsdFromRow, roiFromCapitalUsd } from "./pnlLeaderboardMetrics";
import { type OwnerMap, canonicalAddress } from "./tradeExecutorOwnersCore";
import { type TraderScoreBreakdown, computeTraderScore } from "./traderScore";

export type LeaderboardCandidate = {
  address: string;
  /** UTC day of this wallet's most recent analytics activity; 0 when unknown. */
  lastActivityDay?: number;
};

/**
 * Trader score sufficient statistics, in USD.
 *
 * Every field merges with `+` except `bestMarketPnlUsd`, which merges with `Math.max` (a max over a
 * union is the max of the per-set maxes). That is what lets the score be derived *after* the
 * executor and cross-chain merges instead of being stored per row — see `traderScore.ts`.
 */
export type TraderScoreStats = {
  scoredMarketCount: number;
  winningMarketCount: number;
  grossProfitUsd: number;
  grossLossUsd: number;
  bestMarketPnlUsd: number;
  /**
   * Capital at risk over those same scored markets — the score's own denominator, narrower than the
   * row's `capitalDeployed`, which spans every market. See `traderScore.ts`.
   */
  scoredCapitalUsd: number;
};

/** One materialized row from `pnl_leaderboard` before executor rollup. */
export type MaterializedLeaderboardRow = TraderScoreStats & {
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
export type RolledUpLeaderboardRow = TraderScoreStats & {
  address: string;
  pnlUsd: number;
  volumeUsd: number;
  capitalUsd: number;
  marketCount: number;
  updatedAt: string | null;
  roi: number | null;
  /** Null when the wallet does not clear the eligibility gate. Sorts last, like a null `roi`. */
  score: number | null;
  scoreBreakdown: TraderScoreBreakdown | null;
  /** Every address merged into this row, including the canonical owner. */
  members: string[];
};

export type LeaderboardSortKey = "pnl" | "volume" | "roi" | "markets" | "score";
export type LeaderboardSortDir = "asc" | "desc";

export const LEADERBOARD_SORT_KEYS: readonly LeaderboardSortKey[] = ["pnl", "volume", "roi", "markets", "score"];

/**
 * What `get-market-pnl-leaderboard` accepts. Deliberately narrower than the global board's set.
 *
 * That endpoint scores a page *after* paginating (a per-market score would be meaningless — one
 * market means the eligibility gate can never be met), so it cannot rank by score. Sharing one
 * constant would have it accept `sort=score` and silently rank by something else.
 */
export const MARKET_LEADERBOARD_SORT_KEYS: readonly LeaderboardSortKey[] = ["pnl", "volume", "roi", "markets"];

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
    case "score":
      return row.score;
  }
}

/** Merge score statistics across executor wallets, app scopes or chains. */
export function mergeScoreStats(items: readonly TraderScoreStats[]): TraderScoreStats {
  const merged: TraderScoreStats = {
    scoredMarketCount: 0,
    winningMarketCount: 0,
    grossProfitUsd: 0,
    grossLossUsd: 0,
    bestMarketPnlUsd: 0,
    scoredCapitalUsd: 0,
  };
  for (const item of items) {
    merged.scoredMarketCount += item.scoredMarketCount;
    merged.winningMarketCount += item.winningMarketCount;
    merged.grossProfitUsd += item.grossProfitUsd;
    merged.grossLossUsd += item.grossLossUsd;
    merged.bestMarketPnlUsd = Math.max(merged.bestMarketPnlUsd, item.bestMarketPnlUsd);
    merged.scoredCapitalUsd += item.scoredCapitalUsd;
  }
  return merged;
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
      priority: refreshPriority({
        lastActivityDay: candidate.lastActivityDay ?? 0,
        lastUpdatedMs,
      }),
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
 *
 * `lastActivityDay` has to survive this: `rankRefreshCandidates` reads it back, and dropping it
 * pins every already-materialized wallet in the trailing tier, which is exactly the starvation the
 * tiering exists to prevent. A synthesized executor inherits its owner's day — it has no analytics
 * activity of its own, it moves when the owner moves.
 */
export function withExecutors(candidates: LeaderboardCandidate[], owners: OwnerMap): LeaderboardCandidate[] {
  const byAddress = new Map<string, LeaderboardCandidate>();
  for (const candidate of candidates) {
    const address = candidate.address.toLowerCase();
    const previous = byAddress.get(address);
    byAddress.set(address, {
      address,
      lastActivityDay: Math.max(previous?.lastActivityDay ?? 0, candidate.lastActivityDay ?? 0),
    });
  }
  for (const [executor, owner] of Object.entries(owners)) {
    const ownerCandidate = byAddress.get(owner);
    if (!ownerCandidate) continue;
    const address = executor.toLowerCase();
    if (byAddress.has(address)) continue;
    byAddress.set(address, {
      address,
      lastActivityDay: ownerCandidate.lastActivityDay ?? 0,
    });
  }
  return [...byAddress.values()].sort((a, b) => a.address.localeCompare(b.address));
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

    const stats = mergeScoreStats(group);
    const scoreBreakdown = computeTraderScore({ ...stats, pnlUsd });

    return {
      address,
      pnlUsd,
      volumeUsd,
      capitalUsd,
      marketCount,
      updatedAt,
      roi: roiFromCapitalUsd(pnlUsd, capitalUsd),
      ...stats,
      score: scoreBreakdown?.score ?? null,
      scoreBreakdown,
      members: group.map((row) => row.address),
    };
  });
}

/**
 * The wallets whose global rows make up each page row's protocol-wide score, keyed by row address.
 *
 * A page row on the market board only knows the wallets that traded *that* market, and its
 * `address` is the canonical owner, which need not have traded it at all. The score shown there is
 * the trader's protocol-wide one, so the global lookup has to cover every wallet the owner
 * controls — including executors whose trading happened in other markets. Miss one and the same
 * trader reads a different score on the market board than on the global board.
 */
export function globalScoreWallets(
  rows: readonly { address: string; members: readonly string[] }[],
  owners: OwnerMap,
): Map<string, string[]> {
  const walletsByOwner = new Map<string, string[]>();
  for (const [executor, owner] of Object.entries(owners)) {
    const key = owner.toLowerCase();
    const list = walletsByOwner.get(key);
    if (list) list.push(executor.toLowerCase());
    else walletsByOwner.set(key, [executor.toLowerCase()]);
  }

  return new Map(
    rows.map((row) => {
      const address = row.address.toLowerCase();
      const wallets = new Set([address, ...row.members.map((member) => member.toLowerCase())]);
      for (const wallet of walletsByOwner.get(address) ?? []) wallets.add(wallet);
      return [row.address, [...wallets]];
    }),
  );
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

    const stats = mergeScoreStats(group);
    const scoreBreakdown = computeTraderScore({ ...stats, pnlUsd });

    return {
      address,
      pnlUsd,
      volumeUsd,
      capitalUsd,
      marketCount,
      updatedAt,
      roi: roiFromCapitalUsd(pnlUsd, capitalUsd),
      ...stats,
      score: scoreBreakdown?.score ?? null,
      scoreBreakdown,
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
  return {
    address: lower,
    rank: index === -1 ? null : index + 1,
    total: rows.length,
  };
}

import { capitalUsdFromRow, roiFromCapitalUsd } from "./pnlLeaderboardMetrics";
import { type OwnerMap, canonicalAddress } from "./tradeExecutorOwnersCore";

export type LeaderboardCandidate = {
  address: string;
};

/** One materialized row from `pnl_leaderboard` before executor rollup. */
export type MaterializedLeaderboardRow = {
  address: string;
  chainId: number;
  pnlUsd: number;
  volumeUsd: number;
  /** Native primary-collateral gross swap volume (buy + sell). */
  volume: number;
  valueStart: number;
  tradingCollateralNetOut: number;
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

function capitalUsdForRow(row: MaterializedLeaderboardRow): number {
  return capitalUsdFromRow({
    valueStart: row.valueStart,
    volume: row.volume,
    tradingCollateralNetOut: row.tradingCollateralNetOut,
    collateralPriceUsd: row.collateralPriceUsd,
  });
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

  return [...groups.entries()]
    .map(([address, group]) => {
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
    })
    .sort((a, b) => b.pnlUsd - a.pnlUsd || a.address.localeCompare(b.address));
}

/** Sum rolled-up or per-chain rows that share the same address (all-chains view). */
export function aggregateRowsAcrossChains(rows: RolledUpLeaderboardRow[]): RolledUpLeaderboardRow[] {
  const groups = new Map<string, RolledUpLeaderboardRow[]>();
  for (const row of rows) {
    const key = row.address.toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  return [...groups.entries()]
    .map(([address, group]) => {
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
    })
    .sort((a, b) => b.pnlUsd - a.pnlUsd || a.address.localeCompare(b.address));
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

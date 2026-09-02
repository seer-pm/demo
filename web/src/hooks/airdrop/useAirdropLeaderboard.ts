import type { SortDir } from "@/components/Leaderboard/SortableHeader";
import type { LeaderboardPeriod } from "@/lib/leaderboardPeriods";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

/** `lpp` only applies to the "all" period; every other period stores 0 for every wallet. */
export type AirdropSortKey = "seer" | "holdings" | "poh" | "lpp" | "days";

export interface AirdropLeaderboardRow {
  /** Position on the whole board — correct even while a search filter is applied. */
  rank: number;
  address: string;
  /** What the board ranks on and shows as Total: `seer` + `serLpp`. */
  total: number;
  /** SEER from the daily airdrop emission in the period — holdings + PoH, no SER-LPP. */
  seer: number;
  /**
   * SEER from the SER liquidity program: a current cumulative balance across Gnosis and Mainnet,
   * in the same unit as `seer`. `null` outside the 'all' period, where a running balance cannot
   * be attributed to a window.
   */
  serLpp: number | null;
  /** SEER from outcome-token holdings. */
  holdings: number;
  /** SEER from the Proof of Humanity pool. */
  poh: number;
  isPoh: boolean;
  /** Daily snapshots this wallet appears in within the period. */
  days: number;
  /**
   * `holdings` and `poh` each as a percentage of the whole airdrop emitted over this period, the
   * SER LPP liquidity programme included. Holdings and PoH take a quarter each, so a tenth of the
   * PoH pool reads as 2.5% and neither can exceed 25%. Same denominator for both, so the two add
   * up to the wallet's share of everything emitted.
   */
  pctOfHoldings: number;
  pctOfPoh: number;
  updatedAt: string | null;
}

export interface AirdropLeaderboardResponse {
  period: LeaderboardPeriod;
  sort: AirdropSortKey;
  dir: SortDir;
  unit: "SEER";
  /** Snapshot days the percentages are measured over — the period's window, not the wallet's. */
  snapshotDays: number;
  updatedAt: string | null;
  /** Rows matching the current search; drives pagination. */
  total: number;
  /** Rows on the board, ignoring the search. */
  boardTotal: number;
  limit: number;
  offset: number;
  rows: AirdropLeaderboardRow[];
}

export interface AirdropRankResponse {
  address: string;
  rank: number | null;
  total: number;
}

export class AirdropLeaderboardError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AirdropLeaderboardError";
  }
}

const ENDPOINT = "/.netlify/functions/get-airdrop-leaderboard";

async function getJson<T>(qs: URLSearchParams): Promise<T> {
  const res = await fetch(`${ENDPOINT}?${qs.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data as { error?: string }).error) {
    throw new AirdropLeaderboardError(
      (data as { error?: string }).error ?? `Request failed (${res.status})`,
      res.status,
    );
  }
  return data as T;
}

/**
 * URL of the CSV export for the current view. The endpoint ignores limit/offset in this mode and
 * streams every matching row, so this covers the whole board rather than the visible page.
 *
 * Handed to a plain <a download> rather than fetched: the browser then streams straight to disk,
 * and the filename comes from the response's Content-Disposition.
 */
export function airdropLeaderboardCsvUrl(params: {
  period: LeaderboardPeriod;
  sort: AirdropSortKey;
  dir: SortDir;
  search: string;
}): string {
  const qs = new URLSearchParams({
    period: params.period,
    sort: params.sort,
    dir: params.dir,
    format: "csv",
  });
  if (params.search) qs.set("search", params.search);
  return `${ENDPOINT}?${qs.toString()}`;
}

export interface AirdropLeaderboardParams {
  period: LeaderboardPeriod;
  sort: AirdropSortKey;
  dir: SortDir;
  search: string;
  limit: number;
  offset: number;
}

export const useAirdropLeaderboard = (params: AirdropLeaderboardParams) => {
  return useQuery<AirdropLeaderboardResponse, AirdropLeaderboardError>({
    queryKey: [
      "useAirdropLeaderboard",
      params.period,
      params.sort,
      params.dir,
      params.search,
      params.limit,
      params.offset,
    ],
    staleTime: 60_000,
    // Keep the previous page visible while switching period/sort/page instead of flashing empty.
    placeholderData: keepPreviousData,
    retry: (failureCount, error) => failureCount < 3 && (error.status ?? 500) >= 500,
    retryDelay: (attempt) => Math.min(8000, 1000 * 2 ** attempt),
    queryFn: () => {
      const qs = new URLSearchParams({
        period: params.period,
        sort: params.sort,
        dir: params.dir,
        limit: String(params.limit),
        offset: String(params.offset),
      });
      if (params.search) qs.set("search", params.search);
      return getJson<AirdropLeaderboardResponse>(qs);
    },
  });
};

/**
 * Imperative rank lookup for the "Your Rank" button — same shape as the P&L page's fetchMyRank.
 * Returns the wallet's position on the board so the caller can jump to the right page.
 */
export async function fetchAirdropRank(params: {
  period: LeaderboardPeriod;
  sort: AirdropSortKey;
  dir: SortDir;
  address: string;
}): Promise<AirdropRankResponse> {
  const qs = new URLSearchParams({
    period: params.period,
    sort: params.sort,
    dir: params.dir,
    rankFor: params.address.toLowerCase(),
  });
  return getJson<AirdropRankResponse>(qs);
}

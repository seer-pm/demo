/**
 * Timeframes shared by both leaderboards.
 *
 * The P&L board reads these off the materialized `pnl_leaderboard.period` column; the airdrop
 * board reads `airdrop_leaderboard.period`. Both DB CHECK constraints list exactly these four,
 * so adding one here means changing both tables and both endpoints.
 */
export const LEADERBOARD_PERIODS = ["1d", "1w", "1m", "all"] as const;

export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];

export const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  "1d": "1D",
  "1w": "1W",
  "1m": "1M",
  all: "ALL",
};

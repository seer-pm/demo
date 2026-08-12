import { createClient } from "@supabase/supabase-js";
import {
  PNL_LEADERBOARD_REFRESH_BUDGET_MS,
  listPnlLeaderboardRefreshJobs,
  refreshPnlLeaderboardForAppChain,
} from "./utils/pnlLeaderboard";
import type { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

/**
 * Background refresh of materialized PnL leaderboard rows.
 * Triggered by `scheduled-refresh-pnl-leaderboard` (or manually).
 *
 * Always refreshes protocol-wide `app=all` per supported chain (every market, including those
 * not assigned to any app). App-scoped jobs run only when `SEER_APPS` lists markets.
 *
 * Each job refreshes a stale/missing batch among wallets with recent activity (last 5d);
 * a global time budget aborts cleanly before Netlify's ~15m background limit so the next
 * schedule can continue the rotation.
 */
export default async () => {
  if (process.env.DISABLE_SCHEDULED_FUNCTIONS === "true") {
    console.log("refresh-pnl-leaderboard-background: disabled");
    return;
  }

  const jobs = listPnlLeaderboardRefreshJobs();
  if (jobs.length === 0) {
    console.log("refresh-pnl-leaderboard-background: no jobs (unexpected — all chains should always enqueue)");
    return;
  }

  const startedAt = Date.now();
  const deadlineMs = startedAt + PNL_LEADERBOARD_REFRESH_BUDGET_MS;

  console.log(
    `refresh-pnl-leaderboard-background: starting ${jobs.length} job(s) budgetMs=${PNL_LEADERBOARD_REFRESH_BUDGET_MS}`,
  );
  const results = [];
  for (const job of jobs) {
    if (Date.now() >= deadlineMs) {
      console.log(
        `refresh-pnl-leaderboard-background: budget exhausted before job ${job.appId} chain=${job.chainId}; deferring remaining jobs`,
      );
      break;
    }

    const scope = job.marketIds === undefined ? "global" : `${job.marketIds.length} allowlisted root(s)`;
    console.log(`refresh-pnl-leaderboard-background: ${job.appId} chain=${job.chainId} scope=${scope}`);
    try {
      const result = await refreshPnlLeaderboardForAppChain(supabase, job.appId, job.chainId, job.marketIds, {
        deadlineMs,
      });
      results.push(result);
      console.log("refresh-pnl-leaderboard-background: done", result);

      if (result.abortedByBudget) {
        console.log("refresh-pnl-leaderboard-background: aborted mid-job by budget; remaining jobs deferred");
        break;
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error(`refresh-pnl-leaderboard-background: skipped job ${job.appId} chain=${job.chainId}:`, error);
      results.push({ appId: job.appId, chainId: job.chainId, error, skipped: true });
    }
  }

  console.log(
    "refresh-pnl-leaderboard-background: finished",
    JSON.stringify({
      elapsedMs: Date.now() - startedAt,
      results,
    }),
  );
};

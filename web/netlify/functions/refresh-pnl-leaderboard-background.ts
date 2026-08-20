import { createClient } from "@supabase/supabase-js";
import { requireBackgroundSecret } from "./utils/backgroundAuth";
import {
  PNL_LEADERBOARD_REFRESH_BUDGET_MS,
  listPnlLeaderboardRefreshJobs,
  loadPnlLeaderboardRefreshCursor,
  nextJobIndexAfterCursor,
  refreshPnlLeaderboardForAppChain,
  savePnlLeaderboardRefreshCursor,
} from "./utils/pnlLeaderboard";
import type { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

/**
 * Background refresh of materialized PnL leaderboard rows.
 * Triggered by `scheduled-refresh-pnl-leaderboard` (or manually).
 *
 * Always refreshes protocol-wide `app=all` per supported chain (every market, including those
 * not assigned to any app). App-scoped jobs come from `leaderboardJobsFromApps` (per-market
 * when `splitLeaderboard`, else one union board per app×chain).
 *
 * Each job refreshes a stale/missing batch among wallets with analytics activity;
 * a global time budget aborts cleanly before Netlify's ~15m background limit so the next
 * schedule can continue the (app, chain) ring from a persisted cursor.
 */
export default async (req: Request) => {
  if (process.env.DISABLE_SCHEDULED_FUNCTIONS === "true") {
    console.log("refresh-pnl-leaderboard-background: disabled");
    return;
  }

  const unauthorized = requireBackgroundSecret(req);
  if (unauthorized) {
    return unauthorized;
  }

  const jobs = listPnlLeaderboardRefreshJobs();
  if (jobs.length === 0) {
    console.log("refresh-pnl-leaderboard-background: no jobs (unexpected — all chains should always enqueue)");
    return;
  }

  const cursor = await loadPnlLeaderboardRefreshCursor(supabase);
  const startIndex = nextJobIndexAfterCursor(jobs, cursor);

  const startedAt = Date.now();
  const deadlineMs = startedAt + PNL_LEADERBOARD_REFRESH_BUDGET_MS;

  console.log(
    `refresh-pnl-leaderboard-background: starting ${jobs.length} job(s) from ${jobs[startIndex].appId} chain=${jobs[startIndex].chainId} budgetMs=${PNL_LEADERBOARD_REFRESH_BUDGET_MS}`,
  );
  const results = [];
  for (let n = 0; n < jobs.length; n++) {
    if (Date.now() >= deadlineMs) {
      const deferred = jobs[(startIndex + n) % jobs.length];
      console.log(
        `refresh-pnl-leaderboard-background: budget exhausted before job ${deferred.appId} chain=${deferred.chainId}; deferring remaining jobs`,
      );
      break;
    }

    const job = jobs[(startIndex + n) % jobs.length];
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
        await persistCursor(job);
        break;
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error(`refresh-pnl-leaderboard-background: skipped job ${job.appId} chain=${job.chainId}:`, error);
      results.push({ appId: job.appId, chainId: job.chainId, error, skipped: true });
    }

    await persistCursor(job);
  }

  console.log(
    "refresh-pnl-leaderboard-background: finished",
    JSON.stringify({
      elapsedMs: Date.now() - startedAt,
      results,
    }),
  );
};

async function persistCursor(job: { appId: string; chainId: number }) {
  try {
    await savePnlLeaderboardRefreshCursor(supabase, job);
  } catch (e) {
    console.error("refresh-pnl-leaderboard-background: failed to persist rotation cursor", e);
  }
}

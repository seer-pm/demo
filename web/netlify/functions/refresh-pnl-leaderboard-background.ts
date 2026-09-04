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
import { hasTradeExecutorConfig } from "./utils/tradeExecutorOwnersCore";

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
 *
 * Overrides: `?appId`, `?chainId`, `?batchSize`, `?accounts=0x..,0x..` (recompute exactly these),
 * and `?ownerGroups=1` (walk the TradeExecutor owner map instead of the analytics candidates — the
 * backfill for owner-grouped score statistics). None of them move the shared ring cursor.
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

  // Operational overrides. Without them the only way to exercise one job is to wait for the ring
  // cursor to reach it, which can take hours.
  const url = new URL(req.url);
  const onlyAppId = url.searchParams.get("appId");
  const onlyChainId = url.searchParams.get("chainId");
  const batchSizeOverride = Number(url.searchParams.get("batchSize")) || undefined;
  // `?accounts=0x..,0x..` recomputes exactly these wallets. Needed to repair specific rows without
  // waiting for the rotation to reach them.
  const accountsParam = url.searchParams.get("accounts");
  const explicitAccounts = (accountsParam ?? "")
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter((a) => /^0x[0-9a-f]{40}$/.test(a));
  // A typo would otherwise fall through to the full rotation: no repair, the whole budget spent on
  // the wrong wallets, and the shared ring cursor advanced. Refuse instead of guessing.
  if (accountsParam !== null && explicitAccounts.length === 0) {
    return new Response(
      JSON.stringify({ error: "accounts was given but contains no valid 0x-prefixed 40-hex address" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // `?ownerGroups=1` recomputes the wallets in the chain's TradeExecutor owner map. Their stored
  // score statistics are *wrong* rather than missing — they were gathered per wallet, before the
  // owner merge — so unlike a new column they cannot heal by failing the eligibility gate.
  const ownerGroups = url.searchParams.get("ownerGroups") === "1";
  if (ownerGroups && explicitAccounts.length > 0) {
    return new Response(JSON.stringify({ error: "ownerGroups and accounts are mutually exclusive" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const jobs = listPnlLeaderboardRefreshJobs().filter(
    (job) =>
      (onlyAppId ? job.appId === onlyAppId : true) &&
      (onlyChainId ? job.chainId === Number(onlyChainId) : true) &&
      // Every other chain has an empty owner map, so the job would claim no candidates at all.
      (ownerGroups ? hasTradeExecutorConfig(job.chainId) : true),
  );
  if (jobs.length === 0) {
    console.log(
      ownerGroups
        ? "refresh-pnl-leaderboard-background: no jobs on a TradeExecutor chain for ownerGroups"
        : "refresh-pnl-leaderboard-background: no jobs (unexpected — all chains should always enqueue)",
    );
    return;
  }

  // A filtered run must not move the shared ring cursor, or it would skip whatever the scheduled
  // run was about to pick up next.
  const filtered = onlyAppId != null || onlyChainId != null || explicitAccounts.length > 0 || ownerGroups;
  const cursor = filtered ? null : await loadPnlLeaderboardRefreshCursor(supabase);
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
        batchSize: batchSizeOverride,
        ...(explicitAccounts.length > 0 ? { candidates: explicitAccounts.map((address) => ({ address })) } : {}),
        ...(ownerGroups ? { candidateSource: "ownerMap" as const } : {}),
      });
      results.push(result);
      console.log("refresh-pnl-leaderboard-background: done", result);

      if (result.abortedByBudget) {
        console.log("refresh-pnl-leaderboard-background: aborted mid-job by budget; remaining jobs deferred");
        if (!filtered) await persistCursor(job);
        break;
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.error(`refresh-pnl-leaderboard-background: skipped job ${job.appId} chain=${job.chainId}:`, error);
      results.push({ appId: job.appId, chainId: job.chainId, error, skipped: true });
    }

    if (!filtered) await persistCursor(job);
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

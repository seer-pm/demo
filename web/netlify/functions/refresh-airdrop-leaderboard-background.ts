import { createClient } from "@supabase/supabase-js";
import { requireBackgroundSecret } from "./utils/backgroundAuth";
import type { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

/**
 * Cheapest window first, 'all' last.
 *
 * 'all' is the only full-table aggregate, so it is the one that can exhaust the statement
 * timeout. Running it last means a failure there still leaves 1d/1w/1m rebuilt for the day
 * rather than nothing.
 */
const PERIODS = ["1d", "1w", "1m", "all"] as const;

/**
 * Rebuilds `airdrop_leaderboard` from `airdrops`, one period per RPC call.
 *
 * Deliberately a separate job from `airdrop-calculation-background` rather than a tail call
 * inside it:
 *   - that job already budgets 13 of Netlify's 15 background minutes for its load phase
 *     (LOAD_BUDGET_MS), so appending a multi-minute 'all' aggregate could push a catch-up run
 *     over the ceiling and lose the day's airdrop rows, which are the irreplaceable output;
 *   - it re-throws on failure, so anything appended after it would be skipped exactly when the
 *     board most needs rebuilding;
 *   - running on its own schedule makes the refresh self-healing — it rebuilds whether or not
 *     the airdrop job inserted a new day, so a freshly applied table populates on the next tick
 *     and the sliding windows stay correct across skipped days.
 *
 * This mirrors refresh-pnl-leaderboard-background / scheduled-refresh-pnl-leaderboard.
 *
 * Writes require SUPABASE_API_KEY = service_role; anon/authenticated are SELECT-only on the
 * table and have no EXECUTE on the refresh RPC.
 */
async function refreshAllPeriods(): Promise<void> {
  const failures: string[] = [];

  for (const period of PERIODS) {
    const startedAt = Date.now();
    // Not wrapped in withRetry: each call rewrites a whole period, and blindly retrying a write
    // that may have partly applied is worse than leaving the board a day stale.
    const { data, error } = await supabase.rpc("refresh_airdrop_leaderboard", { p_period: period });

    if (error) {
      // Keep going: a later period failing must not discard the ones already rebuilt.
      failures.push(`${period}: ${error.message}`);
      console.error(`refresh_airdrop_leaderboard(${period}) failed:`, error.message);
      continue;
    }
    console.log(`refresh_airdrop_leaderboard(${period}): ${data ?? 0} rows in ${Date.now() - startedAt}ms`);
  }

  if (failures.length > 0) {
    throw new Error(`refresh_airdrop_leaderboard failed for ${failures.length} period(s): ${failures.join("; ")}`);
  }
}

export default async (req: Request) => {
  const unauthorized = requireBackgroundSecret(req);
  if (unauthorized) {
    return unauthorized;
  }

  if (process.env.DISABLE_SCHEDULED_FUNCTIONS === "true") {
    return;
  }

  await refreshAllPeriods();
};

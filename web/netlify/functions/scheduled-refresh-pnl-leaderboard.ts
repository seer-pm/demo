import { SEER_APP_ALL_ID } from "@/lib/apps";
import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { backgroundSecretHeaders } from "./utils/backgroundAuth";
import type { Database } from "./utils/supabase";

const REFRESH_PATH = "/.netlify/functions/refresh-pnl-leaderboard-background";
const FETCH_TIMEOUT_MS = 30_000;

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

function resolveRefreshUrl(req: Request): string | null {
  if (process.env.PNL_LEADERBOARD_REFRESH_URL) {
    return process.env.PNL_LEADERBOARD_REFRESH_URL;
  }
  const deployUrl = process.env.DEPLOY_PRIME_URL || process.env.URL;
  if (deployUrl) {
    return new URL(REFRESH_PATH, deployUrl.endsWith("/") ? deployUrl : `${deployUrl}/`).toString();
  }
  try {
    return new URL(REFRESH_PATH, req.url).toString();
  } catch {
    return null;
  }
}

async function logLeaderboardFreshness(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("pnl_leaderboard")
      .select("updated_at")
      .eq("app_id", SEER_APP_ALL_ID)
      .eq("period", "all")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("scheduled-refresh-pnl-leaderboard: freshness lookup failed:", error.message);
      return;
    }
    if (!data?.updated_at) {
      console.error("scheduled-refresh-pnl-leaderboard: pnl_leaderboard has no updated_at rows");
      return;
    }
    const ageMs = Date.now() - Date.parse(data.updated_at);
    const ageMin = Number.isFinite(ageMs) ? Math.round(ageMs / 60_000) : null;
    console.error(
      `scheduled-refresh-pnl-leaderboard: pnl_leaderboard.max(updated_at)=${data.updated_at} ageMin=${ageMin}`,
    );
  } catch (e) {
    console.error("scheduled-refresh-pnl-leaderboard: freshness lookup failed:", e);
  }
}

export default async (req: Request) => {
  if (process.env.DISABLE_SCHEDULED_FUNCTIONS === "true") {
    return;
  }

  const { next_run } = await req.json().catch(() => ({ next_run: undefined }));
  console.log("scheduled-refresh-pnl-leaderboard: next invocation at:", next_run);

  const refreshUrl = resolveRefreshUrl(req);
  if (!refreshUrl) {
    console.error(
      "scheduled-refresh-pnl-leaderboard: no refresh URL (set PNL_LEADERBOARD_REFRESH_URL, URL, or DEPLOY_PRIME_URL)",
    );
    return;
  }

  const headers = backgroundSecretHeaders();
  if (!headers) {
    console.error("scheduled-refresh-pnl-leaderboard: NETLIFY_BACKGROUND_SECRET is not configured");
    return;
  }

  try {
    const res = await fetch(refreshUrl, {
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("refresh-pnl-leaderboard-background trigger status:", res.status);
      await logLeaderboardFreshness();
    } else {
      console.log("refresh-pnl-leaderboard-background trigger status:", res.status);
    }
  } catch (e) {
    console.error("Failed to trigger refresh-pnl-leaderboard-background:", e);
    await logLeaderboardFreshness();
  }
};

export const config: Config = {
  // Batch refresh rotates stale wallets; run often so the full candidate set stays fresh.
  schedule: "*/15 * * * *",
};

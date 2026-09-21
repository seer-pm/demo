import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { backgroundSecretHeaders } from "./utils/backgroundAuth";
import type { Database } from "./utils/supabase";

const REFRESH_PATH = "/.netlify/functions/refresh-airdrop-leaderboard-background";
const FETCH_TIMEOUT_MS = 30_000;

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

function resolveRefreshUrl(req: Request): string | null {
  if (process.env.AIRDROP_LEADERBOARD_REFRESH_URL) {
    return process.env.AIRDROP_LEADERBOARD_REFRESH_URL;
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
      .from("airdrop_leaderboard")
      .select("updated_at")
      .eq("period", "all")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("scheduled-refresh-airdrop-leaderboard: freshness lookup failed:", error.message);
      return;
    }
    if (!data?.updated_at) {
      console.error("scheduled-refresh-airdrop-leaderboard: airdrop_leaderboard has no updated_at rows");
      return;
    }
    const ageMs = Date.now() - Date.parse(data.updated_at);
    const ageMin = Number.isFinite(ageMs) ? Math.round(ageMs / 60_000) : null;
    console.error(
      `scheduled-refresh-airdrop-leaderboard: airdrop_leaderboard.max(updated_at)=${data.updated_at} ageMin=${ageMin}`,
    );
  } catch (e) {
    console.error("scheduled-refresh-airdrop-leaderboard: freshness lookup failed:", e);
  }
}

export default async (req: Request) => {
  if (process.env.DISABLE_SCHEDULED_FUNCTIONS === "true") {
    return;
  }

  const { next_run } = await req.json().catch(() => ({ next_run: undefined }));
  console.log("scheduled-refresh-airdrop-leaderboard: next invocation at:", next_run);

  const refreshUrl = resolveRefreshUrl(req);
  if (!refreshUrl) {
    console.error(
      "scheduled-refresh-airdrop-leaderboard: no refresh URL (set AIRDROP_LEADERBOARD_REFRESH_URL, URL, or DEPLOY_PRIME_URL)",
    );
    return;
  }

  const headers = backgroundSecretHeaders();
  if (!headers) {
    console.error("scheduled-refresh-airdrop-leaderboard: NETLIFY_BACKGROUND_SECRET is not configured");
    return;
  }

  try {
    const res = await fetch(refreshUrl, {
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("refresh-airdrop-leaderboard-background trigger status:", res.status);
      await logLeaderboardFreshness();
    } else {
      console.log("refresh-airdrop-leaderboard-background trigger status:", res.status);
    }
  } catch (e) {
    console.error("Failed to trigger refresh-airdrop-leaderboard-background:", e);
    await logLeaderboardFreshness();
  }
};

export const config: Config = {
  // The source rows land once a day from scheduled-airdrop-calculation ("0 0 * * *"), which
  // returns 202 immediately and can run for up to 15 minutes. 01:30 UTC leaves it ample room to
  // finish first; if it has not, this run simply rebuilds yesterday's windows and the next one
  // catches up.
  schedule: "30 1 * * *",
};

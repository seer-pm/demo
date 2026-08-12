import type { Config } from "@netlify/functions";

const REFRESH_PATH = "/.netlify/functions/refresh-pnl-leaderboard-background";
const FETCH_TIMEOUT_MS = 30_000;

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

  try {
    const headers: Record<string, string> = {};
    const secret = process.env.PNL_LEADERBOARD_REFRESH_SECRET;
    if (secret) {
      headers["x-pnl-leaderboard-refresh-secret"] = secret;
    }

    const res = await fetch(refreshUrl, {
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("refresh-pnl-leaderboard-background trigger status:", res.status);
    } else {
      console.log("refresh-pnl-leaderboard-background trigger status:", res.status);
    }
  } catch (e) {
    console.error("Failed to trigger refresh-pnl-leaderboard-background:", e);
  }
};

export const config: Config = {
  // Batch refresh rotates stale wallets; run often so the full candidate set stays fresh.
  schedule: "*/15 * * * *",
};

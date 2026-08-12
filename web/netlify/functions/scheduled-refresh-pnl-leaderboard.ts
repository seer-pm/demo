import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  if (process.env.DISABLE_SCHEDULED_FUNCTIONS === "true") {
    return;
  }

  const { next_run } = await req.json().catch(() => ({ next_run: undefined }));
  console.log("scheduled-refresh-pnl-leaderboard: next invocation at:", next_run);

  try {
    const res = await fetch(
      process.env.PNL_LEADERBOARD_REFRESH_URL ??
        "https://app.seer.pm/.netlify/functions/refresh-pnl-leaderboard-background",
    );
    console.log("refresh-pnl-leaderboard-background trigger status:", res.status);
  } catch (e) {
    console.error("Failed to trigger refresh-pnl-leaderboard-background:", e);
  }
};

export const config: Config = {
  // Batch refresh rotates stale wallets; run often so the full candidate set stays fresh.
  schedule: "*/15 * * * *",
};

import type { Config } from "@netlify/functions";
import { backgroundSecretHeaders } from "./utils/backgroundAuth";

const REWARDS_ESTIMATE_PATH = "/.netlify/functions/rewards-estimate-background";

export default async (req: Request) => {
  if (process.env.DISABLE_SCHEDULED_FUNCTIONS === "true") {
    return;
  }

  const headers = backgroundSecretHeaders();
  if (!headers) {
    console.error("scheduled-rewards-estimate: NETLIFY_BACKGROUND_SECRET is not configured");
    return;
  }
  const url = process.env.REWARDS_ESTIMATE_URL ?? new URL(REWARDS_ESTIMATE_PATH, process.env.URL ?? req.url).toString();
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
    console.log("rewards-estimate-background trigger status:", res.status);
  } catch (e) {
    console.error("Failed to trigger rewards-estimate-background:", e);
  }
};

export const config: Config = {
  // Every 2 hours keeps the Rewards tab close to live for a few dozen RPC calls per chain per run.
  // Minute 35 keeps it clear of the hourly rewards-distribution run at minute 5.
  schedule: "35 */2 * * *",
};

import type { Config } from "@netlify/functions";
import { backgroundSecretHeaders } from "./utils/backgroundAuth";

const REWARDS_WATCH_PATH = "/.netlify/functions/rewards-watch-background";

export default async (req: Request) => {
  if (process.env.DISABLE_SCHEDULED_FUNCTIONS === "true") {
    return;
  }

  const headers = backgroundSecretHeaders();
  if (!headers) {
    console.error("scheduled-rewards-watch: NETLIFY_BACKGROUND_SECRET is not configured");
    return;
  }
  const url = process.env.REWARDS_WATCH_URL ?? new URL(REWARDS_WATCH_PATH, process.env.URL ?? req.url).toString();
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
    console.log("rewards-watch-background trigger status:", res.status);
  } catch (e) {
    console.error("Failed to trigger rewards-watch-background:", e);
  }
};

export const config: Config = {
  // Hourly, so a wrong pending root is reported dozens of times inside the 48 h timelock. Minute 50 leaves the
  // rewards-distribution run at minute 5 time to finish what it started, so its own steps do not raise alerts.
  schedule: "50 * * * *",
};

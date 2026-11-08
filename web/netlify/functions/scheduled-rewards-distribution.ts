import type { Config } from "@netlify/functions";
import { backgroundSecretHeaders } from "./utils/backgroundAuth";

const REWARDS_DISTRIBUTION_PATH = "/.netlify/functions/rewards-distribution-background";

export default async (req: Request) => {
  if (process.env.DISABLE_SCHEDULED_FUNCTIONS === "true") {
    return;
  }

  const headers = backgroundSecretHeaders();
  if (!headers) {
    console.error("scheduled-rewards-distribution: NETLIFY_BACKGROUND_SECRET is not configured");
    return;
  }
  const url =
    process.env.REWARDS_DISTRIBUTION_URL ?? new URL(REWARDS_DISTRIBUTION_PATH, process.env.URL ?? req.url).toString();
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
    console.log("rewards-distribution-background trigger status:", res.status);
  } catch (e) {
    console.error("Failed to trigger rewards-distribution-background:", e);
  }
};

export const config: Config = {
  // Each run only does what is due (accept a root whose timelock ended, or submit the week that just
  // settled), so an hourly tick opens claims within an hour of the timelock and retries failures.
  schedule: "5 * * * *",
};

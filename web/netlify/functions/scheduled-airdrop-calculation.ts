import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  if (process.env.DISABLE_SCHEDULED_FUNCTIONS === "true") {
    return;
  }

  // Parse defensively — an empty/non-JSON cron body must not prevent the trigger fetch below.
  const { next_run } = await req.json().catch(() => ({ next_run: undefined }));
  console.log("Received event! Next invocation at:", next_run);

  try {
    const res = await fetch(
      process.env.AIRDROP_CALCULATION_URL ?? "https://app.seer.pm/.netlify/functions/airdrop-calculation-background",
    );
    console.log("airdrop-calculation-background trigger status:", res.status);
  } catch (e) {
    console.error("Failed to trigger airdrop-calculation-background:", e);
  }
};

export const config: Config = {
  schedule: "0 0 * * *",
};

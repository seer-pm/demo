import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { backgroundSecretHeaders } from "./utils/backgroundAuth";
import type { Database } from "./utils/supabase";

const DEX_POOL_PRICES_PATH = "/.netlify/functions/dex-pool-prices-background";
const FETCH_TIMEOUT_MS = 30_000;

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

function resolveDexPoolPricesUrl(req: Request): string | null {
  if (process.env.DEX_POOL_PRICES_URL) {
    return process.env.DEX_POOL_PRICES_URL;
  }
  const deployUrl = process.env.DEPLOY_PRIME_URL || process.env.URL;
  if (deployUrl) {
    return new URL(DEX_POOL_PRICES_PATH, deployUrl.endsWith("/") ? deployUrl : `${deployUrl}/`).toString();
  }
  try {
    return new URL(DEX_POOL_PRICES_PATH, req.url).toString();
  } catch {
    return null;
  }
}

/** Logged when the trigger fails, so the deploy logs show how far behind the hour candles already are. */
async function logHourPricesFreshness(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("dex_pool_hour_prices")
      .select("period_start_unix")
      .order("period_start_unix", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("scheduled-dex-pool-prices: freshness lookup failed:", error.message);
      return;
    }
    if (!data?.period_start_unix) {
      console.error("scheduled-dex-pool-prices: dex_pool_hour_prices is empty");
      return;
    }
    const ageHours = Math.round((Date.now() / 1000 - data.period_start_unix) / 3600);
    console.error(
      `scheduled-dex-pool-prices: dex_pool_hour_prices.max(period_start_unix)=${data.period_start_unix} ageHours=${ageHours}`,
    );
  } catch (e) {
    console.error("scheduled-dex-pool-prices: freshness lookup failed:", e);
  }
}

export default async (req: Request) => {
  if (process.env.DISABLE_SCHEDULED_FUNCTIONS === "true") {
    return;
  }

  const { next_run } = await req.json().catch(() => ({ next_run: undefined }));
  console.log("scheduled-dex-pool-prices: next invocation at:", next_run);

  const url = resolveDexPoolPricesUrl(req);
  if (!url) {
    console.error("scheduled-dex-pool-prices: no target URL (set DEX_POOL_PRICES_URL, URL, or DEPLOY_PRIME_URL)");
    return;
  }

  const headers = backgroundSecretHeaders();
  if (!headers) {
    console.error("scheduled-dex-pool-prices: NETLIFY_BACKGROUND_SECRET is not configured");
    return;
  }

  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("dex-pool-prices-background trigger status:", res.status);
      await logHourPricesFreshness();
    } else {
      console.log("dex-pool-prices-background trigger status:", res.status);
    }
  } catch (e) {
    console.error("Failed to trigger dex-pool-prices-background:", e);
    await logHourPricesFreshness();
  }
};

export const config: Config = {
  // One run advances at most one 30-day slice per chain (MAX_SLICES_PER_SCHEDULED_RUN), so a frequent
  // tick is what lets the backfill catch up and then keep the hour candles current.
  schedule: "*/15 * * * *",
};

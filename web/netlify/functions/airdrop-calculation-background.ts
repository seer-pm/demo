import { createClient } from "@supabase/supabase-js";
import { computeAirdropForTimestamps, insertAirdropRecords } from "./utils/airdropCalculation/computeDailyAirdrop";
import { getRandomNextDayTimestamp } from "./utils/airdropCalculation/utils";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

// Stay comfortably under Netlify's 15-minute background-function limit. Chain history is loaded
// ONE chain at a time (see computeAirdropForTimestamps), so this bounds the load phase itself
// rather than the (now cheap) insert loop — a chain that isn't done loading by this point throws
// a clear error instead of Netlify silently killing the process.
const LOAD_BUDGET_MS = 13 * 60 * 1000;

async function getLatestSnapshotUnixTimestamp() {
  const { data, error } = await supabase.from("airdrop_state").select("last_timestamp").eq("id", "latest_day").single();

  if (error && error.code !== "PGRST116") {
    console.error("Failed to fetch airdrop_state:", error);
    throw error;
  }

  if (!data?.last_timestamp) {
    throw "No timestamp found";
  }

  return data.last_timestamp;
}

/** Every full UTC day boundary strictly between `last` and `now`, same cadence as before. */
function collectMissingDayTimestamps(last: number, now: number): number[] {
  const timestamps: number[] = [];
  let cursor = last;
  for (;;) {
    const nextTimestamp = getRandomNextDayTimestamp(cursor, now);
    if (!nextTimestamp || nextTimestamp >= now) {
      break;
    }
    timestamps.push(nextTimestamp);
    cursor = nextTimestamp;
  }
  return timestamps;
}

async function addNewAirdropDaysToDb() {
  const startedAt = Date.now();
  try {
    const now = Math.floor(Date.now() / 1000);
    const last = await getLatestSnapshotUnixTimestamp();
    const timestamps = collectMissingDayTimestamps(last, now);

    if (!timestamps.length) {
      console.log("Caught up — no full day to add.");
      return;
    }

    // One chain-by-chain history load (each chain's raw data is dropped before the next chain
    // loads, keeping peak memory around the size of a single chain), reused to compute every
    // missing day in memory — catching up N days costs one load pass + N cheap computes.
    console.log(`Computing airdrop for ${timestamps.length} missing day(s)...`);
    const byTimestamp = await computeAirdropForTimestamps(timestamps, { budgetMs: LOAD_BUDGET_MS, startedAt });

    let daysInserted = 0;
    for (const timestamp of timestamps) {
      await insertAirdropRecords(timestamp, byTimestamp.get(timestamp) ?? []);
      daysInserted++;
    }
    console.log(`Airdrop run complete: ${daysInserted} day(s) inserted.`);
  } catch (e) {
    console.error("airdrop worker failed:", (e as Error)?.stack ?? e);
    throw e;
  }
}

export default async () => {
  await addNewAirdropDaysToDb();
};

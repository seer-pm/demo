import { createClient } from "@supabase/supabase-js";
import {
  distributeAirdropAtTimestamp,
  insertAirdropRecords,
  loadAirdropInputs,
} from "./utils/airdropCalculation/computeDailyAirdrop";
import { getRandomNextDayTimestamp } from "./utils/airdropCalculation/utils";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

// Stay comfortably under Netlify's 15-minute background-function limit. Any days not reached in
// this invocation are picked up by the next scheduled run (each insert advances `airdrop_state`,
// so progress is durable even if the function is killed mid-loop).
const RUN_BUDGET_MS = 12 * 60 * 1000;

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

async function addNewAirdropDaysToDb() {
  const startedAt = Date.now();
  try {
    const now = Math.floor(Date.now() / 1000);
    let last = await getLatestSnapshotUnixTimestamp();

    // One expensive full-history load, reused to catch up every missed day this invocation.
    // Computing each day from the loaded inputs is pure/in-memory, so catching up N days costs
    // one load + N cheap computes rather than N separate loads.
    const inputs = await loadAirdropInputs();

    let daysInserted = 0;
    for (;;) {
      if (Date.now() - startedAt > RUN_BUDGET_MS) {
        console.log(`Run budget reached after ${daysInserted} day(s); remaining days resume next run.`);
        break;
      }
      const nextTimestamp = getRandomNextDayTimestamp(last, now);
      if (!nextTimestamp || nextTimestamp >= now) {
        console.log("Caught up — no full day to add.");
        break;
      }

      const finalData = distributeAirdropAtTimestamp(inputs, nextTimestamp);
      await insertAirdropRecords(nextTimestamp, finalData);
      daysInserted++;
      last = nextTimestamp;
    }
    console.log(`Airdrop run complete: ${daysInserted} day(s) inserted.`);
  } catch (e) {
    console.log("airdrop error");
    console.log(e);
  }
}

export default async () => {
  await addNewAirdropDaysToDb();
};

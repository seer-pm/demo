/**
 * Backfills the daily Seer airdrop snapshots by writing a Postgres-importable CSV (fastest path).
 * Takes one random-time snapshot per UTC day (same cadence as the scheduled function), from a
 * genesis timestamp up to now.
 *
 * It loads each chain's full history ONCE (transfers, mint/burn events, prices) and POH, then
 * computes every day in memory — no per-day network fetch. It reuses the exact same per-day math
 * as the scheduled `airdrop-calculation-background` function.
 *
 * Usage (from the `web/` directory so tsconfig `paths` and `.env` resolve):
 *   node --env-file=.env "$(node -e "process.stdout.write(require.resolve('tsx/cli'))")" \
 *     scripts/backfill-airdrop.ts --from 1728579600 --out ./tmp/airdrop-backfill.csv
 *
 * or, if tsx is on PATH and SUPABASE_* are exported:
 *   npx tsx scripts/backfill-airdrop.ts --from 1728579600
 *
 * Options:
 *   --from <unix>  Genesis / resume point. Default: `airdrop_state.last_timestamp` if present,
 *                  else 1728579600 (Oct 11 2024). The first snapshot is the day AFTER this.
 *   --to   <unix>  Stop once the next snapshot would reach here. Default: now.
 *   --out  <path>  CSV output file. Default: ./tmp/airdrop-backfill.csv
 *
 * After it finishes, import the CSV and advance airdrop_state (the script prints the exact
 * commands with the real last timestamp):
 *   \copy airdrops(address,chain_ids,direct_holding,indirect_holding,is_poh,seer_tokens_count,share_of_holding,share_of_holding_poh,timestamp,total_holding) FROM 'tmp/airdrop-backfill.csv' WITH (FORMAT csv, HEADER true)
 *   insert into airdrop_state(id,last_timestamp) values('latest_day', <lastTs>)
 *     on conflict (id) do update set last_timestamp = excluded.last_timestamp;
 * Then re-enable the daily scheduled function — it continues from that timestamp.
 */
import { createWriteStream, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  distributeAirdropAtTimestamp,
  loadAirdropInputs,
} from "../netlify/functions/utils/airdropCalculation/computeDailyAirdrop";
import { getRandomNextDayTimestamp } from "../netlify/functions/utils/airdropCalculation/utils";

const GENESIS_TIMESTAMP = 1728579600; // October 11, 2024

// Column order for the CSV header — must match the `\copy airdrops(...)` column list below.
const CSV_COLUMNS = [
  "address",
  "chain_ids",
  "direct_holding",
  "indirect_holding",
  "is_poh",
  "seer_tokens_count",
  "share_of_holding",
  "share_of_holding_poh",
  "timestamp",
  "total_holding",
] as const;

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  return idx === -1 ? undefined : process.argv[idx + 1];
}

function getArgNumber(name: string): number | undefined {
  const value = getArg(name);
  if (value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function getResumeTimestamp(): Promise<number> {
  const fromArg = getArgNumber("--from");
  if (fromArg !== undefined) {
    return fromArg;
  }
  const { data, error } = await supabase
    .from("airdrop_state")
    .select("last_timestamp")
    .eq("id", "latest_day")
    .maybeSingle();
  if (error && error.code !== "PGRST116") {
    throw error;
  }
  return data?.last_timestamp ?? GENESIS_TIMESTAMP;
}

async function main() {
  const to = getArgNumber("--to") ?? Math.floor(Date.now() / 1000);
  const outPath = getArg("--out") ?? "./tmp/airdrop-backfill.csv";
  let last = await getResumeTimestamp();
  console.log(`Backfilling airdrop CSV from ${last} to ${to} -> ${outPath}`);

  // Fetch each chain's full history (transfers, mint/burn events, prices) + POH ONCE,
  // then compute every day in memory — no per-day network fetch.
  console.log("Loading airdrop inputs (once)...");
  const loadStartedAt = Date.now();
  const inputs = await loadAirdropInputs();
  console.log(`Inputs loaded in ${((Date.now() - loadStartedAt) / 1000).toFixed(1)}s`);

  mkdirSync(dirname(outPath), { recursive: true });
  const out = createWriteStream(outPath, { encoding: "utf8" });
  const write = (line: string) =>
    new Promise<void>((resolve, reject) => {
      out.write(line, (err) => (err ? reject(err) : resolve()));
    });

  await write(`${CSV_COLUMNS.join(",")}\n`);

  let daysProcessed = 0;
  let rowsWritten = 0;
  let lastSnapshotTs = last;
  for (;;) {
    const nextTimestamp = getRandomNextDayTimestamp(last, to);
    if (!nextTimestamp || nextTimestamp >= to) {
      console.log("Caught up — no more full days to backfill.");
      break;
    }

    const startedAt = Date.now();
    const finalData = distributeAirdropAtTimestamp(inputs, nextTimestamp);
    const isoTimestamp = new Date(nextTimestamp * 1000).toISOString();

    let buffer = "";
    for (const record of finalData) {
      const row = [
        record.address,
        `{${record.chainIds.join(",")}}`,
        String(record.directHolding ?? 0),
        String(record.indirectHolding ?? 0),
        record.isPOHUser ? "true" : "false",
        String(record.seerTokens ?? 0),
        String(record.shareOfHolding ?? 0),
        String(record.shareOfHoldingPoh ?? 0),
        isoTimestamp,
        String(record.totalHolding ?? 0),
      ]
        .map((v) => csvEscape(v))
        .join(",");
      buffer += `${row}\n`;
    }
    if (buffer) await write(buffer);

    rowsWritten += finalData.length;
    daysProcessed++;
    lastSnapshotTs = nextTimestamp;
    console.log(
      `[${daysProcessed}] day ${isoTimestamp.slice(0, 10)} (ts=${nextTimestamp}) ${finalData.length} rows in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`,
    );

    last = nextTimestamp;
  }

  await new Promise<void>((resolve) => out.end(resolve));

  console.log(`\nBackfill complete. ${daysProcessed} day(s), ${rowsWritten} row(s) -> ${outPath}`);
  console.log("\nNext steps:");
  console.log(
    `  \\copy airdrops(${CSV_COLUMNS.join(",")}) FROM '${outPath}' WITH (FORMAT csv, HEADER true)`,
  );
  console.log(
    `  insert into airdrop_state(id,last_timestamp) values('latest_day', ${lastSnapshotTs}) on conflict (id) do update set last_timestamp = excluded.last_timestamp;`,
  );
}

main().catch((e) => {
  console.error("Backfill failed:", e);
  process.exit(1);
});

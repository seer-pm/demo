/**
 * Recomputes the daily Seer airdrop snapshots and writes a Postgres-importable CSV (fastest path).
 *
 * It loads each chain's markets/liquidity-events/pool-hour-prices ONCE and POH once, then computes
 * every day in memory from that plus one `get_direct_holdings_at` Postgres call per (chain, day)
 * for direct token holdings (see supabase/sql/get_direct_holdings_at.sql). It reuses the exact
 * same per-day math as the scheduled `airdrop-calculation-background` function.
 *
 * TIMESTAMPS: by default it REUSES the snapshot timestamps already in `airdrops`, so a reseed is
 * directly comparable to the data it replaces. This matters — `getRandomNextDayTimestamp` samples a
 * random second inside each UTC day, so generating fresh timestamps would change every historical
 * number even with no code change, and old-vs-new diffing could not validate anything. Pass
 * `--fresh` to generate new day timestamps instead (for extending past the last snapshot).
 *
 * ONE FETCH, MANY DAYS: by default every snapshot is computed in a single pass, because that is the
 * point of `computeAirdropForTimestamps` — each chain's markets, mint/burn events and pool-hour
 * prices are loaded ONCE and folded into every timestamp. Only the per-(chain, day)
 * `get_direct_holdings_at` call is unavoidably per-day.
 *
 * WHERE THE TIME GOES: those per-day calls, and almost none of it is compute. Each round trip costs
 * ~10-12s of connection overhead through this project's API/pooler while the query itself runs in
 * single-digit milliseconds, so ~690 days x 4 chains run back to back is ~8-9 hours of waiting on
 * connection setup. `--concurrency` overlaps those waits and is the single biggest lever on runtime;
 * at the default 8 the same run is closer to an hour. It applies to this script only — the
 * scheduled Netlify function passes no `concurrency` and stays strictly sequential, because it has
 * one or two days to compute in a 1024 MB sandbox and would only pay the extra memory.
 *
 * `--batch-days` splits that into several passes. It bounds peak memory — every day in a pass keeps
 * an accumulator holding each active address — but it RE-FETCHES every chain's full history once
 * per batch, including the paid Uniswap gateway crawl for mint/burn. Reach for it only if the run
 * actually runs out of heap, and prefer raising the heap first:
 *
 *   node --max-old-space-size=16384 node_modules/tsx/dist/cli.mjs scripts/backfill-airdrop.ts
 *
 * Usage (from the `web/` directory so tsconfig `paths` and `.env` resolve):
 *   npx tsx scripts/backfill-airdrop.ts --out ./tmp/airdrop-backfill.csv
 *
 * Options:
 *   --from <unix>     Only recompute snapshots strictly after this. Default: every existing
 *                     snapshot (reuse mode), or `airdrop_state.last_timestamp` with `--fresh`.
 *   --to   <unix>     Stop at this timestamp. Default: now.
 *   --fresh           Generate new random-in-day timestamps instead of reusing existing ones.
 *   --batch-days <n>  Split into passes of n days. Default: one pass over everything. Each extra
 *                     pass re-fetches all chain history; only use it if the run exhausts the heap.
 *   --concurrency <n> Days computed in parallel within a chain. Default: 8. Each in-flight day
 *                     holds a chain's holdings array, so this trades memory for wall-clock; lower
 *                     it if the run is tight on heap, raise it if the pooler tolerates more.
 *                     Concurrency also lengthens individual statements, so too high a value trips
 *                     Postgres' statement timeout on the heaviest (most recent) days.
 *   --resume          Continue a run that died part way, using `<out>.progress.json`: already
 *                     written days are skipped and the CSV is appended to. Without it, a run that
 *                     finds a progress file refuses to start rather than overwrite the CSV.
 *   --out  <path>     CSV output file. Default: ./tmp/airdrop-backfill.csv
 *
 * The script prints the exact import commands, with the real last timestamp, when it finishes.
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { computeAirdropForTimestamps } from "../netlify/functions/utils/airdropCalculation/computeDailyAirdrop";
import { getRandomNextDayTimestamp } from "../netlify/functions/utils/airdropCalculation/utils";

const GENESIS_TIMESTAMP = 1728579600; // October 11, 2024

/** One pass over every snapshot: chain history is fetched once, as `computeAirdropForTimestamps` intends. */
const DEFAULT_BATCH_DAYS = Number.POSITIVE_INFINITY;

/**
 * Days computed in parallel within a chain. The work per day is one `get_direct_holdings_at` round
 * trip that is ~10-12s of connection overhead around a millisecond-scale query, so this is almost
 * pure waiting and overlaps nearly linearly. 8 is a deliberate middle: enough to turn an ~8-9 hour
 * run into roughly an hour, low enough not to multiply peak heap out of reach or lean on the
 * pooler's connection limit.
 */
const DEFAULT_CONCURRENCY = 8;

// Column order for the CSV header — must match the `\copy airdrops(...)` column list printed below.
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

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toUnix(value: string | number): number {
  return typeof value === "number" ? value : Math.floor(new Date(value).getTime() / 1000);
}

/**
 * Every distinct snapshot timestamp already in `airdrops`, ascending.
 *
 * Walked one at a time rather than selected with DISTINCT: PostgREST has no DISTINCT, and the table
 * holds one row per address per day (millions), so paging the raw column and deduping client-side
 * would cost thousands of round trips. "Smallest timestamp greater than the last one" is a single
 * indexed lookup per snapshot day (~690 of them), served by `airdrops_timestamp_idx`.
 */
async function loadExistingTimestamps(after: number, until: number): Promise<number[]> {
  const timestamps: number[] = [];
  let cursor = after;
  for (;;) {
    const { data, error } = await supabase
      .from("airdrops")
      .select("timestamp")
      .gt("timestamp", new Date(cursor * 1000).toISOString())
      .order("timestamp", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error && error.code !== "PGRST116") {
      throw error;
    }
    if (!data?.timestamp) {
      break;
    }
    const ts = toUnix(data.timestamp);
    if (ts >= until) {
      break;
    }
    timestamps.push(ts);
    cursor = ts;
    if (timestamps.length % 50 === 0) {
      console.log(`  ...found ${timestamps.length} snapshots so far`);
    }
  }
  return timestamps;
}

/** `airdrop_state.last_timestamp`, or genesis when the state row is missing. */
async function readLastStateTimestamp(): Promise<number> {
  const { data, error } = await supabase
    .from("airdrop_state")
    .select("last_timestamp")
    .eq("id", "latest_day")
    .maybeSingle();
  if (error && error.code !== "PGRST116") {
    throw error;
  }
  return Number(data?.last_timestamp ?? GENESIS_TIMESTAMP);
}

/** Fresh random-in-day timestamps, for extending past the newest snapshot. */
async function generateFreshTimestamps(after: number | undefined, until: number): Promise<number[]> {
  let cursor: number = after ?? (await readLastStateTimestamp());

  const timestamps: number[] = [];
  for (;;) {
    const next = getRandomNextDayTimestamp(cursor, until);
    if (!next || next >= until) {
      break;
    }
    timestamps.push(next);
    cursor = next;
  }
  return timestamps;
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

/**
 * Crash-resume state, written beside the CSV after every completed pass.
 *
 * A full reseed is a multi-hour run whose output only becomes durable one pass at a time, so an
 * error near the end used to discard everything — including the metered gateway crawl. The sidecar
 * records how far the CSV is actually good to; `--resume` then skips those days and appends.
 *
 * Resume is only useful alongside `--batch-days`: with the default single pass there is exactly one
 * checkpoint, at the very end. See the warning in `main`.
 */
type Progress = { completedThrough: number; rowsWritten: number; columns: string[] };

function progressPathFor(outPath: string): string {
  return `${outPath}.progress.json`;
}

function readProgress(outPath: string): Progress | undefined {
  const path = progressPathFor(outPath);
  if (!existsSync(path)) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Progress;
    return Number.isFinite(parsed?.completedThrough) ? parsed : undefined;
  } catch {
    return undefined; // unreadable checkpoint: treat as absent rather than crash the run
  }
}

function writeProgress(outPath: string, progress: Progress) {
  writeFileSync(progressPathFor(outPath), `${JSON.stringify(progress, null, 2)}\n`, "utf8");
}

async function main() {
  const to = getArgNumber("--to") ?? Math.floor(Date.now() / 1000);
  const from = getArgNumber("--from");
  const outPath = getArg("--out") ?? "./tmp/airdrop-backfill.csv";
  const batchDays = getArgNumber("--batch-days") ?? DEFAULT_BATCH_DAYS;
  const concurrency = Math.max(1, Math.floor(getArgNumber("--concurrency") ?? DEFAULT_CONCURRENCY));
  const fresh = hasFlag("--fresh");
  const resume = hasFlag("--resume");

  console.log(fresh ? "Generating fresh snapshot timestamps..." : "Reading existing snapshot timestamps...");
  const timestamps = fresh
    ? await generateFreshTimestamps(from, to)
    : await loadExistingTimestamps(from ?? 0, to);

  if (!timestamps.length) {
    console.log("No snapshots to compute.");
    return;
  }

  // Never silently truncate a CSV that a previous run got part way through — that is precisely the
  // work this checkpoint exists to protect, and re-running the same command is the likeliest way to
  // destroy it.
  const prior = readProgress(outPath);
  if (prior && !resume) {
    throw new Error(
      `${progressPathFor(outPath)} exists: ${outPath} is already good through ` +
        `${new Date(prior.completedThrough * 1000).toISOString()} (${prior.rowsWritten} rows). ` +
        "Re-running without --resume would overwrite it. Pass --resume to continue that run, or " +
        "delete the progress file to start over.",
    );
  }

  const resuming = resume && prior !== undefined;
  const pending = resuming ? timestamps.filter((ts) => ts > prior.completedThrough) : timestamps;
  if (resuming) {
    console.log(
      `Resuming: ${timestamps.length - pending.length} day(s) already written, ${pending.length} remaining.`,
    );
  }
  if (!pending.length) {
    console.log("Nothing left to compute — the CSV already covers every snapshot in range.");
    return;
  }

  const batches = chunk(pending, Math.max(1, Math.min(batchDays, pending.length)));
  console.log(`Recomputing ${pending.length} snapshot(s) -> ${outPath}`);
  if (batches.length > 1) {
    console.warn(
      `WARNING: --batch-days ${batchDays} splits this into ${batches.length} passes, and each pass re-fetches` +
        " every chain's markets, mint/burn events and pool-hour prices. Prefer a larger heap" +
        " (--max-old-space-size) over batching unless the run is actually exhausting memory.",
    );
  } else {
    console.warn(
      "NOTE: single pass, so the only crash checkpoint is at the very end — a failure part way" +
        " through discards the whole run. On a long reseed prefer --batch-days (e.g. 100) so each" +
        " completed pass is durable and --resume can pick up from it.",
    );
  }

  mkdirSync(dirname(outPath), { recursive: true });
  const out = createWriteStream(outPath, { encoding: "utf8", flags: resuming ? "a" : "w" });
  const write = (line: string) =>
    new Promise<void>((resolve, reject) => {
      out.write(line, (err) => (err ? reject(err) : resolve()));
    });

  if (!resuming) {
    await write(`${CSV_COLUMNS.join(",")}\n`);
  }

  let daysProcessed = 0;
  let rowsWritten = prior?.rowsWritten ?? 0;
  const emptyDays: number[] = [];
  let lastSnapshotTs = pending[pending.length - 1];

  for (const [batchIndex, batch] of batches.entries()) {
    // One pass by default, so chain history is fetched once. With --batch-days this loop runs more
    // than once and every pass re-pays that fetch; see the note at the top of the file.
    const startedAt = Date.now();
    console.log(
      `\n[pass ${batchIndex + 1}/${batches.length}] loading chain inputs for ${batch.length} day(s)` +
        ` (concurrency ${concurrency})...`,
    );
    const byTimestamp = await computeAirdropForTimestamps(batch, { concurrency });
    console.log(`[pass ${batchIndex + 1}/${batches.length}] computed in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);

    for (const timestamp of batch) {
      const finalData = byTimestamp.get(timestamp) ?? [];
      const isoTimestamp = new Date(timestamp * 1000).toISOString();

      let buffer = "";
      for (const record of finalData) {
        buffer += `${[
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
          .map(csvEscape)
          .join(",")}\n`;
      }
      if (buffer) await write(buffer);

      rowsWritten += finalData.length;
      daysProcessed++;
      lastSnapshotTs = timestamp;
      if (finalData.length === 0) {
        // Almost always missing price coverage rather than a genuinely empty day: with no candle at
        // or before the snapshot every holding prices at 0, drops below the dust threshold, and the
        // day silently disappears from the output. Importing that over a day that currently HAS
        // rows destroys its allocation, so surface it loudly.
        emptyDays.push(timestamp);
        console.warn(`  !! ${isoTimestamp.slice(0, 10)} produced NO rows — check price coverage for this date`);
      }
      console.log(`  [${daysProcessed}/${pending.length}] ${isoTimestamp.slice(0, 10)} (ts=${timestamp}) ${finalData.length} rows`);
    }

    // Checkpoint only once the whole pass is on disk, so `completedThrough` never claims more than
    // the CSV actually holds. A resume that re-computes a day is harmless; one that skips a day
    // that was never written would silently lose it.
    writeProgress(outPath, {
      completedThrough: batch[batch.length - 1],
      rowsWritten,
      columns: [...CSV_COLUMNS],
    });

    byTimestamp.clear();
    (globalThis as { gc?: () => void }).gc?.();
  }

  await new Promise<void>((resolve) => out.end(resolve));

  console.log(`\nBackfill complete. ${daysProcessed} day(s), ${rowsWritten} row(s) -> ${outPath}`);
  if (emptyDays.length > 0) {
    console.warn(
      `WARNING: ${emptyDays.length} day(s) produced no rows. Importing this CSV over days that` +
        " currently have rows would delete their allocations. Verify price coverage" +
        " (dex_pool_hour_prices earliest candle per chain) before importing, and consider re-running" +
        ` with --from set past the gap. First few: ${emptyDays
          .slice(0, 5)
          .map((ts) => new Date(ts * 1000).toISOString().slice(0, 10))
          .join(", ")}`,
    );
  }
  console.log("\nNext steps:");
  console.log(`  \\copy airdrops(${CSV_COLUMNS.join(",")}) FROM '${outPath}' WITH (FORMAT csv, HEADER true)`);
  console.log(
    `  insert into airdrop_state(id,last_timestamp) values('latest_day', ${lastSnapshotTs}) on conflict (id) do update set last_timestamp = excluded.last_timestamp;`,
  );
}

main().catch((e) => {
  console.error("Backfill failed:", e);
  process.exit(1);
});

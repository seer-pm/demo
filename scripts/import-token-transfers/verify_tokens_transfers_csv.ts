/**
 * Quick verification helper for exported CSV chunks.
 *
 * - counts data rows across all tokens_transfers_*.csv
 * - finds min/max timestamp present
 *
 * Usage (from repository root):
 *   npx --yes tsx ./scripts/import-token-transfers/verify_tokens_transfers_csv.ts ./tmp/envio
 */
import { createReadStream, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { argv, exit } from "node:process";
import readline from "node:readline";

async function countFile(path: string) {
  const rl = readline.createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  let line = 0;
  let rows = 0;
  let minTs: number | null = null;
  let maxTs: number | null = null;
  let tsCol = 1; // default matches block_number,timestamp,...
  for await (const l of rl) {
    line++;
    if (line === 1) {
      const headerCols = l.split(",").map((c) => c.trim());
      const idx = headerCols.indexOf("timestamp");
      if (idx >= 0) tsCol = idx;
      continue;
    }
    if (!l) continue;
    rows++;
    const parts = l.split(",");
    const tsStr = parts[tsCol];
    const ts = Number(tsStr);
    if (Number.isFinite(ts)) {
      minTs = minTs == null ? ts : Math.min(minTs, ts);
      maxTs = maxTs == null ? ts : Math.max(maxTs, ts);
    }
  }
  return { rows, minTs, maxTs };
}

async function main() {
  const dir = argv[2];
  if (!dir) {
    console.error("Missing dir arg. Example: ./tmp/envio");
    exit(1);
  }
  const abs = resolve(dir);
  const files = readdirSync(abs)
    .filter((f) => /^tokens_transfers_\d+\.csv$/.test(f))
    .sort()
    .map((f) => join(abs, f));

  if (files.length === 0) {
    console.error(`No tokens_transfers_*.csv files found in ${abs}`);
    exit(1);
  }

  let total = 0;
  let minTs: number | null = null;
  let maxTs: number | null = null;

  for (const f of files) {
    const r = await countFile(f);
    total += r.rows;
    if (r.minTs != null) minTs = minTs == null ? r.minTs : Math.min(minTs, r.minTs);
    if (r.maxTs != null) maxTs = maxTs == null ? r.maxTs : Math.max(maxTs, r.maxTs);
    console.log(`[verify_csv] file=${f} rows=${r.rows}`);
  }

  console.log(
    JSON.stringify(
      {
        dir: abs,
        files: files.length,
        rows: total,
        minTimestamp: minTs,
        maxTimestamp: maxTs,
        minIso: minTs ? new Date(minTs * 1000).toISOString() : null,
        maxIso: maxTs ? new Date(maxTs * 1000).toISOString() : null,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  exit(1);
});


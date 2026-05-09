/**
 * Downloads Transfer rows from an Envio HyperIndex GraphQL endpoint, paginating
 * with (limit, offset) and writing CSV chunks to disk.
 *
 * Goals:
 * - Stay under Envio rate limit (default 150 req/min)
 * - Write ~100k rows per CSV file
 * - Persist a resume state to continue after interruption
 *
 * Usage (from repository root):
 *   npx --yes tsx ./scripts/import-token-transfers/envio_export_transfers.ts \
 *     --url <envio-graphql-url> \   (required — shared HyperIndex GraphQL URL for your indexer)
 *     --outDir ./tmp/envio \
 *     --chunkSize 100000 \
 *     --rpm 150
 *
 * Optional:
 *   --fromTs 0
 *   --toTs <unixSeconds>   (default: now)
 *   --autoRange            (query Envio for min/max timestamps)
 *   --whereJson '{"chainId":{"_eq":"100"}}'
 *   --windowSeconds 86400
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { argv, exit } from "node:process";
import type { WriteStream } from "node:fs";

type TransferRow = {
  chainId: string;
  from: string;
  to: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: string;
  value: string;
  token: { id: string } | null;
};

function getArg(name: string): string | undefined {
  const idx = argv.indexOf(name);
  if (idx === -1) return undefined;
  return argv[idx + 1];
}

function getArgNumber(name: string, fallback?: number): number | undefined {
  const v = getArg(name);
  if (v == null) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function csvEscape(v: string) {
  if (v.includes('"') || v.includes(",") || v.includes("\n") || v.includes("\r")) {
    return `"${v.replaceAll('"', '""')}"`;
  }
  return v;
}

type ResumeState = {
  /** Bump when CSV columns change so stale resume.json is ignored. */
  csvFormat?: number;
  url: string;
  fromTs: number;
  toTs: number;
  /** When true, `fromTs`/`toTs` can drift between runs (Envio max timestamp moves). */
  autoRange?: boolean;
  whereJson: unknown;
  windowSeconds: number;
  rpm: number;
  chunkSize: number;
  windowStart: number;
  windowEnd: number;
  offset: number;
  totalDownloaded: number;
  currentFileIndex: number;
  rowsInCurrentFile: number;
  currentFilePath: string;
  startedAtMs: number;
};

function resumeParamsMatch(
  state: ResumeState,
  opts: {
    url: string;
    fromTs: number;
    toTs: number;
    extraWhere: unknown;
    windowSeconds: number;
    rpm: number;
    chunkSize: number;
    autoRange: boolean;
  },
): boolean {
  if (state.csvFormat !== 2) return false;
  if (state.url !== opts.url) return false;
  if (state.chunkSize !== opts.chunkSize) return false;
  if (state.rpm !== opts.rpm) return false;
  if (state.windowSeconds !== opts.windowSeconds) return false;
  if (JSON.stringify(state.whereJson) !== JSON.stringify(opts.extraWhere)) return false;
  // With --autoRange, upper bound changes every run as indexed data grows; do not require same fromTs/toTs.
  // Legacy resume.json without `autoRange` treated as compatible when opts.autoRange is true (`!== false`).
  if (opts.autoRange && state.autoRange !== false) return true;
  return state.fromTs === opts.fromTs && state.toTs === opts.toTs;
}

/** CSV columns: block_number,timestamp,...,log_index (see csvFormat resume gate). */
const CSV_FORMAT_VERSION = 2;

const QUERY_GET_TRANSFERS = /* GraphQL */ `
  query GetTransfers($limit: Int!, $offset: Int!, $where: Transfer_bool_exp!, $order_by: [Transfer_order_by!]) {
    Transfer(limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
      chainId
      from
      to
      timestamp
      blockNumber
      transactionHash
      logIndex
      value
      token {
        id
      }
    }
  }
`;

const QUERY_RANGE = /* GraphQL */ `
  query GetTransferRange($where: Transfer_bool_exp!, $order_by: [Transfer_order_by!]) {
    Transfer(limit: 1, offset: 0, where: $where, order_by: $order_by) {
      timestamp
    }
  }
`;

async function gqlRequest<T>(url: string, query: string, variables: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as any;
  if (!res.ok || json.errors) {
    const err = new Error(
      `GraphQL error: status=${res.status} body=${JSON.stringify(json.errors ?? json, null, 2)}`,
    );
    (err as any).details = json;
    throw err;
  }
  return json.data as T;
}

function fmtRate(rows: number, elapsedMs: number) {
  if (elapsedMs <= 0) return "n/a";
  const perMin = (rows / elapsedMs) * 60_000;
  return `${perMin.toFixed(0)} rows/min`;
}

function buildWhere(fromTs: number, toTs: number, extraWhere: any): any {
  const timeWhere = {
    timestamp: { _gt: String(fromTs), _lt: String(toTs) },
  };
  if (!extraWhere || Object.keys(extraWhere).length === 0) return timeWhere;
  return { _and: [timeWhere, extraWhere] };
}

function nextFilePath(outDir: string, idx: number) {
  const name = `tokens_transfers_${String(idx).padStart(6, "0")}.csv`;
  return join(outDir, name);
}

async function fetchEnvioRange(url: string, extraWhere: any) {
  const where = extraWhere && Object.keys(extraWhere).length > 0 ? extraWhere : {};
  const [asc, desc] = await Promise.all([
    gqlRequest<{ Transfer: { timestamp: string }[] }>(url, QUERY_RANGE, {
      where,
      order_by: [{ timestamp: "asc" }],
    }),
    gqlRequest<{ Transfer: { timestamp: string }[] }>(url, QUERY_RANGE, {
      where,
      order_by: [{ timestamp: "desc" }],
    }),
  ]);
  const minTs = Number.parseInt(asc.Transfer?.[0]?.timestamp ?? "0", 10);
  const maxTs = Number.parseInt(desc.Transfer?.[0]?.timestamp ?? "0", 10);
  return { minTs, maxTs };
}

function openCsv(outPath: string, append: boolean) {
  const stream = createWriteStream(outPath, { flags: append ? "a" : "w" });
  if (!append) {
    stream.write("block_number,timestamp,from,to,tx_hash,chain_id,token,value,log_index\n");
  }
  return stream;
}

async function closeStream(stream: WriteStream) {
  await new Promise<void>((resolve, reject) => {
    stream.end(() => resolve());
    stream.on("error", reject);
  });
}

async function main() {
  const url = getArg("--url");
  if (!url) {
    console.error("Missing required --url (Envio HyperIndex GraphQL endpoint).");
    exit(1);
  }
  const autoRange = argv.includes("--autoRange");
  const nowTs = Math.floor(Date.now() / 1000);
  let fromTs = getArgNumber("--fromTs", 0)!;
  let toTs = getArgNumber("--toTs", nowTs)!;
  const outDir = resolve(getArg("--outDir") ?? "./tmp/envio");
  const chunkSize = getArgNumber("--chunkSize", 100_000)!;
  const rpm = getArgNumber("--rpm", 150)!;
  const windowSeconds = getArgNumber("--windowSeconds", 24 * 60 * 60)!;
  const whereJsonRaw = getArg("--whereJson");
  const resumePath = resolve(getArg("--resumePath") ?? join(outDir, "resume.json"));

  if (toTs <= fromTs) {
    console.error(`Invalid range: toTs (${toTs}) must be > fromTs (${fromTs})`);
    exit(1);
  }

  mkdirSync(outDir, { recursive: true });

  const extraWhere = whereJsonRaw ? JSON.parse(whereJsonRaw) : {};

  if (autoRange) {
    console.log("[envio_export_transfers] querying Envio for min/max timestamp...");
    const { minTs, maxTs } = await fetchEnvioRange(url, extraWhere);
    console.log(
      `[envio_export_transfers] Envio range minTs=${minTs} (${new Date(minTs * 1000).toISOString()}) maxTs=${maxTs} (${new Date(maxTs * 1000).toISOString()})`,
    );
    fromTs = Math.max(fromTs, minTs);
    toTs = Math.min(toTs, maxTs + 1); // make it exclusive upper bound
    if (toTs <= fromTs) {
      console.log("[envio_export_transfers] nothing to export after applying autoRange");
      exit(0);
    }
  }

  const msPerReq = Math.ceil(60_000 / rpm);
  const startedAtMs = Date.now();

  let state: ResumeState | null = null;
  if (existsSync(resumePath)) {
    try {
      state = JSON.parse(readFileSync(resumePath, "utf8")) as ResumeState;
      if (
        !resumeParamsMatch(state, {
          url,
          fromTs,
          toTs,
          extraWhere,
          windowSeconds,
          rpm,
          chunkSize,
          autoRange,
        })
      ) {
        console.log(`[envio_export_transfers] resume ignored (params changed): ${resumePath}`);
        state = null;
      } else {
        console.log(`[envio_export_transfers] resuming from ${resumePath}`);
      }
    } catch {
      // ignore
      state = null;
    }
  }

  let totalDownloaded = state?.totalDownloaded ?? 0;
  let currentFileIndex = state?.currentFileIndex ?? 1;
  let rowsInCurrentFile = state?.rowsInCurrentFile ?? 0;
  let currentFilePath = state?.currentFilePath ?? nextFilePath(outDir, currentFileIndex);

  let stream = openCsv(currentFilePath, rowsInCurrentFile > 0);

  function persistResume(s: Partial<ResumeState>) {
    const merged: ResumeState = {
      csvFormat: CSV_FORMAT_VERSION,
      url,
      fromTs,
      toTs,
      autoRange,
      whereJson: extraWhere,
      windowSeconds,
      rpm,
      chunkSize,
      windowStart: s.windowStart ?? state?.windowStart ?? fromTs,
      windowEnd: s.windowEnd ?? state?.windowEnd ?? Math.min(fromTs + windowSeconds, toTs),
      offset: s.offset ?? state?.offset ?? 0,
      totalDownloaded,
      currentFileIndex,
      rowsInCurrentFile,
      currentFilePath,
      startedAtMs: state?.startedAtMs ?? startedAtMs,
    };
    writeFileSync(resumePath, JSON.stringify(merged, null, 2));
    state = merged;
  }

  let windowStart = state?.windowStart ?? fromTs;
  let windowEnd = state?.windowEnd ?? Math.min(windowStart + windowSeconds, toTs);

  // Deterministic ordering for stable offset pagination.
  let orderBy: any[] = [{ timestamp: "asc" }, { transactionHash: "asc" }, { logIndex: "asc" }];
  let query = QUERY_GET_TRANSFERS;

  const LIMIT = 1000;
  let reqCount = 0;
  let lastReqAt = 0;

  while (windowStart < toTs) {
    const where = buildWhere(windowStart, windowEnd, extraWhere);
    let offset = state?.offset ?? 0;

    console.log(
      `[envio_export_transfers] window ${new Date(windowStart * 1000).toISOString()} -> ${new Date(windowEnd * 1000).toISOString()} offset=${offset}`,
    );

    while (true) {
      const now = Date.now();
      const waitFor = Math.max(0, lastReqAt + msPerReq - now);
      if (waitFor > 0) await sleep(waitFor);

      reqCount++;
      lastReqAt = Date.now();

      let transfers: TransferRow[];
      try {
        const data = await gqlRequest<{ Transfer: TransferRow[] }>(url, query, {
          limit: LIMIT,
          offset,
          where,
          order_by: orderBy,
        });
        transfers = data.Transfer ?? [];
      } catch (err: any) {
        const msg = String(err?.message ?? err);
        if (msg.includes("Transfer_order_by")) {
          console.log(
            "[envio_export_transfers] full order_by not supported, falling back to timestamp-only ordering (pagination may be unstable)",
          );
          orderBy = [{ timestamp: "asc" }];
          query = QUERY_GET_TRANSFERS;
          continue;
        }
        if (msg.includes("429") || msg.toLowerCase().includes("too many")) {
          console.log("[envio_export_transfers] rate limited; backing off 5s");
          await sleep(5000);
          continue;
        }
        console.error("[envio_export_transfers] request failed:", msg);
        throw err;
      }

      const kept = transfers.filter((t) => t.token?.id);
      for (const t of kept) {
        const row = [
          t.blockNumber,
          t.timestamp,
          t.from,
          t.to,
          t.transactionHash,
          t.chainId,
          t.token!.id,
          t.value,
          t.logIndex,
        ];
        stream.write(row.map((v) => csvEscape(String(v))).join(",") + "\n");
        rowsInCurrentFile++;
        totalDownloaded++;

        if (rowsInCurrentFile >= chunkSize) {
          await closeStream(stream);
          currentFileIndex++;
          rowsInCurrentFile = 0;
          currentFilePath = nextFilePath(outDir, currentFileIndex);
          stream = openCsv(currentFilePath, false);
        }
      }

      const elapsedMs = Date.now() - (state?.startedAtMs ?? startedAtMs);
      console.log(
        `[envio_export_transfers] req=${reqCount} got=${transfers.length} kept=${kept.length} offset=${offset} total=${totalDownloaded} ${fmtRate(
          totalDownloaded,
          elapsedMs,
        )}`,
      );

      offset += transfers.length;
      persistResume({ windowStart, windowEnd, offset });

      if (transfers.length < LIMIT) break;
    }

    // next window
    windowStart = windowEnd;
    windowEnd = Math.min(windowStart + windowSeconds, toTs);
    persistResume({ windowStart, windowEnd, offset: 0 });
  }

  await closeStream(stream);

  const elapsedMs = Date.now() - (state?.startedAtMs ?? startedAtMs);
  console.log(
    `[envio_export_transfers] done total=${totalDownloaded} files=${currentFileIndex} elapsed=${Math.round(
      elapsedMs / 1000,
    )}s (${fmtRate(totalDownloaded, elapsedMs)})`,
  );
}

main().catch((err) => {
  console.error(err);
  exit(1);
});


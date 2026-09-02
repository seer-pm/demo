import { createClient } from "@supabase/supabase-js";
import { holdingsSeerFromShare, pohSeerFromShare } from "./utils/airdropAllocation";
import { computePctOfAirdrop, countSnapshotDays } from "./utils/airdropCalculation/constants";
import { CORS_HEADERS } from "./utils/common";
import { pagedCsvChunks } from "./utils/csv";
import type { Database } from "./utils/supabase";
import { withRetry } from "./utils/withRetry";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const PERIODS = ["1d", "1w", "1m", "all"] as const;
type Period = (typeof PERIODS)[number];

/**
 * Snapshot days each period spans, mirroring `v_days` in `refresh_airdrop_leaderboard`. These are
 * the denominator of `pctOfAirdrop`: a windowed period's rows only accumulate over its own window,
 * so measuring them against the whole programme's emission would understate every wallet.
 *
 * `null` is 'all', which has no cutoff and spans every snapshot since genesis.
 */
const PERIOD_SNAPSHOT_DAYS: Record<Period, number | null> = { "1d": 1, "1w": 7, "1m": 30, all: null };

/**
 * `holdings` and `poh` rank on the RAW share sums stored in airdrop_leaderboard rather than the
 * SEER amounts this endpoint returns. That is exact, not an approximation: the conversion in
 * utils/airdropAllocation.ts is multiplication by a strictly positive constant, so it preserves
 * order and maps ties to ties. See the header of web/supabase/sql/airdrop_leaderboard.sql.
 */
const SORT_KEYS = ["seer", "holdings", "poh", "days"] as const;
type SortKey = (typeof SORT_KEYS)[number];

const SORT_DIRS = ["asc", "desc"] as const;
type SortDir = (typeof SORT_DIRS)[number];

const MAX_LIMIT = 200;

const FORMATS = ["json", "csv"] as const;
type Format = (typeof FORMATS)[number];

/**
 * CSV export paging. The board is served through PostgREST, which caps any response at roughly
 * 1000 rows regardless of the range asked for (see the note in
 * utils/airdropCalculation/computeDailyAirdrop.ts), so the whole board cannot come back in one
 * call. The export walks `get_airdrop_leaderboard_page` a page at a time and streams each page out
 * as it arrives, which keeps memory flat and avoids buffering a multi-megabyte body.
 *
 * The loop trusts `total_count` rather than "a short page means the end": if the gateway ever caps
 * below CSV_PAGE_SIZE, a length check would silently truncate the export instead of paging on.
 * CSV_MAX_ROWS is the runaway guard.
 */
const CSV_PAGE_SIZE = 1000;
const CSV_MAX_ROWS = 500_000;

const CSV_COLUMNS = ["rank", "address", "seer", "pct_of_airdrop", "holdings", "poh", "poh_verified", "days"] as const;

export type AirdropLeaderboardRow = {
  /** Position on the whole board for the current period/sort — not within a search result. */
  rank: number;
  address: string;
  /** Total SEER earned in the period. */
  seer: number;
  /** SEER from outcome-token holdings. */
  holdings: number;
  /** SEER from the Proof of Humanity pool. */
  poh: number;
  /** PoH-verified on at least one day of the period. */
  isPoh: boolean;
  /** Daily snapshots the wallet appears in within the period. */
  days: number;
  /**
   * `seer` as a percentage of the WHOLE airdrop emitted over this period, the SER LPP liquidity
   * programme included. The holdings and PoH pools take a quarter each, so a wallet holding a tenth
   * of the PoH pool reads as 2.5%, not 10%. LP itself is a separate calculation that this endpoint
   * never sees — it only ever appears in the denominator.
   */
  pctOfAirdrop: number;
  updatedAt: string | null;
};

type AddressSearch = { kind: "none" } | { kind: "fragment"; hex: string };

/** One row of get_airdrop_leaderboard_page. */
type PageRow = {
  rank: number | string;
  address: string;
  seer_tokens: number | string | null;
  sum_share_of_holding: number | string | null;
  sum_share_of_holding_poh: number | string | null;
  is_poh: boolean | null;
  day_count: number | null;
  updated_at: string | null;
  total_count: number | string;
  board_count: number | string;
};

function jsonResponse(body: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

/** Lowercase hex address fragment, 0x stripped. Mirrors get-pnl-leaderboard.mts. */
function parseAddressSearch(raw: string | null): AddressSearch | { kind: "invalid" } {
  if (raw == null) return { kind: "none" };
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return { kind: "none" };
  const hex = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
  if (!/^[0-9a-f]+$/.test(hex)) return { kind: "invalid" };
  return { kind: "fragment", hex };
}

function toApiRow(row: PageRow, snapshotDays: number): AirdropLeaderboardRow {
  // seer_tokens_count is already a SEER amount in the source table; the share sums are not.
  const seer = Number(row.seer_tokens) || 0;
  return {
    rank: Number(row.rank) || 0,
    address: row.address.toLowerCase(),
    seer,
    holdings: holdingsSeerFromShare(Number(row.sum_share_of_holding) || 0),
    poh: pohSeerFromShare(Number(row.sum_share_of_holding_poh) || 0),
    isPoh: row.is_poh ?? false,
    days: row.day_count ?? 0,
    pctOfAirdrop: computePctOfAirdrop(seer, snapshotDays),
    updatedAt: row.updated_at,
  };
}

/**
 * Snapshot days to measure this period's allocations against.
 *
 * Clamped to the programme's own length so an early period cannot claim a longer window than has
 * actually been emitted — `refresh_airdrop_leaderboard` clamps the same way, by taking `min` over
 * however many distinct snapshots `LIMIT v_days` returned.
 */
function periodSnapshotDays(period: Period, programmeDays: number): number {
  const windowed = PERIOD_SNAPSHOT_DAYS[period];
  return windowed === null ? programmeDays : Math.min(windowed, programmeDays);
}

/**
 * `airdrop_state.last_timestamp` — the newest snapshot, and so the end of the emission window the
 * percentage is measured over. Mirrors get-airdrop-data-by-user.ts so the portfolio Airdrop tab and
 * this board derive the figure the same way. A missing state row means nothing has been computed
 * yet, and 0 makes computePctOfAirdrop return 0 rather than dividing by zero.
 */
async function getProgrammeDays(): Promise<number> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from("airdrop_state")
      .select("last_timestamp")
      .eq("id", "latest_day")
      .maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    return data?.last_timestamp ? countSnapshotDays(Number(data.last_timestamp)) : 0;
  }, "airdropLeaderboard.snapshotDays");
}

function latestUpdatedAt(rows: { updatedAt: string | null }[]): string | null {
  return rows.reduce<string | null>((latest, r) => {
    if (!r.updatedAt) return latest;
    if (!latest || r.updatedAt > latest) return r.updatedAt;
    return latest;
  }, null);
}

/**
 * One page of the board.
 *
 * Ranking happens inside get_airdrop_leaderboard_page, over the whole period partition and
 * before the address filter, so `rank` is the position on the board even when searching. Do not
 * re-sort these rows here — the RPC's ORDER BY (sort column, then address) is what makes the
 * ranks and the paging agree.
 */
async function loadPage(args: {
  period: Period;
  sort: SortKey;
  dir: SortDir;
  search: string;
  limit: number;
  offset: number;
}): Promise<{ rows: PageRow[]; total: number; boardTotal: number }> {
  return withRetry(async () => {
    const { data, error } = await supabase.rpc("get_airdrop_leaderboard_page", {
      p_period: args.period,
      p_sort: args.sort,
      p_dir: args.dir,
      p_search: args.search,
      p_limit: args.limit,
      p_offset: args.offset,
    });
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as unknown as PageRow[];
    // total_count / board_count repeat on every row; an empty page carries neither.
    return {
      rows,
      total: rows.length > 0 ? Number(rows[0].total_count) || 0 : 0,
      boardTotal: rows.length > 0 ? Number(rows[0].board_count) || 0 : 0,
    };
  }, "airdropLeaderboard.page");
}

/** `airdrop-leaderboard-all-seer-desc-2026-09-01.csv`. All four parts are whitelisted values. */
function csvFilename(period: Period, sort: SortKey, dir: SortDir): string {
  return `airdrop-leaderboard-${period}-${sort}-${dir}-${new Date().toISOString().slice(0, 10)}.csv`;
}

/**
 * The whole board (or the whole search result) as a streamed CSV.
 *
 * `firstPage` is fetched by the caller before the Response is constructed so a dead database still
 * produces a JSON 500 rather than a 200 whose body aborts halfway through the download. Once the
 * stream has started the status is already committed, so later page failures can only abort it.
 *
 * Rows go through the same `loadPage` + `toApiRow` path as the JSON list, so the export's order,
 * ranks and SEER amounts are exactly what the table shows — the RPC's ORDER BY (sort column, then
 * address) is what keeps ranks and paging in agreement, and re-sorting here would break it.
 */
function csvResponse(args: {
  period: Period;
  sort: SortKey;
  dir: SortDir;
  search: string;
  snapshotDays: number;
  firstPage: { rows: PageRow[]; total: number };
}): Response {
  const chunks = pagedCsvChunks<PageRow>({
    header: CSV_COLUMNS,
    firstPage: args.firstPage,
    maxRows: CSV_MAX_ROWS,
    toRow: (raw) => {
      const row = toApiRow(raw, args.snapshotDays);
      return [row.rank, row.address, row.seer, row.pctOfAirdrop, row.holdings, row.poh, row.isPoh, row.days];
    },
    fetchPage: (offset) =>
      loadPage({
        period: args.period,
        sort: args.sort,
        dir: args.dir,
        search: args.search,
        limit: CSV_PAGE_SIZE,
        offset,
      }),
  });

  const encoder = new TextEncoder();
  // One chunk per `pull`, so the next page is only fetched once the client has taken the previous
  // one and a slow consumer cannot make the whole board pile up in the queue.
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await chunks.next();
        if (next.done) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(next.value));
      } catch (e) {
        // The 200 and its headers are already committed by this point, so the only honest signal
        // left is aborting the body — the client sees a failed download rather than a short one.
        console.error("get-airdrop-leaderboard csv stream", e);
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilename(args.period, args.sort, args.dir)}"`,
      // Same window as the JSON path: the board is rebuilt once a day.
      "Cache-Control": "public, max-age=600",
      ...CORS_HEADERS,
    },
  });
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
  }

  try {
    const url = new URL(req.url);

    const period = (url.searchParams.get("period") ?? "all").toLowerCase() as Period;
    if (!(PERIODS as readonly string[]).includes(period)) {
      return jsonResponse({ error: `period must be one of: ${PERIODS.join(", ")}` }, 400);
    }

    const sort = (url.searchParams.get("sort") ?? "seer").toLowerCase() as SortKey;
    if (!(SORT_KEYS as readonly string[]).includes(sort)) {
      return jsonResponse({ error: `sort must be one of: ${SORT_KEYS.join(", ")}` }, 400);
    }

    const dir = (url.searchParams.get("dir") ?? "desc").toLowerCase() as SortDir;
    if (!(SORT_DIRS as readonly string[]).includes(dir)) {
      return jsonResponse({ error: `dir must be one of: ${SORT_DIRS.join(", ")}` }, 400);
    }

    const format = (url.searchParams.get("format") ?? "json").toLowerCase() as Format;
    if (!(FORMATS as readonly string[]).includes(format)) {
      return jsonResponse({ error: `format must be one of: ${FORMATS.join(", ")}` }, 400);
    }

    // rankFor is the same query with the full address as the search term: the RPC ranks before
    // filtering, so the single matching row already carries its board position.
    const rankForRaw = (url.searchParams.get("rankFor") ?? "").trim().toLowerCase();
    if (rankForRaw) {
      if (format === "csv") {
        // rankFor answers "where is this wallet"; csv exports the board. Silently ignoring one of
        // them would hand back the wrong artefact.
        return jsonResponse({ error: "rankFor cannot be combined with format=csv" }, 400);
      }
      if (!/^0x[a-f0-9]{40}$/.test(rankForRaw)) {
        return jsonResponse({ error: "rankFor must be a 0x-prefixed address" }, 400);
      }
      const page = await loadPage({
        period,
        sort,
        dir,
        search: rankForRaw.slice(2),
        limit: 1,
        offset: 0,
      });
      const row = page.rows[0];
      return jsonResponse(
        {
          period,
          sort,
          dir,
          address: rankForRaw,
          rank: row ? Number(row.rank) || null : null,
          total: page.boardTotal,
        },
        200,
        { "Cache-Control": "public, max-age=60" },
      );
    }

    const searchParsed = parseAddressSearch(url.searchParams.get("search"));
    if (searchParsed.kind === "invalid") {
      return jsonResponse({ error: "search must be a hex address fragment" }, 400);
    }
    const search = searchParsed.kind === "fragment" ? searchParsed.hex : "";

    if (format === "csv") {
      // limit/offset are deliberately ignored: the export is every matching row, not a page.
      const [firstPage, programmeDays] = await Promise.all([
        loadPage({ period, sort, dir, search, limit: CSV_PAGE_SIZE, offset: 0 }),
        getProgrammeDays(),
      ]);
      return csvResponse({
        period,
        sort,
        dir,
        search,
        snapshotDays: periodSnapshotDays(period, programmeDays),
        firstPage,
      });
    }

    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50) || 50, 1), MAX_LIMIT);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0) || 0, 0);

    const [page, programmeDays] = await Promise.all([
      loadPage({ period, sort, dir, search, limit, offset }),
      getProgrammeDays(),
    ]);
    const snapshotDays = periodSnapshotDays(period, programmeDays);
    const rows = page.rows.map((row) => toApiRow(row, snapshotDays));

    return jsonResponse(
      {
        period,
        sort,
        dir,
        unit: "SEER",
        /** Denominator behind every row's pctOfAirdrop, so the UI can explain the figure. */
        snapshotDays,
        updatedAt: latestUpdatedAt(rows),
        total: page.total,
        boardTotal: page.boardTotal,
        limit,
        offset,
        rows,
      },
      200,
      // Rebuilt once a day by refresh-airdrop-leaderboard-background.
      { "Cache-Control": "public, max-age=600" },
    );
  } catch (e) {
    console.error("get-airdrop-leaderboard", e);
    return jsonResponse({ error: (e as Error)?.message || "Internal server error" }, 500);
  }
};

import { createClient } from "@supabase/supabase-js";
import { holdingsSeerFromShare, pohSeerFromShare } from "./utils/airdropAllocation";
import { CORS_HEADERS } from "./utils/common";
import type { Database } from "./utils/supabase";
import { withRetry } from "./utils/withRetry";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const PERIODS = ["1d", "1w", "1m", "all"] as const;
type Period = (typeof PERIODS)[number];

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

function toApiRow(row: PageRow): AirdropLeaderboardRow {
  return {
    rank: Number(row.rank) || 0,
    address: row.address.toLowerCase(),
    // seer_tokens_count is already a SEER amount in the source table; the share sums are not.
    seer: Number(row.seer_tokens) || 0,
    holdings: holdingsSeerFromShare(Number(row.sum_share_of_holding) || 0),
    poh: pohSeerFromShare(Number(row.sum_share_of_holding_poh) || 0),
    isPoh: row.is_poh ?? false,
    days: row.day_count ?? 0,
    updatedAt: row.updated_at,
  };
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

    // rankFor is the same query with the full address as the search term: the RPC ranks before
    // filtering, so the single matching row already carries its board position.
    const rankForRaw = (url.searchParams.get("rankFor") ?? "").trim().toLowerCase();
    if (rankForRaw) {
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

    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50) || 50, 1), MAX_LIMIT);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0) || 0, 0);

    const page = await loadPage({ period, sort, dir, search, limit, offset });
    const rows = page.rows.map(toApiRow);

    return jsonResponse(
      {
        period,
        sort,
        dir,
        unit: "SEER",
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

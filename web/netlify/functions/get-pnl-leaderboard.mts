import { SEER_APP_ALL_ID, type SeerAppFilterId, isSeerAppFilterId, listSeerApps } from "@/lib/apps";
import { DEFAULT_CHAIN } from "@/lib/chains";
import { createClient } from "@supabase/supabase-js";
import { CORS_HEADERS } from "./utils/common";
import { roiFromCapitalUsd } from "./utils/pnlLeaderboard";
import type { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

type Period = "1d" | "1w" | "1m" | "all";

export type PnlLeaderboardRow = {
  rank: number;
  address: string;
  username?: string;
  /** Always USD (collateral converted at materialization time). */
  pnl: number;
  /** Gross swap volume in USD. */
  volume: number;
  /**
   * pnl_usd / (value_start_usd + buys_usd); null when capital is dust (< $0.01).
   * buys = (volume + trading_collateral_net_out) / 2 (primary as tokenIn).
   * See capitalUsdFromRow / computeRoiUsd in pnlLeaderboard.ts.
   */
  roi: number | null;
  unit: "USD";
  chainId?: number;
  marketCount: number;
  updatedAt: string | null;
};

/** Normalizes a username or address search while allowing an optional @ prefix. */
function normalizeSearch(raw: string | null): string {
  return (raw ?? "").trim().toLowerCase().replace(/^@/, "");
}

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

function latestUpdatedAt(rows: { updatedAt: string | null }[]): string | null {
  return (
    rows.reduce<string | null>((latest, r) => {
      if (!r.updatedAt) return latest;
      if (!latest || r.updatedAt > latest) return r.updatedAt;
      return latest;
    }, null) ?? null
  );
}

/** Adds Seer usernames to leaderboard rows without requiring a profile for every ranked wallet. */
async function addUsernames(rows: PnlLeaderboardRow[]): Promise<PnlLeaderboardRow[]> {
  if (rows.length === 0) return rows;

  const addresses = [...new Set(rows.map((row) => row.address.toLowerCase()))];
  const { data, error } = await supabase.from("users").select("id, username").in("id", addresses);
  if (error) {
    console.error("Unable to load leaderboard usernames:", error);
    return rows;
  }

  const usernames = new Map((data ?? []).map((user) => [user.id.toLowerCase(), user.username]));
  return rows.map((row) => {
    const username = usernames.get(row.address.toLowerCase());
    return username ? { ...row, username } : row;
  });
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
  }

  try {
    const url = new URL(req.url);
    const appParam = (url.searchParams.get("app") ?? SEER_APP_ALL_ID).toLowerCase();
    const period = (url.searchParams.get("period") ?? "all").toLowerCase() as Period;
    const chainIdParam = (url.searchParams.get("chainId") ?? String(DEFAULT_CHAIN)).toLowerCase();
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50) || 50, 1), 200);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0) || 0, 0);
    const search = normalizeSearch(url.searchParams.get("search"));

    if (!isSeerAppFilterId(appParam)) {
      return jsonResponse(
        {
          error: `app must be one of: all, ${listSeerApps()
            .map((a) => a.id)
            .join(", ")}`,
        },
        400,
      );
    }
    if (!["1d", "1w", "1m", "all"].includes(period)) {
      return jsonResponse({ error: "period must be one of: 1d, 1w, 1m, all" }, 400);
    }

    const app = appParam as SeerAppFilterId;
    const isAllChains = chainIdParam === "all";
    let chainId: number | undefined;
    if (!isAllChains) {
      chainId = Number(chainIdParam);
      if (!Number.isInteger(chainId)) {
        return jsonResponse({ error: "chainId must be a number or 'all'" }, 400);
      }
    }

    const rankFor = (url.searchParams.get("rankFor") ?? "").trim().toLowerCase();
    if (rankFor) {
      if (!/^0x[a-f0-9]{40}$/.test(rankFor)) {
        return jsonResponse({ error: "rankFor must be a 0x-prefixed address" }, 400);
      }
      if (isAllChains) {
        return await serveRankForAllChainsUsd({ app, period, address: rankFor });
      }
      return await serveRankForSingleChainUsd({ app, period, chainId: chainId!, address: rankFor });
    }

    if (isAllChains) {
      return await serveAllChainsUsd({ app, period, limit, offset, search });
    }

    return await serveSingleChainUsd({
      app,
      period,
      chainId: chainId!,
      limit,
      offset,
      search,
    });
  } catch (e) {
    console.error("get-pnl-leaderboard", e);
    return jsonResponse({ error: (e as Error)?.message || "Internal server error" }, 500);
  }
};

async function serveRankForSingleChainUsd(args: {
  app: SeerAppFilterId;
  period: Period;
  chainId: number;
  address: string;
}) {
  const { app, period, chainId, address } = args;

  const { data: row, error: rowError } = await supabase
    .from("pnl_leaderboard")
    .select("address, pnl_usd")
    .eq("app_id", app)
    .eq("chain_id", chainId)
    .eq("period", period)
    .eq("address", address)
    .maybeSingle();

  if (rowError) {
    throw new Error(rowError.message);
  }

  const { count: total, error: totalError } = await supabase
    .from("pnl_leaderboard")
    .select("address", { count: "exact", head: true })
    .eq("app_id", app)
    .eq("chain_id", chainId)
    .eq("period", period);

  if (totalError) {
    throw new Error(totalError.message);
  }

  if (!row) {
    return jsonResponse({ app, chainId, period, address, rank: null, total: total ?? 0 }, 200, {
      "Cache-Control": "public, max-age=60",
    });
  }

  const pnlUsd = Number(row.pnl_usd) || 0;
  // Ahead = higher pnl_usd, or same pnl_usd with lexicographically smaller address (matches list order).
  const { count: aheadHigher, error: aheadHigherError } = await supabase
    .from("pnl_leaderboard")
    .select("address", { count: "exact", head: true })
    .eq("app_id", app)
    .eq("chain_id", chainId)
    .eq("period", period)
    .gt("pnl_usd", pnlUsd);

  if (aheadHigherError) {
    throw new Error(aheadHigherError.message);
  }

  const { count: aheadTie, error: aheadTieError } = await supabase
    .from("pnl_leaderboard")
    .select("address", { count: "exact", head: true })
    .eq("app_id", app)
    .eq("chain_id", chainId)
    .eq("period", period)
    .eq("pnl_usd", pnlUsd)
    .lt("address", address);

  if (aheadTieError) {
    throw new Error(aheadTieError.message);
  }

  return jsonResponse(
    {
      app,
      chainId,
      period,
      address,
      rank: (aheadHigher ?? 0) + (aheadTie ?? 0) + 1,
      total: total ?? 0,
    },
    200,
    { "Cache-Control": "public, max-age=60" },
  );
}

async function serveRankForAllChainsUsd(args: { app: SeerAppFilterId; period: Period; address: string }) {
  const { app, period, address } = args;

  const { data, error } = await supabase.rpc("pnl_leaderboard_all_chains_rank", {
    p_app_id: app,
    p_period: period,
    p_address: address,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = data?.[0];
  return jsonResponse(
    {
      app,
      chainId: "all",
      period,
      address,
      rank: row?.rank == null ? null : Number(row.rank),
      total: Number(row?.total) || 0,
    },
    200,
    { "Cache-Control": "public, max-age=60" },
  );
}

/** Per-chain ranking still uses USD so ranks stay comparable across chains. */
async function serveSingleChainUsd(args: {
  app: SeerAppFilterId;
  period: Period;
  chainId: number;
  limit: number;
  offset: number;
  search: string;
}) {
  const { app, period, chainId, limit, offset, search } = args;

  const { data, error } = await supabase.rpc("pnl_leaderboard_single_chain", {
    p_app_id: app,
    p_chain_id: chainId,
    p_period: period,
    p_search: search || null,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) {
    throw new Error(error.message);
  }

  const page = data ?? [];
  let total = Number(page[0]?.total_count) || 0;
  if (page.length === 0 && offset > 0) {
    const { data: head, error: headError } = await supabase.rpc("pnl_leaderboard_single_chain", {
      p_app_id: app,
      p_chain_id: chainId,
      p_period: period,
      p_search: search || null,
      p_limit: 1,
      p_offset: 0,
    });
    if (headError) {
      throw new Error(headError.message);
    }
    total = Number(head?.[0]?.total_count) || 0;
  }

  const rows: PnlLeaderboardRow[] = page.map((row, i) => ({
    rank: offset + i + 1,
    address: row.address,
    ...(row.username ? { username: row.username } : {}),
    pnl: Number(row.pnl_usd) || 0,
    volume: Number(row.volume_usd) || 0,
    roi: row.roi == null ? null : Number(row.roi),
    unit: "USD",
    chainId,
    marketCount: row.market_count ?? 0,
    updatedAt: row.updated_at,
  }));

  return jsonResponse(
    {
      app,
      chainId,
      period,
      unit: "USD",
      updatedAt: latestUpdatedAt(rows),
      total,
      limit,
      offset,
      rows,
    },
    200,
    { "Cache-Control": "public, max-age=120" },
  );
}

async function serveAllChainsUsd(args: {
  app: SeerAppFilterId;
  period: Period;
  limit: number;
  offset: number;
  search: string;
}) {
  const { app, period, limit, offset, search } = args;

  const { data, error } = await supabase.rpc("pnl_leaderboard_all_chains", {
    p_app_id: app,
    p_period: period,
    p_search: search || null,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    throw new Error(error.message);
  }

  const page = data ?? [];
  let total = Number(page[0]?.total_count) || 0;
  if (page.length === 0 && offset > 0) {
    const { data: head, error: headError } = await supabase.rpc("pnl_leaderboard_all_chains", {
      p_app_id: app,
      p_period: period,
      p_search: search || null,
      p_limit: 1,
      p_offset: 0,
    });
    if (headError) {
      throw new Error(headError.message);
    }
    total = Number(head?.[0]?.total_count) || 0;
  }
  const rowsWithoutUsernames: PnlLeaderboardRow[] = page.map((r, i) => {
    const pnlUsd = Number(r.pnl_usd) || 0;
    const capitalUsd = Number(r.capital_usd) || 0;
    return {
      rank: offset + i + 1,
      address: r.address,
      pnl: pnlUsd,
      volume: Number(r.volume_usd) || 0,
      roi: roiFromCapitalUsd(pnlUsd, capitalUsd),
      unit: "USD",
      marketCount: Number(r.market_count) || 0,
      updatedAt: r.updated_at ?? null,
    };
  });
  const rows = await addUsernames(rowsWithoutUsernames);

  return jsonResponse(
    {
      app,
      chainId: "all",
      period,
      unit: "USD",
      updatedAt: latestUpdatedAt(rows),
      total,
      limit,
      offset,
      rows,
    },
    200,
    { "Cache-Control": "public, max-age=120" },
  );
}

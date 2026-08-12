import { SEER_APP_ALL_ID, type SeerAppFilterId, isSeerAppFilterId, listSeerApps } from "@/lib/apps";
import { DEFAULT_CHAIN } from "@/lib/chains";
import { createClient } from "@supabase/supabase-js";
import { CORS_HEADERS } from "./utils/common";
import { capitalUsdFromRow, roiFromCapitalUsd } from "./utils/pnlLeaderboard";
import type { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

type Period = "1d" | "1w" | "1m" | "all";

export type PnlLeaderboardRow = {
  rank: number;
  address: string;
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

/** Lowercase hex address fragment for ilike search; empty if invalid. */
function sanitizeAddressSearch(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return "";
  const hex = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
  if (!/^[0-9a-f]+$/.test(hex)) return "";
  return hex;
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
    const search = sanitizeAddressSearch(url.searchParams.get("search") ?? "");

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

  const { data, error } = await supabase
    .from("pnl_leaderboard")
    .select(
      "address, pnl_usd, volume, value_start, trading_collateral_net_out, collateral_price_usd, market_count, updated_at",
    )
    .eq("app_id", app)
    .eq("period", period)
    .order("pnl_usd", { ascending: false })
    .limit(5000);

  if (error) {
    throw new Error(error.message);
  }

  type Agg = { pnlUsd: number; capitalUsd: number };
  const byAddress = new Map<string, Agg>();
  for (const row of data ?? []) {
    const addr = row.address.toLowerCase();
    const cur = byAddress.get(addr) ?? { pnlUsd: 0, capitalUsd: 0 };
    cur.pnlUsd += Number(row.pnl_usd) || 0;
    cur.capitalUsd += capitalUsdFromRow({
      valueStart: Number(row.value_start) || 0,
      volume: Number(row.volume) || 0,
      tradingCollateralNetOut: Number(row.trading_collateral_net_out) || 0,
      collateralPriceUsd: Number(row.collateral_price_usd) || 0,
    });
    byAddress.set(addr, cur);
  }

  const ranked = [...byAddress.entries()]
    .map(([addr, v]) => ({ address: addr, pnlUsd: v.pnlUsd }))
    .sort((a, b) => b.pnlUsd - a.pnlUsd || a.address.localeCompare(b.address));

  const index = ranked.findIndex((r) => r.address === address);
  return jsonResponse(
    {
      app,
      chainId: "all",
      period,
      address,
      rank: index >= 0 ? index + 1 : null,
      total: ranked.length,
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

  let query = supabase
    .from("pnl_leaderboard")
    .select("address, pnl_usd, volume_usd, roi, market_count, updated_at, chain_id", { count: "exact" })
    .eq("app_id", app)
    .eq("chain_id", chainId)
    .eq("period", period)
    .order("pnl_usd", { ascending: false })
    .order("address", { ascending: true });

  if (search) {
    query = query.ilike("address", `%${search}%`);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) {
    throw new Error(error.message);
  }

  const rows: PnlLeaderboardRow[] = (data ?? []).map((row, i) => ({
    rank: offset + i + 1,
    address: row.address,
    pnl: Number(row.pnl_usd) || 0,
    volume: Number(row.volume_usd) || 0,
    roi: row.roi == null ? null : Number(row.roi),
    unit: "USD",
    chainId: row.chain_id,
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
      total: count ?? rows.length,
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

  // Fetch a generous page then aggregate in memory (wallet set per app is capped at refresh time).
  let query = supabase
    .from("pnl_leaderboard")
    .select(
      "address, pnl_usd, volume_usd, volume, value_start, trading_collateral_net_out, collateral_price_usd, market_count, updated_at, chain_id",
    )
    .eq("app_id", app)
    .eq("period", period)
    .order("pnl_usd", { ascending: false })
    .limit(5000);

  if (search) {
    query = query.ilike("address", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  type Agg = {
    pnlUsd: number;
    volumeUsd: number;
    capitalUsd: number;
    marketCount: number;
    updatedAt: string | null;
  };
  const byAddress = new Map<string, Agg>();
  for (const row of data ?? []) {
    const address = row.address.toLowerCase();
    const cur = byAddress.get(address) ?? {
      pnlUsd: 0,
      volumeUsd: 0,
      capitalUsd: 0,
      marketCount: 0,
      updatedAt: null,
    };
    cur.pnlUsd += Number(row.pnl_usd) || 0;
    cur.volumeUsd += Number(row.volume_usd) || 0;
    cur.capitalUsd += capitalUsdFromRow({
      valueStart: Number(row.value_start) || 0,
      volume: Number(row.volume) || 0,
      tradingCollateralNetOut: Number(row.trading_collateral_net_out) || 0,
      collateralPriceUsd: Number(row.collateral_price_usd) || 0,
    });
    cur.marketCount += row.market_count ?? 0;
    if (row.updated_at && (!cur.updatedAt || row.updated_at > cur.updatedAt)) {
      cur.updatedAt = row.updated_at;
    }
    byAddress.set(address, cur);
  }

  const ranked = [...byAddress.entries()]
    .map(([address, v]) => ({
      address,
      pnlUsd: v.pnlUsd,
      volumeUsd: v.volumeUsd,
      marketCount: v.marketCount,
      updatedAt: v.updatedAt,
      roi: roiFromCapitalUsd(v.pnlUsd, v.capitalUsd),
    }))
    .sort((a, b) => b.pnlUsd - a.pnlUsd || a.address.localeCompare(b.address));

  const total = ranked.length;
  const page = ranked.slice(offset, offset + limit);
  const rows: PnlLeaderboardRow[] = page.map((r, i) => ({
    rank: offset + i + 1,
    address: r.address,
    pnl: r.pnlUsd,
    volume: r.volumeUsd,
    roi: r.roi,
    unit: "USD",
    marketCount: r.marketCount,
    updatedAt: r.updatedAt,
  }));

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

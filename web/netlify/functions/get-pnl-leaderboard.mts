import {
  SEER_APP_ALL_ID,
  type SeerAppFilterId,
  isSeerAppFilterId,
  listSeerApps,
  materializedAppIdsForFilter,
} from "@/lib/apps";
import { DEFAULT_CHAIN } from "@/lib/chains";
import { createClient } from "@supabase/supabase-js";
import { CORS_HEADERS } from "./utils/common";
import { type OwnerMap, TRADE_EXECUTOR_CHAIN_IDS, hasTradeExecutorConfig, readOwnerMap } from "./utils/executorOwners";
import { roiFromCapitalUsd } from "./utils/pnlLeaderboardMetrics";
import {
  type MaterializedLeaderboardRow,
  type RolledUpLeaderboardRow,
  aggregateRowsAcrossChains,
  matchesAddressSearch,
  rankForAddress,
  rollUpRows,
} from "./utils/pnlLeaderboardRollup";
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
  /** Extra wallets merged into this row (TradeExecutor → owner). */
  mergedWallets?: string[];
};

type AddressSearch = { kind: "none" } | { kind: "fragment"; hex: string };

const LOAD_PAGE_SIZE = 1000;

/** Lowercase hex address fragment for ilike search. */
function parseAddressSearch(raw: string | null): AddressSearch | { kind: "invalid" } {
  if (raw == null) return { kind: "none" };
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return { kind: "none" };
  const hex = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
  if (!/^[0-9a-f]+$/.test(hex)) return { kind: "invalid" };
  return { kind: "fragment", hex };
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

function mapDbRow(row: {
  address: string;
  chain_id: number;
  pnl_usd: number | string | null;
  volume_usd: number | string | null;
  volume: number | string | null;
  value_start: number | string | null;
  trading_collateral_net_out: number | string | null;
  collateral_price_usd: number | string | null;
  market_count: number | null;
  updated_at: string | null;
}): MaterializedLeaderboardRow {
  return {
    address: row.address.toLowerCase(),
    chainId: row.chain_id,
    pnlUsd: Number(row.pnl_usd) || 0,
    volumeUsd: Number(row.volume_usd) || 0,
    volume: Number(row.volume) || 0,
    valueStart: Number(row.value_start) || 0,
    tradingCollateralNetOut: Number(row.trading_collateral_net_out) || 0,
    collateralPriceUsd: Number(row.collateral_price_usd) || 0,
    marketCount: row.market_count ?? 0,
    updatedAt: row.updated_at,
  };
}

/**
 * Load materialized rows for one or more `app_id`s.
 * Split-app aggregates pass every market-scope id; `rollUpRows` then sums additive
 * metrics (and recomputes ROI) across contests for the same address.
 */
async function loadMaterializedRows(args: {
  appIds: string[];
  period: Period;
  chainId?: number;
}): Promise<MaterializedLeaderboardRow[]> {
  if (args.appIds.length === 0) return [];

  const rows: MaterializedLeaderboardRow[] = [];
  for (let offset = 0; ; offset += LOAD_PAGE_SIZE) {
    let query = supabase
      .from("pnl_leaderboard")
      .select(
        "address, chain_id, pnl_usd, volume_usd, volume, value_start, trading_collateral_net_out, collateral_price_usd, market_count, updated_at",
      )
      .in("app_id", args.appIds)
      .eq("period", args.period)
      .order("address", { ascending: true })
      .range(offset, offset + LOAD_PAGE_SIZE - 1);

    if (args.chainId != null) {
      query = query.eq("chain_id", args.chainId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const page = data ?? [];
    for (const row of page) {
      rows.push(mapDbRow(row));
    }
    if (page.length < LOAD_PAGE_SIZE) break;
  }
  return rows;
}

function materializedToRolledUp(row: MaterializedLeaderboardRow): RolledUpLeaderboardRow {
  const capitalUsd =
    (Number(row.valueStart) || 0) * (Number(row.collateralPriceUsd) || 0) +
    Math.max(((Number(row.volume) || 0) + (Number(row.tradingCollateralNetOut) || 0)) / 2, 0) *
      (Number(row.collateralPriceUsd) || 0);

  return {
    address: row.address,
    pnlUsd: row.pnlUsd,
    volumeUsd: row.volumeUsd,
    capitalUsd,
    marketCount: row.marketCount,
    updatedAt: row.updatedAt,
    roi: roiFromCapitalUsd(row.pnlUsd, capitalUsd),
    members: [row.address],
  };
}

async function loadOwnerMapsForChains(chainIds: number[]): Promise<Map<number, OwnerMap>> {
  const maps = new Map<number, OwnerMap>();
  const unique = [...new Set(chainIds.filter(hasTradeExecutorConfig))];
  await Promise.all(
    unique.map(async (chainId) => {
      const owners = await readOwnerMap(chainId).catch(() => ({}) as OwnerMap);
      maps.set(chainId, owners);
    }),
  );
  return maps;
}

/** Prefer an executor→owner hit from any TradeExecutor chain (OP / Gnosis maps are disjoint). */
function canonicalAcrossOwnerMaps(address: string, maps: Map<number, OwnerMap>): string {
  const lower = address.toLowerCase();
  for (const owners of maps.values()) {
    const mapped = owners[lower];
    if (mapped) return mapped;
  }
  return lower;
}

/**
 * Roll up TradeExecutor wallets per chain, then aggregate across market scopes / chains.
 */
function rollUpMaterializedRows(
  materialized: MaterializedLeaderboardRow[],
  ownerMaps: Map<number, OwnerMap>,
  aggregateScopes: boolean,
): RolledUpLeaderboardRow[] {
  const byChain = new Map<number, MaterializedLeaderboardRow[]>();
  for (const row of materialized) {
    const list = byChain.get(row.chainId) ?? [];
    list.push(row);
    byChain.set(row.chainId, list);
  }

  const rolled: RolledUpLeaderboardRow[] = [];
  for (const [chainId, rows] of byChain) {
    if (hasTradeExecutorConfig(chainId)) {
      // rollUpRows also merges duplicate addresses across split market scopes.
      rolled.push(...rollUpRows(rows, ownerMaps.get(chainId) ?? {}));
      continue;
    }
    const plain = rows
      .map(materializedToRolledUp)
      .sort((a, b) => b.pnlUsd - a.pnlUsd || a.address.localeCompare(b.address));
    rolled.push(...(aggregateScopes ? aggregateRowsAcrossChains(plain) : plain));
  }

  if (aggregateScopes || byChain.size > 1) {
    return aggregateRowsAcrossChains(rolled);
  }
  return rolled.sort((a, b) => b.pnlUsd - a.pnlUsd || a.address.localeCompare(b.address));
}

async function buildPublicLeaderboard(args: {
  app: SeerAppFilterId;
  period: Period;
  chainId?: number;
}): Promise<RolledUpLeaderboardRow[]> {
  const appIds = materializedAppIdsForFilter(args.app);
  const materialized = await loadMaterializedRows({
    appIds,
    period: args.period,
    chainId: args.chainId,
  });

  const chainIds = args.chainId != null ? [args.chainId] : [...new Set(materialized.map((row) => row.chainId))];
  const ownerMaps = await loadOwnerMapsForChains(chainIds);

  return rollUpMaterializedRows(materialized, ownerMaps, appIds.length > 1);
}

function toApiRow(row: RolledUpLeaderboardRow, rank: number, chainId?: number | "all"): PnlLeaderboardRow {
  const merged = row.members.filter((member) => member !== row.address);
  return {
    rank,
    address: row.address,
    pnl: row.pnlUsd,
    volume: row.volumeUsd,
    roi: row.roi,
    unit: "USD",
    ...(chainId != null && chainId !== "all" ? { chainId } : {}),
    marketCount: row.marketCount,
    updatedAt: row.updatedAt,
    ...(merged.length > 0 ? { mergedWallets: merged } : {}),
  };
}

function paginateRows(args: {
  rows: RolledUpLeaderboardRow[];
  limit: number;
  offset: number;
  search: string;
  chainId?: number | "all";
}): { total: number; rows: PnlLeaderboardRow[] } {
  const ranked = args.rows.map((row, index) => ({ row, rank: index + 1 }));
  const filtered = args.search ? ranked.filter(({ row }) => matchesAddressSearch(row, args.search)) : ranked;

  return {
    total: filtered.length,
    rows: filtered
      .slice(args.offset, args.offset + args.limit)
      .map(({ row, rank }) => toApiRow(row, rank, args.chainId)),
  };
}

function appFilterErrorMessage(): string {
  const apps = listSeerApps()
    .map((a) => {
      if (!a.splitLeaderboard || a.markets.length === 0) return a.id;
      const scopes = a.markets.map((m) => `${a.id}:${m.id}`).join(", ");
      return `${a.id} (or ${scopes})`;
    })
    .join(", ");
  return `app must be one of: all, ${apps}`;
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
    const searchParsed = parseAddressSearch(url.searchParams.get("search"));
    if (searchParsed.kind === "invalid") {
      return jsonResponse({ error: "search must be a hex address fragment" }, 400);
    }
    const search = searchParsed.kind === "fragment" ? searchParsed.hex : "";

    if (!isSeerAppFilterId(appParam)) {
      return jsonResponse({ error: appFilterErrorMessage() }, 400);
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

    const rankForRaw = (url.searchParams.get("rankFor") ?? "").trim().toLowerCase();
    if (rankForRaw) {
      if (!/^0x[a-f0-9]{40}$/.test(rankForRaw)) {
        return jsonResponse({ error: "rankFor must be a 0x-prefixed address" }, 400);
      }

      const rows = await buildPublicLeaderboard({
        app,
        period,
        chainId: isAllChains ? undefined : chainId,
      });
      const ownerMaps = await loadOwnerMapsForChains(
        isAllChains ? TRADE_EXECUTOR_CHAIN_IDS : chainId != null ? [chainId] : TRADE_EXECUTOR_CHAIN_IDS,
      );
      const canonical = canonicalAcrossOwnerMaps(rankForRaw, ownerMaps);
      const result = rankForAddress(rows, canonical);

      return jsonResponse(
        {
          app,
          chainId: isAllChains ? "all" : chainId,
          period,
          address: canonical,
          rank: result.rank,
          total: result.total,
        },
        200,
        { "Cache-Control": "public, max-age=60" },
      );
    }

    const rows = await buildPublicLeaderboard({
      app,
      period,
      chainId: isAllChains ? undefined : chainId,
    });

    const page = paginateRows({
      rows,
      limit,
      offset,
      search,
      chainId: isAllChains ? "all" : chainId,
    });

    return jsonResponse(
      {
        app,
        chainId: isAllChains ? "all" : chainId,
        period,
        unit: "USD",
        updatedAt: latestUpdatedAt(page.rows),
        total: page.total,
        limit,
        offset,
        rows: page.rows,
      },
      200,
      { "Cache-Control": "public, max-age=120" },
    );
  } catch (e) {
    console.error("get-pnl-leaderboard", e);
    return jsonResponse({ error: (e as Error)?.message || "Internal server error" }, 500);
  }
};

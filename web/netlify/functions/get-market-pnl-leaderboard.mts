import { SEER_APP_ALL_ID } from "@/lib/apps";
import { createClient } from "@supabase/supabase-js";
import { isAddress } from "viem";
import { CORS_HEADERS } from "./utils/common";
import { type OwnerMap, hasTradeExecutorConfig, readOwnerMap } from "./utils/executorOwners";
import { expandMarketIdsWithChildren } from "./utils/expandMarketsCache";
import {
  LEADERBOARD_SORT_DIRS,
  type LeaderboardSortDir,
  type LeaderboardSortKey,
  MARKET_LEADERBOARD_SORT_KEYS,
  type MaterializedLeaderboardRow,
  type RolledUpLeaderboardRow,
  globalScoreWallets,
  matchesAddressSearch,
  mergeScoreStats,
  rollUpRows,
  sortLeaderboardRows,
} from "./utils/pnlLeaderboardRollup";
import type { Database } from "./utils/supabase";
import { type TraderScoreBreakdown, computeTraderScore } from "./utils/traderScore";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const PERIODS = ["1d", "1w", "1m", "all"] as const;
type Period = (typeof PERIODS)[number];

const LOAD_PAGE_SIZE = 1000;
const MAX_LIMIT = 100;

/**
 * Trader scores for the wallets on this page, read from the global (`app_id = 'all'`) board.
 *
 * A score scoped to one market would be meaningless — one market can never clear
 * `MIN_SCORED_MARKETS` — so what this board shows is the trader's protocol-wide score, which is
 * what "trader score" means: a property of the trader, not of the market.
 *
 * Bounded by the page size (`MAX_LIMIT`), and necessarily computed *after* pagination — which is
 * why this endpoint cannot rank by score, and why its sort keys are `MARKET_LEADERBOARD_SORT_KEYS`.
 *
 * The lookup is by member wallet and merged with `mergeScoreStats`, because the page rows have
 * already been rolled up from TradeExecutor contracts to owner EOAs. `globalScoreWallets` widens
 * each row's member list back out to every wallet the owner controls: a row here only lists the
 * wallets that traded *this* market, while the score it displays spans all of them.
 */
async function loadGlobalScores(args: {
  chainId: number;
  period: Period;
  rows: RolledUpLeaderboardRow[];
  owners: OwnerMap;
}): Promise<Map<string, TraderScoreBreakdown | null>> {
  const result = new Map<string, TraderScoreBreakdown | null>();
  const walletsByRow = globalScoreWallets(args.rows, args.owners);
  const addresses = [...new Set([...walletsByRow.values()].flat())];
  if (addresses.length === 0) return result;

  const { data, error } = await supabase
    .from("pnl_leaderboard")
    .select(
      "address, pnl_usd, scored_market_count, winning_market_count, gross_profit_usd, gross_loss_usd, best_market_pnl_usd, scored_capital_usd",
    )
    .eq("app_id", SEER_APP_ALL_ID)
    .eq("chain_id", args.chainId)
    .eq("period", args.period)
    .in("address", addresses);

  // The score is optional context on this board; a failed lookup must not fail the board.
  if (error || !data) return result;

  const byAddress = new Map(data.map((row) => [row.address.toLowerCase(), row]));
  for (const row of args.rows) {
    const parts = (walletsByRow.get(row.address) ?? [])
      .map((wallet) => byAddress.get(wallet))
      .filter((part) => part != null);
    if (parts.length === 0) {
      result.set(row.address, null);
      continue;
    }
    const stats = mergeScoreStats(
      parts.map((part) => ({
        scoredMarketCount: part.scored_market_count ?? 0,
        winningMarketCount: part.winning_market_count ?? 0,
        grossProfitUsd: Number(part.gross_profit_usd) || 0,
        grossLossUsd: Number(part.gross_loss_usd) || 0,
        bestMarketPnlUsd: Number(part.best_market_pnl_usd) || 0,
        scoredCapitalUsd: Number(part.scored_capital_usd) || 0,
      })),
    );
    const pnlUsd = parts.reduce((total, part) => total + (Number(part.pnl_usd) || 0), 0);
    result.set(row.address, computeTraderScore({ ...stats, pnlUsd }));
  }
  return result;
}

/**
 * Leaderboard for a single market, straight from `pnl_market_leaderboard`.
 *
 * The per-market rows are the source of truth, so this needs no compute of its own — the board is a
 * filtered read of what the wallet pass already produced. Before per-market materialization this
 * page had no backing at all: the only per-market number available was a live
 * `computePortfolioPlAllPeriods` per visitor.
 *
 * `marketId` is expanded parent→children before querying. App boards name a parent session market
 * while the trading happens on its conditional children, so querying the parent alone returns an
 * empty board — which is exactly what the interesting markets look like.
 *
 * `?marketId=0x…&chainId=100` plus the usual `period`, `sort`, `dir`, `limit`, `offset`, `search`.
 */
export default async (req: Request) => {
  const url = new URL(req.url);
  const marketId = (url.searchParams.get("marketId") ?? "").toLowerCase();
  const chainIdRaw = url.searchParams.get("chainId");
  const period = (url.searchParams.get("period") ?? "all") as Period;
  const sort = (url.searchParams.get("sort") ?? "pnl") as LeaderboardSortKey;
  const dir = (url.searchParams.get("dir") ?? "desc") as LeaderboardSortDir;
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, MAX_LIMIT);
  const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);
  const search = (url.searchParams.get("search") ?? "").trim().toLowerCase().replace(/^0x/, "");

  const bad = (error: string) =>
    new Response(JSON.stringify({ error }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });

  if (!isAddress(marketId)) return bad("marketId must be a market address");
  const chainId = Number(chainIdRaw);
  if (!Number.isInteger(chainId) || chainId <= 0) return bad("chainId is required");
  if (!PERIODS.includes(period)) return bad(`period must be one of: ${PERIODS.join(", ")}`);
  if (!MARKET_LEADERBOARD_SORT_KEYS.includes(sort))
    return bad(`sort must be one of: ${MARKET_LEADERBOARD_SORT_KEYS.join(", ")}`);
  if (!LEADERBOARD_SORT_DIRS.includes(dir)) return bad(`dir must be one of: ${LEADERBOARD_SORT_DIRS.join(", ")}`);
  if (search && !/^[0-9a-f]+$/.test(search)) return bad("search must be a hex address fragment");

  let marketIds: string[];
  try {
    marketIds = (await expandMarketIdsWithChildren(chainId, [marketId as `0x${string}`])).map((id) => id.toLowerCase());
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  const rows: MaterializedLeaderboardRow[] = [];
  for (let start = 0; ; start += LOAD_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("pnl_market_leaderboard")
      .select("address, chain_id, pnl_usd, volume_usd, capital_deployed, collateral_price_usd, traded, updated_at")
      .eq("chain_id", chainId)
      .in("market_id", marketIds)
      .eq("period", period)
      // `address` alone is not unique here — the query spans the parent market and all its
      // children, so one wallet yields one row per market. `range()` needs a total order or a page
      // boundary inside a tie group can drop or duplicate rows, and `rollUpRows` sums them.
      .order("address", { ascending: true })
      .order("market_id", { ascending: true })
      .range(start, start + LOAD_PAGE_SIZE - 1);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }
    const page = data ?? [];
    for (const row of page) {
      rows.push({
        address: row.address.toLowerCase(),
        chainId: row.chain_id,
        pnlUsd: Number(row.pnl_usd) || 0,
        volumeUsd: Number(row.volume_usd) || 0,
        valueStart: 0,
        capitalDeployed: Number(row.capital_deployed) || 0,
        collateralPriceUsd: Number(row.collateral_price_usd) || 0,
        // One row per (wallet, child market); `rollUpRows` sums these into traded-market counts.
        marketCount: row.traded ? 1 : 0,
        // Zero on purpose: a score scoped to one market can never clear MIN_SCORED_MARKETS, so
        // `rollUpRows` yields `score: null` here. The score shown on this board is the trader's
        // global one, joined in below.
        scoredMarketCount: 0,
        winningMarketCount: 0,
        grossProfitUsd: 0,
        grossLossUsd: 0,
        bestMarketPnlUsd: 0,
        scoredCapitalUsd: 0,
        updatedAt: row.updated_at,
      });
    }
    if (page.length < LOAD_PAGE_SIZE) break;
  }

  // TradeExecutor contracts hold the position while the owner EOA is the participant, so the same
  // rollup the protocol-wide board uses applies here.
  let owners: OwnerMap = {};
  if (hasTradeExecutorConfig(chainId)) {
    try {
      owners = await readOwnerMap(chainId);
    } catch {
      owners = {};
    }
  }

  const rolled = rollUpRows(rows, owners).filter((row) => row.pnlUsd !== 0 || row.marketCount > 0);
  const sorted = sortLeaderboardRows(rolled, sort, dir);
  const filtered = search ? sorted.filter((row) => matchesAddressSearch(row, search)) : sorted;

  const page = filtered.slice(offset, offset + limit);
  const scores = await loadGlobalScores({ chainId, period, rows: page, owners });

  const body = {
    marketId,
    /** Includes the conditional children the board actually aggregates. */
    marketIds,
    chainId,
    period,
    total: filtered.length,
    rows: page.map((row, i) => {
      const breakdown = scores.get(row.address) ?? null;
      return {
        rank: offset + i + 1,
        address: row.address,
        pnl: row.pnlUsd,
        volume: row.volumeUsd,
        roi: row.roi,
        unit: "USD" as const,
        // `rollUpRows` already summed capital in USD across the merged wallets.
        capitalUsd: row.capitalUsd,
        /** The trader's protocol-wide score, not a score for this market. */
        score: breakdown?.score ?? null,
        tier: breakdown?.tier ?? null,
        updatedAt: row.updatedAt,
        ...(row.members.length > 1 ? { mergedWallets: row.members.filter((m) => m !== row.address) } : {}),
      };
    }),
  };

  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=120",
      ...CORS_HEADERS,
    },
  });
};

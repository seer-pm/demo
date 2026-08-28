import { SEER_APP_ALL_ID, leaderboardJobsFromApps } from "@/lib/apps";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import type { SupportedChain } from "@seer-pm/sdk";
import { DEFAULT_COLLATERAL_PROFILE, getCollateralProfileByName } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Address } from "viem";
import { getDexScreenerPriceUSD } from "./common";
import { jobUsesTradeExecutors, resolveOwnerMap } from "./executorOwners";
import { expandMarketIdsWithChildren } from "./expandMarketsCache";
import { computeRoiUsd } from "./pnlLeaderboardMetrics";
import { type LeaderboardCandidate, rankRefreshCandidates, withExecutors } from "./pnlLeaderboardRollup";
import { type LeaderboardScope, type PnlMarketInsert, buildMarketRows, deriveLeaderboardRows } from "./pnlMarketRows";
import { PORTFOLIO_PL_PERIODS, computePortfolioPlAllPeriods } from "./portfolioPlCompute";
import type { Database, TablesInsert } from "./supabase";

/** Serialize wallets so Envio pacing (~200/min) is not burst by parallel computes. */
export const PNL_LEADERBOARD_CONCURRENCY = 1;
/** Max wallets to compute/upsert per app×chain job in one background run. */
export const PNL_LEADERBOARD_BATCH_SIZE = 200;
/** Only wallets with analytics activity in this UTC window are refresh candidates. */
export const PNL_LEADERBOARD_RECENT_DAYS = 5;
/** Stay under Netlify's ~15m background limit. */
export const PNL_LEADERBOARD_REFRESH_BUDGET_MS = 13 * 60 * 1000;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const DAY_SECONDS = 86_400;

export type { LeaderboardCandidate } from "./pnlLeaderboardRollup";

export type RefreshJob = {
  /** Materialized `pnl_leaderboard.app_id` (`all`, app id, or `app:market` for split apps). */
  appId: string;
  chainId: number;
  /** `undefined` = protocol-wide (no market allowlist). */
  marketIds: Address[] | undefined;
};

type PnlLeaderboardInsert = TablesInsert<"pnl_leaderboard">;

export {
  ROI_CAPITAL_DUST_USD,
  capitalUsdFromRow,
  computeRoiUsd,
  roiFromCapitalUsd,
} from "./pnlLeaderboardMetrics";

/** UTC midnight of the first day included in the recent-activity window. */
export function recentActivityCutoffDay(
  nowSec = Math.floor(Date.now() / 1000),
  recentDays = PNL_LEADERBOARD_RECENT_DAYS,
): number {
  const todayMidnight = Math.floor(nowSec / DAY_SECONDS) * DAY_SECONDS;
  return todayMidnight - recentDays * DAY_SECONDS;
}

/**
 * Every wallet with analytics activity in the last `PNL_LEADERBOARD_RECENT_DAYS` UTC days.
 * When `marketIds` is omitted, uses the whole chain (All / protocol-wide).
 */
export async function listLeaderboardCandidates(
  supabase: SupabaseClient<Database>,
  chainId: number,
  marketIds: Address[] | undefined,
  opts?: {
    /**
     * Override the recency window. Pass `0` for the whole analytics history — what backfill and
     * the shadow comparison need, since they are about coverage and correctness rather than
     * freshness. Chains with no activity in the last `PNL_LEADERBOARD_RECENT_DAYS` days yield no
     * candidates at all under the default.
     */
    cutoffDay?: number;
  },
): Promise<LeaderboardCandidate[]> {
  const cutoffDay = opts?.cutoffDay ?? recentActivityCutoffDay();

  if (marketIds === undefined) {
    return listCandidatesFromWalletAnalytics(supabase, chainId, cutoffDay);
  }
  if (marketIds.length === 0) return [];

  return listCandidatesFromAnalytics(supabase, chainId, marketIds, cutoffDay);
}

const CANDIDATE_PAGE_SIZE = 1000;

type CandidateAnalyticsRow = { address: string | null; day?: number | null };

/** Latest activity day per address; the day is what tells us whether a row has gone stale. */
function addCandidateAddresses(into: Map<string, number>, rows: CandidateAnalyticsRow[]): void {
  for (const row of rows) {
    const address = (row.address ?? "").toLowerCase();
    if (!address || address === ZERO_ADDRESS) continue;
    const day = Number(row.day ?? 0) || 0;
    into.set(address, Math.max(into.get(address) ?? 0, day));
  }
}

async function loadCandidateAddresses(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: CandidateAnalyticsRow[] | null; error: { message: string } | null }>,
  errorContext: string,
): Promise<LeaderboardCandidate[]> {
  const lastDayByAddress = new Map<string, number>();
  for (let offset = 0; ; offset += CANDIDATE_PAGE_SIZE) {
    const { data, error } = await fetchPage(offset, offset + CANDIDATE_PAGE_SIZE - 1);
    if (error) {
      throw new Error(`pnl-leaderboard: ${errorContext}: ${error.message}`);
    }
    const rows = data ?? [];
    addCandidateAddresses(lastDayByAddress, rows);
    if (rows.length < CANDIDATE_PAGE_SIZE) break;
  }
  return [...lastDayByAddress].map(([address, lastActivityDay]) => ({ address, lastActivityDay }));
}

async function listCandidatesFromWalletAnalytics(
  supabase: SupabaseClient<Database>,
  chainId: number,
  cutoffDay: number,
): Promise<LeaderboardCandidate[]> {
  return loadCandidateAddresses(
    (from, to) =>
      supabase
        .from("analytics_daily_wallet")
        .select("address, day")
        .eq("chain_id", chainId)
        .gte("day", cutoffDay)
        .order("address", { ascending: true })
        .order("day", { ascending: true })
        .range(from, to),
    "analytics_daily_wallet unavailable",
  );
}

async function listCandidatesFromAnalytics(
  supabase: SupabaseClient<Database>,
  chainId: number,
  marketIds: Address[],
  cutoffDay: number,
): Promise<LeaderboardCandidate[]> {
  const marketIdLcs = marketIds.map((id) => id.toLowerCase());
  return loadCandidateAddresses(
    (from, to) =>
      supabase
        .from("analytics_daily_wallet_market")
        .select("address, day")
        .eq("chain_id", chainId)
        .in("market_id", marketIdLcs)
        .gte("day", cutoffDay)
        .order("address", { ascending: true })
        .order("day", { ascending: true })
        .order("market_id", { ascending: true })
        .range(from, to),
    "analytics_daily_wallet_market unavailable",
  );
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
  shouldAbort?: () => boolean,
): Promise<{ abortedByBudget: boolean }> {
  let i = 0;
  let abortedByBudget = false;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      if (shouldAbort?.()) {
        abortedByBudget = true;
        return;
      }
      const idx = i++;
      await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return { abortedByBudget };
}

/** Addresses per `.in()` lookup. If PostgREST 414s, lower this — do not swallow the error. */
const STALE_LOOKUP_IN_CHUNK = 200;

/** Reject returned `updated_at` older than this; catches silent no-op upserts. */
const UPSERT_UPDATED_AT_MAX_AGE_MS = 5 * 60 * 1000;

function updatedAtMs(value: string | undefined): number | null {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

/**
 * Prefer wallets missing from `pnl_leaderboard`, then those with the oldest `updated_at`
 * (period=`all` is the representative row — all periods upsert together).
 */
export async function selectStaleLeaderboardBatch(
  supabase: SupabaseClient<Database>,
  appId: string,
  chainId: number,
  candidates: LeaderboardCandidate[],
  batchSize: number,
): Promise<LeaderboardCandidate[]> {
  if (candidates.length === 0 || batchSize <= 0) return [];

  const addresses = candidates.map((c) => c.address.toLowerCase());
  const updatedAtByAddress = new Map<string, string>();

  for (let offset = 0; offset < addresses.length; offset += STALE_LOOKUP_IN_CHUNK) {
    const chunk = addresses.slice(offset, offset + STALE_LOOKUP_IN_CHUNK);
    const { data, error } = await supabase
      .from("pnl_leaderboard")
      .select("address, updated_at")
      .eq("app_id", appId)
      .eq("chain_id", chainId)
      .eq("period", "all")
      .in("address", chunk);

    if (error) {
      throw new Error(
        `pnl-leaderboard: stale batch lookup failed (inChunk=${STALE_LOOKUP_IN_CHUNK}): ${error.message}`,
      );
    }
    for (const row of data ?? []) {
      const address = (row.address ?? "").toLowerCase();
      if (address && row.updated_at) {
        updatedAtByAddress.set(address, row.updated_at);
      }
    }
  }

  const lastUpdatedMsByAddress = new Map<string, number | null>();
  for (const candidate of candidates) {
    const address = candidate.address.toLowerCase();
    lastUpdatedMsByAddress.set(address, updatedAtMs(updatedAtByAddress.get(address)));
  }
  return rankRefreshCandidates(candidates, lastUpdatedMsByAddress).slice(0, batchSize);
}

export type RefreshAppChainResult = {
  appId: string;
  chainId: number;
  candidates: number;
  /** Wallets actually computed this run (`upserted + failures`), not the claimed batch size. */
  processed: number;
  /** Candidates not in this batch (deferred to a later run). */
  skippedStale: number;
  upserted: number;
  failures: number;
  abortedByBudget: boolean;
  collateralPriceUsd: number;
  scope: "global" | "markets";
  /** Allowlist size after parent→child expansion (undefined when global). */
  marketCount?: number;
  /** Rows written to `pnl_market_leaderboard` (global job only). */
  marketRowsUpserted: number;
};

export { expandMarketIdsWithChildren } from "./expandMarketsCache";

class FatalLeaderboardUpsertError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FatalLeaderboardUpsertError";
  }
}

function isFatalLeaderboardUpsertError(error: unknown): boolean {
  return error instanceof FatalLeaderboardUpsertError;
}

async function upsertLeaderboardRows(
  supabase: SupabaseClient<Database>,
  address: string,
  rows: PnlLeaderboardInsert[],
): Promise<void> {
  const { data, error, count } = await supabase
    .from("pnl_leaderboard")
    .upsert(rows, {
      onConflict: "app_id,chain_id,address,period",
      count: "exact",
    })
    .select("address, period, updated_at");

  if (error) {
    throw new Error(`pnl-leaderboard upsert failed ${address}: ${error.message}`);
  }

  const written = data ?? [];
  if (count === 0 || written.length === 0) {
    throw new FatalLeaderboardUpsertError(
      `pnl-leaderboard: upsert wrote 0 rows for ${address} (count=${count}, returned=${written.length}); check SUPABASE_API_KEY is service_role and INSERT/UPDATE grants (anon is SELECT-only)`,
    );
  }
  if (written.length !== rows.length) {
    throw new FatalLeaderboardUpsertError(
      `pnl-leaderboard: upsert wrote ${written.length}/${rows.length} rows for ${address} (count=${count})`,
    );
  }

  const freshAfter = Date.now() - UPSERT_UPDATED_AT_MAX_AGE_MS;
  const stale = written.filter((row) => {
    if (!row.updated_at) return true;
    const ts = Date.parse(row.updated_at);
    return !Number.isFinite(ts) || ts < freshAfter;
  });
  if (stale.length > 0) {
    throw new FatalLeaderboardUpsertError(
      `pnl-leaderboard: upsert wrote ${stale.length}/${written.length} rows with stale or missing updated_at for ${address}; writes may be no-ops`,
    );
  }
}

/**
 * Write one wallet's per-market rows, then drop whatever this pass superseded.
 *
 * Every row of a pass carries the same `writtenAt`, so rows for this wallet with an older
 * `updated_at` are by definition from a previous generation that this pass did not reproduce.
 *
 * The cleanup is not optional. A fanned-out conditional leg is attributed to one market chosen from
 * the duplicate group (`dedupeConditionalEventLegs`), and that choice depends on the wallet's market
 * universe — which changes between runs. Without the sweep the old attribution survives alongside
 * the new one and the same amount is summed twice: observed in production as `trading` folding to
 * −290.44 against a scalar of −145.22, exactly double.
 *
 * This is narrower than "delete markets with no current position", which would be wrong: the market
 * key set is a union that includes historical swaps and transfers, so a market the wallet fully
 * exited is still reproduced every pass and survives. `period='all'` stays cumulative.
 */
async function upsertMarketRows(
  supabase: SupabaseClient<Database>,
  address: string,
  rows: PnlMarketInsert[],
  chainId: number,
  writtenAt: string,
): Promise<number> {
  if (rows.length === 0) return 0;

  const { data, error, count } = await supabase
    .from("pnl_market_leaderboard")
    .upsert(rows, { onConflict: "chain_id,address,market_id,period", count: "exact" })
    .select("market_id, period");

  if (error) {
    throw new Error(`pnl-market upsert failed ${address}: ${error.message}`);
  }
  const written = data ?? [];
  if (count === 0 || written.length === 0) {
    throw new FatalLeaderboardUpsertError(
      `pnl-market: upsert wrote 0 rows for ${address} (count=${count}, returned=${written.length}); check SUPABASE_API_KEY is service_role and INSERT/UPDATE grants (anon is SELECT-only)`,
    );
  }
  if (written.length !== rows.length) {
    throw new FatalLeaderboardUpsertError(
      `pnl-market: upsert wrote ${written.length}/${rows.length} rows for ${address} (count=${count})`,
    );
  }

  const { error: sweepError } = await supabase
    .from("pnl_market_leaderboard")
    .delete()
    .eq("chain_id", chainId)
    .eq("address", address.toLowerCase())
    .lt("updated_at", writtenAt);
  if (sweepError) {
    throw new Error(`pnl-market: superseded-row sweep failed ${address}: ${sweepError.message}`);
  }

  return written.length;
}

/**
 * Materialized scopes a single global pass now covers on one chain: `all`, plus every app board
 * whose markets live there. Allowlists are expanded parent→child once per chain, not per wallet.
 */
export async function leaderboardScopesForChain(chainId: number): Promise<LeaderboardScope[]> {
  const scopes: LeaderboardScope[] = [{ appId: SEER_APP_ALL_ID, marketIds: undefined }];
  for (const job of leaderboardJobsFromApps()) {
    if (job.chainId !== chainId) continue;
    const expanded = await expandMarketIdsWithChildren(chainId, job.marketIds);
    scopes.push({ appId: job.appId, marketIds: new Set(expanded.map((id) => id.toLowerCase())) });
  }
  return scopes;
}

export async function refreshPnlLeaderboardForAppChain(
  supabase: SupabaseClient<Database>,
  appId: string,
  chainId: number,
  marketIds: Address[] | undefined,
  opts?: {
    concurrency?: number;
    batchSize?: number;
    /** Absolute deadline (Date.now() ms). When exceeded, stop claiming new wallets. */
    deadlineMs?: number;
    /** If set, compute exactly these wallets (no analytics candidate list / stale rotation). */
    candidates?: LeaderboardCandidate[];
  },
): Promise<RefreshAppChainResult> {
  const concurrency = opts?.concurrency ?? PNL_LEADERBOARD_CONCURRENCY;
  const batchSize = opts?.batchSize ?? PNL_LEADERBOARD_BATCH_SIZE;
  const shouldAbort = opts?.deadlineMs != null ? () => Date.now() >= opts.deadlineMs! : undefined;
  const supportedChain = chainId as SupportedChain;
  const isGlobal = marketIds === undefined;
  let scopedMarketIds: Address[] | undefined;
  if (marketIds === undefined) {
    scopedMarketIds = undefined;
  } else {
    scopedMarketIds = await expandMarketIdsWithChildren(chainId, marketIds);
  }

  if (shouldAbort?.()) {
    return {
      appId,
      chainId,
      candidates: 0,
      processed: 0,
      skippedStale: 0,
      upserted: 0,
      failures: 0,
      abortedByBudget: true,
      collateralPriceUsd: 0,
      scope: isGlobal ? "global" : "markets",
      marketCount: scopedMarketIds?.length,
      marketRowsUpserted: 0,
    };
  }

  let candidates: LeaderboardCandidate[];
  let batch: LeaderboardCandidate[];
  let skippedStale: number;
  const expandExecutors = jobUsesTradeExecutors(appId, chainId);

  if (opts?.candidates) {
    candidates = opts.candidates;
    if (expandExecutors) {
      const candidateAddresses = candidates.map((candidate) => candidate.address);
      let owners = {};
      try {
        owners = await resolveOwnerMap(chainId, candidateAddresses);
      } catch (e) {
        console.error("pnl-leaderboard: owner map resolve failed", e instanceof Error ? e.message : e);
      }
      candidates = withExecutors(candidates, owners);
    }
    batch = candidates;
    skippedStale = 0;
  } else {
    // No recency cutoff: `rankRefreshCandidates` decides what is worth recomputing, and the fixed
    // 5-day window was starving every chain but gnosis.
    candidates = await listLeaderboardCandidates(supabase, chainId, scopedMarketIds, { cutoffDay: 0 });

    if (expandExecutors) {
      const candidateAddresses = candidates.map((candidate) => candidate.address);
      let owners = {};
      try {
        owners = await resolveOwnerMap(chainId, candidateAddresses);
      } catch (e) {
        console.error("pnl-leaderboard: owner map resolve failed", e instanceof Error ? e.message : e);
      }
      candidates = withExecutors(candidates, owners);
    }

    batch = await selectStaleLeaderboardBatch(supabase, appId, chainId, candidates, batchSize);
    skippedStale = Math.max(0, candidates.length - batch.length);
  }

  const profile = getCollateralProfileByName(supportedChain, DEFAULT_COLLATERAL_PROFILE);
  const primaryCollateral = profile.primary;
  const collateralPriceUsd = await getDexScreenerPriceUSD(primaryCollateral.address, supportedChain);
  if (!(collateralPriceUsd > 0)) {
    throw new Error(
      `pnl-leaderboard: refusing refresh for chain ${chainId}: collateral USD price is ${collateralPriceUsd} (token ${primaryCollateral.address}); would zero pnl_usd`,
    );
  }

  let upserted = 0;
  let failures = 0;
  let marketRowsUpserted = 0;
  const endTime = Math.floor(Date.now() / 1000);
  // Only the protocol-wide job writes per-market rows: it is the one scope that covers every market
  // on the chain, so app jobs would write partial duplicates of the same (wallet, market) rows.
  const writeMarketRows = isGlobal;
  // The global pass also materializes every app board from the same buckets, so no app-scoped job
  // has to recompute the wallet.
  const deriveScopes = isGlobal;
  const scopes = deriveScopes ? await leaderboardScopesForChain(chainId) : [];

  const { abortedByBudget } = await mapPool(
    batch,
    concurrency,
    async (candidate) => {
      try {
        const computed = await computePortfolioPlAllPeriods({
          supabase,
          account: candidate.address as Address,
          chainId: supportedChain,
          chainIdNum: chainId,
          endTime,
          // Global: omit marketIds so compute uses full-chain portfolio PL.
          marketIds: isGlobal ? undefined : scopedMarketIds,
          collateralProfile: DEFAULT_COLLATERAL_PROFILE,
          primaryCollateral,
          withMarketBreakdown: writeMarketRows,
        });
        if (!computed) {
          failures += 1;
          return;
        }

        const writtenAt = new Date().toISOString();
        const rows: PnlLeaderboardInsert[] =
          deriveScopes && computed.byMarketPeriod
            ? deriveLeaderboardRows({
                address: candidate.address,
                chainId,
                byMarketPeriod: computed.byMarketPeriod,
                scopes,
                collateralPriceUsd,
                writtenAt,
              })
            : PORTFOLIO_PL_PERIODS.map((period) => {
                const snap = computed.byPeriod[period];
                const pnl = Number(snap.pnl) || 0;
                const pnlUsd = pnl * collateralPriceUsd;
                const valueStart = Number(snap.valueStart) || 0;
                const tradingCollateralNetOut = Number(snap.tradingCollateralNetOut) || 0;
                const lpCollateralNetOut = Number(snap.lpCollateralNetOut) || 0;
                const volume = Number(snap.volume) || 0;
                const capitalDeployed = Number(snap.capitalDeployed) || 0;
                return {
                  app_id: appId,
                  chain_id: chainId,
                  address: candidate.address.toLowerCase(),
                  period,
                  pnl,
                  pnl_usd: pnlUsd,
                  collateral_price_usd: collateralPriceUsd,
                  value_start: valueStart,
                  value_end: Number(snap.valueEnd) || 0,
                  trading_collateral_net_out: tradingCollateralNetOut,
                  lp_collateral_net_out: lpCollateralNetOut,
                  volume,
                  volume_usd: volume * collateralPriceUsd,
                  capital_deployed: capitalDeployed,
                  roi: computeRoiUsd({ pnlUsd, capitalDeployed, collateralPriceUsd }),
                  market_count: Number(snap.marketCount) || 0,
                  updated_at: writtenAt,
                };
              });

        if (writeMarketRows && computed.byMarketPeriod) {
          const marketRows = buildMarketRows({
            account: candidate.address,
            chainId,
            byMarketPeriod: computed.byMarketPeriod,
            periods: PORTFOLIO_PL_PERIODS,
            startTimeByPeriod: computed.startTimeByPeriod,
            endTime,
            collateralPriceUsd,
            writtenAt,
          });
          marketRowsUpserted += await upsertMarketRows(supabase, candidate.address, marketRows, chainId, writtenAt);
        }

        try {
          await upsertLeaderboardRows(supabase, candidate.address, rows);
        } catch (e) {
          if (isFatalLeaderboardUpsertError(e)) throw e;
          console.error("pnl-leaderboard upsert failed", candidate.address, e instanceof Error ? e.message : e);
          failures += 1;
          return;
        }
        upserted += 1;
      } catch (e) {
        if (isFatalLeaderboardUpsertError(e)) throw e;
        console.error("pnl-leaderboard wallet compute failed", candidate.address, e);
        failures += 1;
      }
    },
    shouldAbort,
  );

  return {
    appId,
    chainId,
    candidates: candidates.length,
    processed: upserted + failures,
    skippedStale,
    upserted,
    failures,
    abortedByBudget,
    collateralPriceUsd,
    scope: isGlobal ? "global" : "markets",
    marketCount: scopedMarketIds?.length,
    marketRowsUpserted,
  };
}

/**
 * One protocol-wide job per supported chain — that is the whole ring now.
 *
 * Each pass computes a wallet once and materializes every board from the same per-market buckets
 * (`leaderboardScopesForChain`), so app scopes no longer need a job. Adding an app is a config edit.
 * Background refresh walks this list from a persisted cursor.
 */
export function listPnlLeaderboardRefreshJobs(): RefreshJob[] {
  const jobs: RefreshJob[] = [];

  for (const chain of Object.values(SUPPORTED_CHAINS)) {
    jobs.push({ appId: SEER_APP_ALL_ID, chainId: chain.id, marketIds: undefined });
  }

  // App boards are derived from the global pass; they no longer need a job of their own.
  return jobs;
}

const REFRESH_CURSOR_ID = "default";

export async function loadPnlLeaderboardRefreshCursor(
  supabase: SupabaseClient<Database>,
): Promise<{ appId: string; chainId: number } | null> {
  const { data, error } = await supabase
    .from("pnl_leaderboard_refresh_cursor")
    .select("app_id, chain_id")
    .eq("id", REFRESH_CURSOR_ID)
    .maybeSingle();
  if (error) {
    throw new Error(`pnl-leaderboard: load refresh cursor failed: ${error.message}`);
  }
  if (!data) return null;
  return { appId: data.app_id, chainId: data.chain_id };
}

export async function savePnlLeaderboardRefreshCursor(
  supabase: SupabaseClient<Database>,
  job: { appId: string; chainId: number },
): Promise<void> {
  const { error } = await supabase.from("pnl_leaderboard_refresh_cursor").upsert({
    id: REFRESH_CURSOR_ID,
    app_id: job.appId,
    chain_id: job.chainId,
  });
  if (error) {
    throw new Error(`pnl-leaderboard: save refresh cursor failed: ${error.message}`);
  }
}

/** Index of the job after `cursor` in `jobs`, wrapping. Missing cursor → 0. */
export function nextJobIndexAfterCursor(jobs: RefreshJob[], cursor: { appId: string; chainId: number } | null): number {
  if (!cursor || jobs.length === 0) return 0;
  const idx = jobs.findIndex((j) => j.appId === cursor.appId && j.chainId === cursor.chainId);
  if (idx < 0) return 0;
  return (idx + 1) % jobs.length;
}

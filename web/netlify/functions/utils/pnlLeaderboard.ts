import { SEER_APP_ALL_ID, type SeerAppFilterId, listSeerApps } from "@/lib/apps";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import type { SupportedChain } from "@seer-pm/sdk";
import { DEFAULT_COLLATERAL_PROFILE, getCollateralProfileByName } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Address } from "viem";
import { getDexScreenerPriceUSD } from "./common";
import { searchAllMarkets } from "./markets";
import { PORTFOLIO_PL_PERIODS, computePortfolioPlAllPeriods } from "./portfolioPlCompute";
import type { Database, TablesInsert } from "./supabase";

/** Max candidate wallets (by recent tx count) considered per app×chain refresh. */
export const PNL_LEADERBOARD_WALLET_CAP = 500;
/** Serialize wallets so Envio pacing (~200/min) is not burst by parallel computes. */
export const PNL_LEADERBOARD_CONCURRENCY = 1;
/** Max wallets to compute/upsert per app×chain job in one background run. */
export const PNL_LEADERBOARD_BATCH_SIZE = 100;
/** Only wallets with analytics activity in this UTC window are refresh candidates. */
export const PNL_LEADERBOARD_RECENT_DAYS = 5;
/** Stay under Netlify's ~15m background limit. */
export const PNL_LEADERBOARD_REFRESH_BUDGET_MS = 13 * 60 * 1000;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const DAY_SECONDS = 86_400;

export type LeaderboardCandidate = {
  address: string;
  uniqueTxCount: number;
};

export type RefreshJob = {
  appId: SeerAppFilterId;
  chainId: number;
  /** `undefined` = protocol-wide (no market allowlist). */
  marketIds: Address[] | undefined;
};

type PnlLeaderboardInsert = TablesInsert<"pnl_leaderboard">;

/** Capital dust in USD below which ROI is undefined. */
const ROI_CAPITAL_DUST_USD = 0.01;

/**
 * ROI in USD space.
 *
 *   roi = pnl_usd / (value_start_usd + buys_usd)
 *
 * where buys (primary as tokenIn) is recovered from stored swap aggregates:
 *   volume = primary_in + primary_out
 *   trading_collateral_net_out = primary_in - primary_out
 *   ⇒ buys = (volume + trading_collateral_net_out) / 2
 *
 * We use buys — not max(net_out, 0) — so round-trip / net-seller wallets with large
 * PnL and volume still get a defined ROI (net ≤ 0 would otherwise make capital 0).
 * Returns null when capital_usd < $0.01 (avoids ÷0 / “infinite” ROI); typical when
 * there is no starting value and no buys (e.g. only sold transferred tokens).
 */
function computeRoiUsd(args: {
  pnlUsd: number;
  valueStart: number;
  volume: number;
  tradingCollateralNetOut: number;
  collateralPriceUsd: number;
}): number | null {
  const { pnlUsd, valueStart, volume, tradingCollateralNetOut, collateralPriceUsd } = args;
  const price = Number(collateralPriceUsd) || 0;
  const buys = ((Number(volume) || 0) + (Number(tradingCollateralNetOut) || 0)) / 2;
  const capitalUsd = (Number(valueStart) || 0) * price + Math.max(buys, 0) * price;
  if (capitalUsd < ROI_CAPITAL_DUST_USD) return null;
  return pnlUsd / capitalUsd;
}

/** UTC midnight of the first day included in the recent-activity window. */
export function recentActivityCutoffDay(
  nowSec = Math.floor(Date.now() / 1000),
  recentDays = PNL_LEADERBOARD_RECENT_DAYS,
): number {
  const todayMidnight = Math.floor(nowSec / DAY_SECONDS) * DAY_SECONDS;
  return todayMidnight - recentDays * DAY_SECONDS;
}

function rankCandidatesByTxCount(byAddress: Map<string, number>, limit: number): LeaderboardCandidate[] {
  return [...byAddress.entries()]
    .map(([address, uniqueTxCount]) => ({ address, uniqueTxCount }))
    .sort((a, b) => b.uniqueTxCount - a.uniqueTxCount || a.address.localeCompare(b.address))
    .slice(0, limit);
}

/**
 * Candidate wallets with activity in the last `PNL_LEADERBOARD_RECENT_DAYS` UTC days.
 * When `marketIds` is omitted, ranks activity across the whole chain (All / protocol-wide).
 */
export async function listLeaderboardCandidates(
  supabase: SupabaseClient<Database>,
  chainId: number,
  marketIds: Address[] | undefined,
  limit = PNL_LEADERBOARD_WALLET_CAP,
): Promise<LeaderboardCandidate[]> {
  const cutoffDay = recentActivityCutoffDay();

  if (marketIds === undefined) {
    return listCandidatesFromWalletAnalytics(supabase, chainId, cutoffDay, limit);
  }
  if (marketIds.length === 0) return [];

  return listCandidatesFromAnalytics(supabase, chainId, marketIds, cutoffDay, limit);
}

async function listCandidatesFromWalletAnalytics(
  supabase: SupabaseClient<Database>,
  chainId: number,
  cutoffDay: number,
  limit: number,
): Promise<LeaderboardCandidate[]> {
  const { data, error } = await supabase
    .from("analytics_daily_wallet")
    .select("address, unique_tx_count")
    .eq("chain_id", chainId)
    .gte("day", cutoffDay)
    .limit(50_000);

  if (error) {
    throw new Error(`pnl-leaderboard: analytics_daily_wallet unavailable: ${error.message}`);
  }

  const byAddress = new Map<string, number>();
  for (const row of data ?? []) {
    const address = (row.address ?? "").toLowerCase();
    if (!address || address === ZERO_ADDRESS) continue;
    byAddress.set(address, (byAddress.get(address) ?? 0) + Number(row.unique_tx_count ?? 0));
  }

  return rankCandidatesByTxCount(byAddress, limit);
}

async function listCandidatesFromAnalytics(
  supabase: SupabaseClient<Database>,
  chainId: number,
  marketIds: Address[],
  cutoffDay: number,
  limit: number,
): Promise<LeaderboardCandidate[]> {
  const marketIdLcs = marketIds.map((id) => id.toLowerCase());
  const { data, error } = await supabase
    .from("analytics_daily_wallet_market")
    .select("address, unique_tx_count")
    .eq("chain_id", chainId)
    .in("market_id", marketIdLcs)
    .gte("day", cutoffDay)
    .limit(50_000);

  if (error) {
    throw new Error(`pnl-leaderboard: analytics_daily_wallet_market unavailable: ${error.message}`);
  }

  const byAddress = new Map<string, number>();
  for (const row of data ?? []) {
    const address = (row.address ?? "").toLowerCase();
    if (!address || address === ZERO_ADDRESS) continue;
    byAddress.set(address, (byAddress.get(address) ?? 0) + Number(row.unique_tx_count ?? 0));
  }

  return rankCandidatesByTxCount(byAddress, limit);
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

/**
 * Prefer wallets missing from `pnl_leaderboard`, then those with the oldest `updated_at`
 * (period=`all` is the representative row — all periods upsert together).
 * Ties keep candidate order (stable sort); the next run breaks ties via updated_at.
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

  // Supabase `.in()` can blow past URL limits; page in chunks.
  const IN_CHUNK = 200;
  for (let offset = 0; offset < addresses.length; offset += IN_CHUNK) {
    const chunk = addresses.slice(offset, offset + IN_CHUNK);
    const { data, error } = await supabase
      .from("pnl_leaderboard")
      .select("address, updated_at")
      .eq("app_id", appId)
      .eq("chain_id", chainId)
      .eq("period", "all")
      .in("address", chunk);

    if (error) {
      console.warn("pnl-leaderboard: stale batch lookup failed", error.message);
      // Fall back to first N candidates so refresh still progresses.
      return candidates.slice(0, batchSize);
    }
    for (const row of data ?? []) {
      const address = (row.address ?? "").toLowerCase();
      if (address && row.updated_at) {
        updatedAtByAddress.set(address, row.updated_at);
      }
    }
  }

  const ranked = [...candidates].sort((a, b) => {
    const aAt = updatedAtByAddress.get(a.address.toLowerCase());
    const bAt = updatedAtByAddress.get(b.address.toLowerCase());
    if (!aAt && !bAt) return 0;
    if (!aAt) return -1;
    if (!bAt) return 1;
    if (aAt !== bAt) return aAt < bAt ? -1 : 1;
    return 0;
  });

  return ranked.slice(0, batchSize);
}

export type RefreshAppChainResult = {
  appId: string;
  chainId: number;
  candidates: number;
  /** Wallets selected for this run (stale/missing batch). */
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
};

/**
 * App allowlists often list parent session markets; trading activity lives on conditionals.
 * Expand to parents ∪ children (`parentMarket` = each root id).
 */
export async function expandMarketIdsWithChildren(chainId: number, marketIds: Address[]): Promise<Address[]> {
  const roots = [...new Set(marketIds.map((id) => id.toLowerCase() as Address))];
  if (roots.length === 0) return [];

  const expanded = new Set<Address>(roots);
  for (const parent of roots) {
    const { markets } = await searchAllMarkets({
      chainIds: [chainId as SupportedChain],
      parentMarket: parent,
    });
    for (const market of markets) {
      expanded.add(market.id.toLowerCase() as Address);
    }
  }
  return [...expanded];
}

export async function refreshPnlLeaderboardForAppChain(
  supabase: SupabaseClient<Database>,
  appId: string,
  chainId: number,
  marketIds: Address[] | undefined,
  opts?: {
    walletCap?: number;
    concurrency?: number;
    batchSize?: number;
    /** Absolute deadline (Date.now() ms). When exceeded, stop claiming new wallets. */
    deadlineMs?: number;
  },
): Promise<RefreshAppChainResult> {
  const walletCap = opts?.walletCap ?? PNL_LEADERBOARD_WALLET_CAP;
  const concurrency = opts?.concurrency ?? PNL_LEADERBOARD_CONCURRENCY;
  const batchSize = opts?.batchSize ?? PNL_LEADERBOARD_BATCH_SIZE;
  const shouldAbort = opts?.deadlineMs != null ? () => Date.now() >= opts.deadlineMs! : undefined;
  const supportedChain = chainId as SupportedChain;
  const isGlobal = marketIds === undefined;
  const scopedMarketIds = marketIds === undefined ? undefined : await expandMarketIdsWithChildren(chainId, marketIds);

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
    };
  }

  const candidates = await listLeaderboardCandidates(supabase, chainId, scopedMarketIds, walletCap);
  const batch = await selectStaleLeaderboardBatch(supabase, appId, chainId, candidates, batchSize);
  const skippedStale = Math.max(0, candidates.length - batch.length);

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
  const endTime = Math.floor(Date.now() / 1000);

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
        });
        if (!computed) {
          failures += 1;
          return;
        }

        const rows: PnlLeaderboardInsert[] = PORTFOLIO_PL_PERIODS.map((period) => {
          const snap = computed.byPeriod[period];
          const pnl = Number(snap.pnl) || 0;
          const pnlUsd = pnl * collateralPriceUsd;
          const valueStart = Number(snap.valueStart) || 0;
          const tradingCollateralNetOut = Number(snap.tradingCollateralNetOut) || 0;
          const volume = Number(snap.volume) || 0;
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
            volume,
            volume_usd: volume * collateralPriceUsd,
            roi: computeRoiUsd({
              pnlUsd,
              valueStart,
              volume,
              tradingCollateralNetOut,
              collateralPriceUsd,
            }),
            market_count: Number(snap.marketCount) || 0,
            updated_at: new Date().toISOString(),
          };
        });

        const { error } = await supabase.from("pnl_leaderboard").upsert(rows, {
          onConflict: "app_id,chain_id,address,period",
        });
        if (error) {
          console.error("pnl-leaderboard upsert failed", candidate.address, error.message);
          failures += 1;
          return;
        }
        upserted += 1;
      } catch (e) {
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
    processed: batch.length,
    skippedStale,
    upserted,
    failures,
    abortedByBudget,
    collateralPriceUsd,
    scope: isGlobal ? "global" : "markets",
    marketCount: scopedMarketIds?.length,
  };
}

/**
 * Jobs: each configured app × chain (allowlisted root markets; children expanded at refresh),
 * plus protocol-wide `all` × every supported chain (includes markets that belong to no app).
 */
export function listPnlLeaderboardRefreshJobs(): RefreshJob[] {
  const jobs: RefreshJob[] = [];

  for (const app of listSeerApps()) {
    for (const [chainIdKey, marketIds] of Object.entries(app.markets)) {
      if (!marketIds || marketIds.length === 0) continue;
      jobs.push({
        appId: app.id,
        chainId: Number(chainIdKey),
        marketIds: marketIds.map((id) => id.toLowerCase() as Address),
      });
    }
  }

  for (const chain of Object.values(SUPPORTED_CHAINS)) {
    jobs.push({ appId: SEER_APP_ALL_ID, chainId: chain.id, marketIds: undefined });
  }

  return jobs;
}

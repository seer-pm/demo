import { SUPPORTED_CHAINS } from "@/lib/chains";
import type { SupportedChain } from "@seer-pm/sdk";
import { DEFAULT_COLLATERAL_PROFILE, getCollateralProfileByName } from "@seer-pm/sdk";
import { createClient } from "@supabase/supabase-js";
import type { Address } from "viem";
import { requireBackgroundSecret } from "./utils/backgroundAuth";
import { listLeaderboardCandidates } from "./utils/pnlLeaderboard";
import { type WalletComparison, compareWallet, summarize } from "./utils/pnlMarketShadowCompare";
import { computePortfolioPlAllPeriods } from "./utils/portfolioPlCompute";
import type { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

/** Wallets sampled per chain. Each costs a full compute, so keep this well inside the budget. */
const DEFAULT_SAMPLE_SIZE = 40;
/** Stay under Netlify's ~15m background limit. */
const COMPARE_BUDGET_MS = 13 * 60 * 1000;

/**
 * Shadow comparison for per-market P/L.
 *
 * **Writes no P/L data** — no `pnl_leaderboard` row is created or touched, so a read-only Supabase
 * key is enough. The one write anywhere in the path is the CoW swap cache in Netlify Blobs, which
 * the compute populates for any wallet it looks at.
 *
 * Runs both computations for the same wallet in one invocation — `withMarketBreakdown` reuses the
 * data the scalar path already fetched — and reports, per field, how far `Σ per-market` is from
 * today's number.
 *
 * The output that matters is `unexplained`: wallets whose difference is NOT accounted for by the
 * two intended changes (router term sourced from `ConditionalEvent` instead of transfer balances,
 * and gross splits entering `capital_deployed`). A non-zero residual means the market fold lost or
 * duplicated something — a market missing from the union, a fanned-out leg, an unmapped swap — and
 * must be understood before anything is materialized.
 *
 * Query params: `?chainId=100` to restrict, `?sample=N` for the per-chain sample size, and
 * `?recentOnly=1` to sample only wallets active in the refresh window (default: the whole analytics
 * history — correctness is not a per-chain freshness question, and chains outside the 5-day window
 * would otherwise yield no sample at all).
 */
export default async (req: Request) => {
  const unauthorized = requireBackgroundSecret(req);
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const chainIdParam = url.searchParams.get("chainId");
  const sampleSize = Number(url.searchParams.get("sample")) || DEFAULT_SAMPLE_SIZE;
  const recentOnly = url.searchParams.get("recentOnly") === "1";
  // `?accounts=0x..,0x..` compares exactly these wallets instead of sampling. A stride sample only
  // covers what is typical; components that are rare in the population (LP mints/burns) need to be
  // aimed at deliberately or they go unverified while the summary still reads clean.
  const explicitAccounts = (url.searchParams.get("accounts") ?? "")
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter((a) => /^0x[0-9a-f]{40}$/.test(a));
  const chains = Object.values(SUPPORTED_CHAINS)
    .map((c) => c.id as number)
    .filter((id) => (chainIdParam ? id === Number(chainIdParam) : true));

  const startedAt = Date.now();
  const deadlineMs = startedAt + COMPARE_BUDGET_MS;
  const endTime = Math.floor(Date.now() / 1000);
  const comparisons: WalletComparison[] = [];
  const failures: Array<{ account: string; chainId: number; error: string }> = [];
  let abortedByBudget = false;

  for (const chainId of chains) {
    if (Date.now() >= deadlineMs) {
      abortedByBudget = true;
      break;
    }

    const supportedChain = chainId as SupportedChain;
    const profile = getCollateralProfileByName(supportedChain, DEFAULT_COLLATERAL_PROFILE);
    const all = explicitAccounts.length
      ? explicitAccounts
      : (
          await listLeaderboardCandidates(supabase, chainId, undefined, {
            cutoffDay: recentOnly ? undefined : 0,
          })
        )
          .map((c) => c.address)
          .sort();
    // Deterministic stride rather than the first N: addresses sort lexicographically, so a head
    // slice is an arbitrary corner of the space and skewed hard toward dormant wallets — a sample
    // where every scalar is 0 reads exactly like a perfect comparison. A stride is still
    // reproducible (a residual appearing between runs is a real change, not a different draw)
    // while actually spanning the population.
    const stride = explicitAccounts.length ? 1 : Math.max(1, Math.floor(all.length / sampleSize));
    const candidates = explicitAccounts.length ? all : all.filter((_, i) => i % stride === 0).slice(0, sampleSize);

    console.log(`compare-pnl-market: chain=${chainId} sampling ${candidates.length} wallet(s)`);

    for (const account of candidates) {
      if (Date.now() >= deadlineMs) {
        abortedByBudget = true;
        break;
      }
      try {
        const computed = await computePortfolioPlAllPeriods({
          supabase,
          account: account as Address,
          chainId: supportedChain,
          chainIdNum: chainId,
          endTime,
          // Global scope: this is the `app_id = all` path the leaderboard materializes.
          marketIds: undefined,
          collateralProfile: DEFAULT_COLLATERAL_PROFILE,
          primaryCollateral: profile.primary,
          withMarketBreakdown: true,
        });
        if (!computed?.byMarketPeriod) {
          failures.push({ account, chainId, error: "no breakdown returned" });
          continue;
        }
        comparisons.push(compareWallet(account, chainId, computed.byMarketPeriod, computed.byPeriod));
      } catch (e) {
        // A wallet that throws is a finding too (DEX page cap, price outage), not a reason to stop.
        failures.push({ account, chainId, error: e instanceof Error ? e.message : String(e) });
      }
    }
  }

  // Targeted mode is for diagnosis, so print the per-period detail rather than only the summary:
  // a rolled-up count cannot tell you which side of a difference is wrong.
  if (explicitAccounts.length > 0) {
    console.log("compare-pnl-market: detalle", JSON.stringify(comparisons, null, 2));
  }

  const summary = summarize(comparisons);
  console.log(
    "compare-pnl-market: finished",
    JSON.stringify(
      {
        elapsedMs: Date.now() - startedAt,
        abortedByBudget,
        failures: failures.length,
        ...summary,
      },
      null,
      2,
    ),
  );
  if (failures.length > 0) {
    console.error("compare-pnl-market: wallets that failed to compute", JSON.stringify(failures.slice(0, 20), null, 2));
  }

  return new Response(JSON.stringify({ ...summary, failures: failures.length, abortedByBudget }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
};

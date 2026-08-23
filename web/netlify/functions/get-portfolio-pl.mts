import { SEER_APP_ALL_ID } from "@/lib/apps";
import type { SupportedChain } from "@seer-pm/sdk";
import { createClient } from "@supabase/supabase-js";
import { type Address, isAddress } from "viem";
import { parseChainIdQueryParam } from "./utils/parseChainIdParam";
import {
  type PortfolioPlPeriod,
  type PortfolioPlPeriodSnapshot,
  computePortfolioPlAllPeriods,
} from "./utils/portfolioPlCompute";
import { parseCollateralProfileQueryParam } from "./utils/resolveCollateralParam";
import { eodStartTimesForPeriods } from "./utils/seerIndexerPortfolio";
import type { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

/**
 * Portfolio P/L (period) — how this endpoint works
 *
 * Paths
 * - **Global** (no `marketId` / `marketIds`): read materialized rows from Supabase
 *   `pnl_leaderboard` (`app_id = all`). No live compute. Miss → zeros.
 *   Same numbers as the scheduled refresh job (`refresh-pnl-leaderboard-background` /
 *   `scheduled-refresh-pnl-leaderboard`), which calls `computePortfolioPlAllPeriods` for
 *   candidate wallets (analytics activity window, Netlify time budget) under the
 *   **default** collateral profile and upserts four period rows per wallet×chain.
 *   Compute is **Generic markets only** (Futarchy excluded).
 * - **Market-scoped** (`marketId` or comma-separated `marketIds`): live
 *   `computePortfolioPlAllPeriods` (see that module for valuation, periods, formula, limits).
 *   Futarchy ids → 404. Compute outages (RPC / DEX / subgraph) → 200 with zeros so the
 *   frontend does not break; the leaderboard job still skips the upsert.
 *
 * Global response shape
 * - USD from materialization: `pnl` is `pnl_usd`; `valueStart` / `valueEnd` / net-out / `volume` /
 *   `capitalDeployed` are native fields × `collateral_price_usd` (or `volume_usd`). `unit` is `"USD"`.
 * - `chainId=all` sums those USD fields across chains for the wallet.
 * - `endTime` / `startTime` (for 1d, 1w, 1m) are derived from the row's `updated_at`, not request-time now.
 * - `updatedAt` is that snapshot timestamp. `period=all` keeps `startTime` null.
 * - May be stale until the next successful refresh; wallets never selected as candidates
 *   (no analytics activity in the window, or still waiting on the stale/missing rotation)
 *   stay at zeros.
 *
 * `debug=1` (market-scoped only): attaches a `debug` object for the requested `period`
 * (formula breakdown + swap sample rows). Ignored on the global path.
 */

type Period = PortfolioPlPeriod;

type LeaderboardUsdRow = {
  pnl_usd: number;
  value_start: number;
  value_end: number;
  trading_collateral_net_out: number;
  lp_collateral_net_out: number;
  volume_usd: number;
  capital_deployed: number;
  collateral_price_usd: number;
  market_count: number;
  updated_at: string;
};

function usdFromLeaderboardRow(row: LeaderboardUsdRow) {
  const price = Number(row.collateral_price_usd) || 0;
  return {
    pnl: Number(row.pnl_usd) || 0,
    valueStart: (Number(row.value_start) || 0) * price,
    valueEnd: (Number(row.value_end) || 0) * price,
    tradingCollateralNetOut: (Number(row.trading_collateral_net_out) || 0) * price,
    lpCollateralNetOut: (Number(row.lp_collateral_net_out) || 0) * price,
    volume: Number(row.volume_usd) || 0,
    capitalDeployed: (Number(row.capital_deployed) || 0) * price,
    marketCount: Number(row.market_count) || 0,
  };
}

/** Global P/L from `pnl_leaderboard` (`app_id = all`), in USD. Miss → zeros. */
async function portfolioPlFromLeaderboard(args: {
  account: Address;
  chainId: number | "all";
  period: Period;
  endTime: number;
}): Promise<PortfolioPlPeriodSnapshot> {
  const { account, chainId, period, endTime } = args;
  const accountLc = account.toLowerCase();

  const zeros = (windowEnd: number, startTime: number | null, updatedAt: string | null): PortfolioPlPeriodSnapshot => ({
    account: accountLc,
    chainId,
    period,
    startTime,
    endTime: windowEnd,
    valueStart: 0,
    valueEnd: 0,
    tradingCollateralNetOut: 0,
    lpCollateralNetOut: 0,
    volume: 0,
    marketCount: 0,
    capitalDeployed: 0,
    pnl: 0,
    updatedAt,
    unit: "USD",
  });

  let query = supabase
    .from("pnl_leaderboard")
    .select(
      "pnl_usd, value_start, value_end, trading_collateral_net_out, lp_collateral_net_out, volume_usd, capital_deployed, collateral_price_usd, market_count, updated_at",
    )
    .eq("app_id", SEER_APP_ALL_ID)
    .eq("address", accountLc)
    .eq("period", period);

  if (chainId !== "all") {
    query = query.eq("chain_id", chainId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`portfolio-pl leaderboard read failed: ${error.message}`);
  }

  const rows = (data ?? []) as LeaderboardUsdRow[];
  if (rows.length === 0) {
    const startTime = period === "all" ? null : eodStartTimesForPeriods(endTime, null)[period];
    return zeros(endTime, startTime, null);
  }

  let latestUpdatedAt: string | null = null;
  let snapshotEnd = endTime;
  const summed = {
    pnl: 0,
    valueStart: 0,
    valueEnd: 0,
    tradingCollateralNetOut: 0,
    lpCollateralNetOut: 0,
    volume: 0,
    capitalDeployed: 0,
    marketCount: 0,
  };

  for (const row of rows) {
    const usd = usdFromLeaderboardRow(row);
    summed.pnl += usd.pnl;
    summed.valueStart += usd.valueStart;
    summed.valueEnd += usd.valueEnd;
    summed.tradingCollateralNetOut += usd.tradingCollateralNetOut;
    summed.lpCollateralNetOut += usd.lpCollateralNetOut;
    summed.volume += usd.volume;
    summed.capitalDeployed += usd.capitalDeployed;
    summed.marketCount += usd.marketCount;
    if (!latestUpdatedAt || row.updated_at > latestUpdatedAt) {
      latestUpdatedAt = row.updated_at;
      const parsed = Date.parse(row.updated_at);
      if (Number.isFinite(parsed)) {
        snapshotEnd = Math.floor(parsed / 1000);
      }
    }
  }

  const startTime = period === "all" ? null : eodStartTimesForPeriods(snapshotEnd, null)[period];

  return {
    account: accountLc,
    chainId,
    period,
    startTime,
    endTime: snapshotEnd,
    ...summed,
    updatedAt: latestUpdatedAt,
    unit: "USD",
  };
}

function parseMarketIds(url: URL): { marketIds?: Address[]; error?: string } {
  const multi = url.searchParams.get("marketIds");
  const single = url.searchParams.get("marketId");
  if (multi != null && single != null) {
    return { error: "provide marketId or marketIds, not both" };
  }
  if (multi) {
    const parts = multi
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0 || parts.some((p) => !isAddress(p))) {
      return { error: "marketIds must be a comma-separated list of valid addresses" };
    }
    return { marketIds: parts as Address[] };
  }
  if (single) {
    if (!isAddress(single)) {
      return { error: "marketId must be a valid address" };
    }
    return { marketIds: [single as Address] };
  }
  return {};
}

const jsonReplacer = (_: string, v: unknown) => (typeof v === "bigint" ? v.toString() : v);

function emptyPortfolioPlSnapshot(args: {
  account: Address;
  chainId: number | "all";
  period: Period;
  endTime: number;
  marketIds?: Address[];
}): PortfolioPlPeriodSnapshot {
  const startTime = args.period === "all" ? null : eodStartTimesForPeriods(args.endTime, null)[args.period];
  const marketScoped = !!args.marketIds?.length;
  return {
    account: args.account.toLowerCase(),
    chainId: args.chainId,
    period: args.period,
    ...(marketScoped ? { marketIds: args.marketIds!.map((id) => id.toLowerCase()) } : {}),
    startTime,
    endTime: args.endTime,
    valueStart: 0,
    valueEnd: 0,
    tradingCollateralNetOut: 0,
    lpCollateralNetOut: 0,
    volume: 0,
    marketCount: 0,
    capitalDeployed: 0,
    pnl: 0,
    ...(marketScoped ? {} : { updatedAt: null, unit: "USD" as const }),
  };
}

function jsonOk(body: unknown, cacheControl = "public, max-age=60") {
  return new Response(JSON.stringify(body, jsonReplacer), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cacheControl,
    },
  });
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const accountParam = url.searchParams.get("account");
  const chainId = url.searchParams.get("chainId");
  const period = (url.searchParams.get("period") ?? "1d").toLowerCase() as Period;
  const debug = url.searchParams.get("debug") === "1" || url.searchParams.get("debug") === "true";

  if (!accountParam || !isAddress(accountParam)) {
    return new Response(JSON.stringify({ error: "Account parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const account = accountParam as Address;
  if (!["1d", "1w", "1m", "all"].includes(period)) {
    return new Response(JSON.stringify({ error: "period must be one of: 1d, 1w, 1m, all" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const chainParsed = parseChainIdQueryParam(chainId, { allowAll: true });
  if ("error" in chainParsed) {
    return new Response(JSON.stringify({ error: chainParsed.error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const marketsParsed = parseMarketIds(url);
  if (marketsParsed.error) {
    return new Response(JSON.stringify({ error: marketsParsed.error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const marketIds = marketsParsed.marketIds;
  const endTime = Math.floor(Date.now() / 1000);

  const zeros = () =>
    emptyPortfolioPlSnapshot({
      account,
      chainId: chainParsed.chainId,
      period,
      endTime,
      marketIds,
    });

  try {
    // Global: materialized leaderboard only (no live compute). USD.
    if (!marketIds?.length) {
      return jsonOk(
        await portfolioPlFromLeaderboard({
          account,
          chainId: chainParsed.chainId,
          period,
          endTime,
        }),
      );
    }

    if (chainParsed.chainId === "all") {
      return new Response(JSON.stringify({ error: "chainId=all is not supported with marketId / marketIds" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const chainIdNum = chainParsed.chainId;
    const supportedChain = chainIdNum as SupportedChain;

    // Market-scoped: live compute.
    const collateralResolved = parseCollateralProfileQueryParam(
      supportedChain,
      url.searchParams.get("collateralProfile"),
    );
    if ("error" in collateralResolved) {
      return new Response(JSON.stringify({ error: collateralResolved.error }), {
        status: collateralResolved.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { profileName, primaryCollateral } = collateralResolved;

    const computed = await computePortfolioPlAllPeriods({
      supabase,
      account,
      chainId: supportedChain,
      chainIdNum,
      endTime,
      marketIds,
      collateralProfile: profileName,
      primaryCollateral,
      debugPeriod: debug ? period : undefined,
    });
    if (!computed) {
      return new Response(JSON.stringify({ error: `Market(s) not found: ${marketIds.join(",")}` }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const snapshot = computed.byPeriod[period] ?? zeros();
    const body: Record<string, unknown> = { ...snapshot };
    if (debug && computed.debugPayload) {
      body.debug = computed.debugPayload;
    }

    return jsonOk(body);
  } catch (e) {
    // Fail-closed compute throws so the leaderboard does not upsert; this endpoint is for the
    // frontend, so return zeros instead of 500. Do not cache — the next request should retry.
    console.error("get-portfolio-pl: returning zeros after failure", e);
    return jsonOk(zeros(), "no-store");
  }
};

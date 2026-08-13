import { SEER_APP_ALL_ID } from "@/lib/apps";
import type { SupportedChain } from "@seer-pm/sdk";
import { createClient } from "@supabase/supabase-js";
import { type Address, isAddress } from "viem";
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
 *   Futarchy ids → 404.
 *
 * Global response shape
 * - Snapshot fields from the table: `pnl`, `valueStart`, `valueEnd`, `tradingCollateralNetOut`,
 *   `volume`, `marketCount`, plus request `account` / `chainId` / `period`.
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

/** Global P/L from `pnl_leaderboard` (`app_id = all`). Miss → zeros. */
async function portfolioPlFromLeaderboard(args: {
  account: Address;
  chainId: number;
  period: Period;
  endTime: number;
}): Promise<PortfolioPlPeriodSnapshot> {
  const { account, chainId, period, endTime } = args;
  const accountLc = account.toLowerCase();

  const { data, error } = await supabase
    .from("pnl_leaderboard")
    .select(
      "pnl, value_start, value_end, trading_collateral_net_out, lp_collateral_net_out, volume, market_count, updated_at",
    )
    .eq("app_id", SEER_APP_ALL_ID)
    .eq("chain_id", chainId)
    .eq("address", accountLc)
    .eq("period", period)
    .maybeSingle();

  if (error) {
    throw new Error(`portfolio-pl leaderboard read failed: ${error.message}`);
  }

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
    pnl: 0,
    updatedAt,
  });

  if (!data) {
    const startTime = period === "all" ? null : eodStartTimesForPeriods(endTime, null)[period];
    return zeros(endTime, startTime, null);
  }

  const parsed = Date.parse(data.updated_at);
  const snapshotEnd = Number.isFinite(parsed) ? Math.floor(parsed / 1000) : endTime;
  const startTime = period === "all" ? null : eodStartTimesForPeriods(snapshotEnd, null)[period];

  return {
    account: accountLc,
    chainId,
    period,
    startTime,
    endTime: snapshotEnd,
    valueStart: Number(data.value_start) || 0,
    valueEnd: Number(data.value_end) || 0,
    tradingCollateralNetOut: Number(data.trading_collateral_net_out) || 0,
    lpCollateralNetOut: Number(data.lp_collateral_net_out) || 0,
    volume: Number(data.volume) || 0,
    marketCount: Number(data.market_count) || 0,
    pnl: Number(data.pnl) || 0,
    updatedAt: data.updated_at,
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

export default async (req: Request) => {
  try {
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
    if (!chainId) {
      return new Response(JSON.stringify({ error: "ChainId parameter is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!["1d", "1w", "1m", "all"].includes(period)) {
      return new Response(JSON.stringify({ error: "period must be one of: 1d, 1w, 1m, all" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const chainIdNum = Number(chainId);
    if (!Number.isInteger(chainIdNum)) {
      return new Response(JSON.stringify({ error: "chainId must be a valid number" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supportedChain = chainIdNum as SupportedChain;

    const marketsParsed = parseMarketIds(url);
    if (marketsParsed.error) {
      return new Response(JSON.stringify({ error: marketsParsed.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const marketIds = marketsParsed.marketIds;
    const endTime = Math.floor(Date.now() / 1000);

    // Global: materialized leaderboard only (no live compute).
    if (!marketIds?.length) {
      const snapshot = await portfolioPlFromLeaderboard({
        account,
        chainId: chainIdNum,
        period,
        endTime,
      });
      return new Response(JSON.stringify(snapshot, jsonReplacer), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

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

    const snapshot = computed.byPeriod[period];
    if (!snapshot) {
      return new Response(JSON.stringify({ error: "Unexpected: missing period in computed bundle" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: Record<string, unknown> = { ...snapshot };
    if (debug && computed.debugPayload) {
      body.debug = computed.debugPayload;
    }

    return new Response(JSON.stringify(body, jsonReplacer), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error)?.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

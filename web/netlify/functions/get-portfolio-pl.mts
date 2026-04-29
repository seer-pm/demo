import { getStore } from "@netlify/blobs";
import type { PortfolioPosition, SupportedChain } from "@seer-pm/sdk";
import type { Market } from "@seer-pm/sdk/market-types";
import { SUBGRAPHS } from "@seer-pm/sdk/subgraph";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { type Address, formatUnits, isAddress, isAddressEqual } from "viem";
import { buildHistoricPortfolioPositions } from "./utils/buildPortfolioPositions";
import { computeCollateralPortfolioValuesForPeriods } from "./utils/collateralPortfolioValue";
import { getHistoryTokensPricesForPortfolio } from "./utils/dexPoolPricesFromDb";
import { searchAllMarkets, searchMarkets } from "./utils/markets";
import {
  computeNetPrimaryCollateralSwapFlow,
  computeNetPrimaryCollateralSwapFlowForPeriods,
} from "./utils/netPrimaryCollateralSwapFlow";
import { sumPortfolioValueAtReference, sumPortfolioValueCurrent } from "./utils/portfolioValuation";
import type { Database } from "./utils/supabase";
import { getTokenDecimals } from "./utils/tokenDecimals";
import { listDistinctUserTransferTokensInWindow } from "./utils/transactions/listDistinctUserTransferTokensInWindow";
import { reconstructSplitMergeRedeemFromTransfersForMarket } from "./utils/transactions/reconstructSplitMergeRedeemFromTransfers";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

/**
 * Portfolio P/L (period) — how this endpoint works (important assumptions)
 *
 * What we value (`valueEnd` / `valueStart`)
 * - **Outcome-token positions** (same shape as `get-portfolio` / `get-portfolio-value`).
 * - **Protocol collateral (router legs)**: net ERC20 transfers in `tokens_transfers` between the user and Seer routers
 *   (`routerAddressMap` / `getRouterAddresses`) for the chain **primary** collateral token (`COLLATERAL_TOKENS.primary`, e.g. sDAI on Gnosis).
 *   **`GetConditionalEvents` is not used**: split/merge/redeem **always** go through `Router` / `GnosisRouter`, so subgraph conditional events attach to the router as `account`, not to the user; ERC20 transfers user↔router reflect the economic legs.
 *
 * Prices
 * - Current prices: DEX subgraphs (Swapr on Gnosis, Uniswap on mainnet/OP stack) via `dexPoolPricesFromDb`.
 * - Historical prices at `startTime`: latest `poolHourData` snapshot at/before `startTime` (same approach as the old client hook).
 * - `redeemedPrice` rules follow `portfolioValuation.ts` (mirrors the UI hook semantics).
 *
 * Period window (`startTime` / `endTime`)
 * - `endTime` is “now” (unix seconds).
 * - For `1d/1w/1m`: `startTime = endTime - seconds(period)`.
 * - For `all`: `startTime` is the **earliest indexed transfer** for the account in Supabase `tokens_transfers` for the chain.
 *   This is a performance + definition choice: scanning from `0`/a fixed genesis would be too expensive and arbitrary.
 *
 * Positions at `startTime` (for `valueStart`)
 * - We start from **current** positions (`buildHistoricPortfolioPositions`: union of `wrappedTokens` from markets loaded via distinct transfers + `searchAllMarkets`, balances from `tokens_holdings_v`)
 *   and **roll back balances** using `tokens_transfers` between `(startTime, endTime]` for the outcome tokens in that portfolio
 *   (includes zero-balance rows from Supabase for redeemed winners).
 * - This is an approximation: it assumes `tokens_transfers` is complete for those tokens over the window.
 *
 * P/L formula
 * - `deltaV = valueEnd − valueStart`: outcome-token MTM plus net router–user ERC20 collateral legs (cumulative to `endTime` vs `startTime`).
 * - `tradingCollateralNetOut`: net **primary collateral** spent on outcome swaps in `(startTime, endTime]` (DEX subgraph + CoW fills), i.e.
 *   primary spent as `tokenIn` minus primary received as `tokenOut`. Same semantics as `/get-transactions` swap rows.
 * - **`pnl = deltaV − tradingCollateralNetOut`**: treats swap legs as cash so buying outcome with 10 sDAI does not masquerade as +10 MTM profit.
 *
 * Caching
 * - With `debug=0`, computes all four windows once, stores in Netlify Blobs (~2h TTL). Subsequent requests for any period read the cached bundle.
 * - With `debug=1`, cache read/write is skipped. The same `computeAllPeriods` path runs and attaches a `debug` object for the requested `period` (swap sample rows + breakdown); one extra `computeNetPrimaryCollateralSwapFlow` call collects up to 300 swap rows for that window.
 *
 * Limits (documented)
 * - P2P ERC20 transfers of outcome tokens would affect MTM rollback via `tokens_transfers` but are excluded from swap cashflow — assumed rare.
 * - Swaps routed only through venues indexed in `getSwapEvents` (pool subgraph + CoW owner trades).
 */

type Period = "1d" | "1w" | "1m" | "all";

const PERIODS: Period[] = ["1d", "1w", "1m", "all"];

const PORTFOLIO_PL_CACHE_STORE = "portfolio-pl-by-period";
const PORTFOLIO_PL_CACHE_MS = 2 * 60 * 60 * 1000;

type PortfolioPlCachePayload = {
  cachedAt: number;
  chainId: number;
  account: string;
  marketId?: string;
  endTime: number;
  startTimeByPeriod: Record<Period, number>;
  byPeriod: Record<Period, Record<string, unknown>>;
};

function getPortfolioPlCacheStore() {
  return getStore({
    name: PORTFOLIO_PL_CACHE_STORE,
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN,
  });
}

async function readCachedPortfolioPl(
  key: string,
  opts?: { bypassCache?: boolean },
): Promise<PortfolioPlCachePayload | null> {
  if (opts?.bypassCache) {
    return null;
  }
  try {
    const store = getPortfolioPlCacheStore();
    const cached = (await store.get(key, { type: "json" })) as PortfolioPlCachePayload | null;
    if (!cached || typeof cached.cachedAt !== "number" || !cached.byPeriod) return null;
    return cached;
  } catch (e) {
    console.warn("readCachedPortfolioPl", e);
    return null;
  }
}

async function writeCachedPortfolioPl(key: string, payload: PortfolioPlCachePayload): Promise<void> {
  try {
    const store = getPortfolioPlCacheStore();
    await store.setJSON(key, payload);
  } catch (e) {
    console.error("writeCachedPortfolioPl", e);
  }
}

/** Single query over `(minStart, endTime]`, bucket net deltas per period. */
async function computePositionsAtStartFromTransfersMulti(
  supabase: SupabaseClient<Database>,
  positionsNow: PortfolioPosition[],
  account: Address,
  chainId: SupportedChain,
  startTimeByPeriod: Record<Period, number>,
  endTime: number,
): Promise<Record<Period, PortfolioPosition[]>> {
  const empty: Record<Period, PortfolioPosition[]> = { "1d": [], "1w": [], "1m": [], all: [] };
  if (positionsNow.length === 0) return empty;

  const tokenIds = Array.from(new Set(positionsNow.map((p) => p.tokenId.toLowerCase()))) as Address[];
  const decimalsByToken = getTokenDecimals(chainId, tokenIds);
  const minStart = Math.min(...PERIODS.map((p) => startTimeByPeriod[p]));

  const { data, error } = await supabase
    .from("tokens_transfers")
    .select("token,from,to,value::text,timestamp")
    .eq("chain_id", chainId)
    .in("token", tokenIds)
    .gt("timestamp", minStart)
    .lte("timestamp", endTime)
    .or(`from.eq.${account.toLowerCase()},to.eq.${account.toLowerCase()}`);

  if (error) {
    throw new Error(`Error fetching tokens_transfers: ${error.message}`);
  }

  const deltaWeiByPeriodToken: Record<Period, Record<string, bigint>> = {
    "1d": {},
    "1w": {},
    "1m": {},
    all: {},
  };

  for (const row of data ?? []) {
    const token = (row.token as string | null)?.toLowerCase();
    if (!token) continue;
    const valueWei = BigInt(row.value);
    const ts = Number(row.timestamp);

    let signedDelta = 0n;
    if (isAddressEqual(row.to as Address, account)) {
      signedDelta = valueWei;
    } else if (isAddressEqual(row.from as Address, account)) {
      signedDelta = -valueWei;
    } else {
      continue;
    }

    for (const p of PERIODS) {
      if (ts > startTimeByPeriod[p]) {
        const m = deltaWeiByPeriodToken[p];
        m[token] = (m[token] ?? 0n) + signedDelta;
      }
    }
  }

  const out: Record<Period, PortfolioPosition[]> = { "1d": [], "1w": [], "1m": [], all: [] };
  for (const p of PERIODS) {
    out[p] = positionsNow.map((pos) => {
      const deltaWei = deltaWeiByPeriodToken[p][pos.tokenId.toLowerCase()] ?? 0n;
      const rawNow = BigInt(pos.rawBalance);
      const startTime = startTimeByPeriod[p];
      if (rawNow < deltaWei) {
        console.warn(
          "get-portfolio-pl: current balance smaller than net transfers in window; clamping start balance to 0 (possible missing or late transfer data)",
          {
            tokenId: pos.tokenId,
            rawNow: rawNow.toString(),
            deltaWei: deltaWei.toString(),
            startTime,
            endTime,
            chainId,
            account: account.toLowerCase(),
            period: p,
          },
        );
      }
      const startWei = rawNow >= deltaWei ? rawNow - deltaWei : 0n;
      const decimals = decimalsByToken[pos.tokenId.toLowerCase()] ?? 18;
      const startBalance = Number(formatUnits(startWei, decimals));
      return { ...pos, tokenBalance: startBalance, rawBalance: startWei.toString() };
    });
  }
  return out;
}

function periodToSeconds(period: Period) {
  switch (period) {
    case "1d":
      return 60 * 60 * 24;
    case "1w":
      return 60 * 60 * 24 * 7;
    case "1m":
      return 60 * 60 * 24 * 30;
    case "all":
      return undefined;
  }
}

async function computeStartTime(
  supabase: SupabaseClient<Database>,
  period: Period,
  chainId: SupportedChain,
  account: Address,
  endTime: number,
) {
  const seconds = periodToSeconds(period);
  if (seconds) return endTime - seconds;

  // ALL: use earliest token transfer we have indexed for this account.
  // This is the most robust (it covers swap/lp/ctf as long as transfers are indexed) and is critical for performance:
  // using a fixed genesis (or 0) would make downstream queries over `tokens_transfers` scan an unbounded time range.
  const accountLc = account.toLowerCase();
  const { data, error } = await supabase
    .from("tokens_transfers")
    .select("timestamp")
    .eq("chain_id", chainId)
    .or(`from.eq.${accountLc},to.eq.${accountLc}`)
    .order("timestamp", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Error fetching earliest transfer timestamp: ${error.message}`);
  }

  const ts = Number(data?.timestamp);
  return Number.isFinite(ts) && ts > 0 ? ts : Math.floor(new Date("2024-01-01").getTime() / 1000);
}

function positionRowValueAtReference(
  p: PortfolioPosition,
  tokenIdToReferencePrice: Record<string, number | undefined>,
  referenceTimeSeconds: number,
): number {
  let tokenPrice = tokenIdToReferencePrice[p.tokenId.toLowerCase()] ?? p.tokenPrice;
  if (p.marketFinalizeTs < referenceTimeSeconds) {
    tokenPrice = p.redeemedPrice || tokenPrice;
  }
  return tokenPrice * p.tokenBalance;
}

/** Loads outcome markets and historic portfolio positions for P/L (global vs single-market). */
async function getMarketsAndPositions(
  supabase: SupabaseClient<Database>,
  account: Address,
  chainId: SupportedChain,
  endTime: number,
  marketId: Address | undefined,
): Promise<{ markets: Market[]; positions: PortfolioPosition[] } | null> {
  if (marketId) {
    const { markets: byId } = await searchMarkets({ chainIds: [chainId], id: marketId });
    const market = byId[0];
    if (!market) {
      return null;
    }
    const markets = [market];
    const positions = await buildHistoricPortfolioPositions(supabase, account, chainId, markets);
    return { markets, positions };
  }

  let markets: Market[] = [];
  const distinctTokenStrs = await listDistinctUserTransferTokensInWindow(supabase, chainId, account, 0, endTime);
  if (distinctTokenStrs.length > 0) {
    const { markets: loaded } = await searchAllMarkets({
      chainIds: [chainId],
      tokens: distinctTokenStrs as Address[],
    });
    markets = loaded;
  }
  const positions = await buildHistoricPortfolioPositions(supabase, account, chainId, markets);
  return { markets, positions };
}

async function computeAllPeriods(
  supabase: SupabaseClient<Database>,
  account: Address,
  chainId: SupportedChain,
  chainIdNum: number,
  endTime: number,
  marketId: Address | undefined,
  debugPeriod?: Period,
): Promise<{
  startTimeByPeriod: Record<Period, number>;
  byPeriod: Record<Period, Record<string, unknown>>;
  debugPayload?: Record<string, unknown>;
} | null> {
  const startTimeAll = await computeStartTime(supabase, "all", chainId, account, endTime);
  const startTimeByPeriod: Record<Period, number> = {
    "1d": endTime - 60 * 60 * 24,
    "1w": endTime - 60 * 60 * 24 * 7,
    "1m": endTime - 60 * 60 * 24 * 30,
    all: startTimeAll,
  };

  const marketsAndPositions = await getMarketsAndPositions(supabase, account, chainId, endTime, marketId);
  if (!marketsAndPositions) return null;

  const { markets, positions } = marketsAndPositions;
  const startTimes = PERIODS.map((p) => startTimeByPeriod[p]);

  const positionsAtStartByPeriod = await computePositionsAtStartFromTransfersMulti(
    supabase,
    positions,
    account,
    chainId,
    startTimeByPeriod,
    endTime,
  );

  const historyPricesByPeriod = await Promise.all(
    PERIODS.map((p) => getHistoryTokensPricesForPortfolio(supabase, positions, chainId, startTimeByPeriod[p])),
  );
  const historyPrices: Record<Period, Record<string, number | undefined>> = {
    "1d": historyPricesByPeriod[0],
    "1w": historyPricesByPeriod[1],
    "1m": historyPricesByPeriod[2],
    all: historyPricesByPeriod[3],
  };

  const swapNetByPeriod: Record<Period, number> = { "1d": 0, "1w": 0, "1m": 0, all: 0 };
  try {
    const flow = await computeNetPrimaryCollateralSwapFlowForPeriods(
      account,
      chainId,
      startTimes,
      endTime,
      markets,
      marketId,
      { limitRows: 0 },
    );
    for (const p of PERIODS) {
      swapNetByPeriod[p] = flow.netOutByStartTime.get(startTimeByPeriod[p]) ?? 0;
    }
  } catch (err) {
    console.error("get-portfolio-pl: failed to compute primary collateral swap net flow", err);
  }

  let reconstructedByPeriod:
    | Record<Period, { routerPrimaryCollateralNetInWindow: number; events: unknown[] }>
    | undefined;
  if (marketId) {
    const market = markets[0];
    const results = await Promise.all(
      PERIODS.map((p) =>
        reconstructSplitMergeRedeemFromTransfersForMarket({
          supabase,
          account,
          chainId,
          marketId,
          marketName: market.marketName,
          wrappedTokens: market.wrappedTokens as Address[],
          startTime: startTimeByPeriod[p],
          endTime,
        }),
      ),
    );
    reconstructedByPeriod = {} as Record<Period, { routerPrimaryCollateralNetInWindow: number; events: unknown[] }>;
    PERIODS.forEach((p, i) => {
      reconstructedByPeriod![p] = {
        routerPrimaryCollateralNetInWindow: results[i].routerPrimaryCollateralNetInWindow,
        events: results[i].events,
      };
    });
  }

  const collateral = marketId
    ? { valueEnd: 0, valueStartByStartTime: new Map<number, number>() }
    : await computeCollateralPortfolioValuesForPeriods(supabase, account, chainId, endTime, startTimes);

  const tokensEndOnly = sumPortfolioValueCurrent(positions);
  const valueEndGlobal = tokensEndOnly + collateral.valueEnd;

  const byPeriod: Record<Period, Record<string, unknown>> = {
    "1d": {},
    "1w": {},
    "1m": {},
    all: {},
  };

  for (const p of PERIODS) {
    const startTime = startTimeByPeriod[p];
    const positionsAtStart = positionsAtStartByPeriod[p];
    const hp = historyPrices[p];
    const tradingCollateralNetOut = swapNetByPeriod[p];

    const collateralValues = marketId
      ? { valueStart: 0, valueEnd: 0 }
      : {
          valueStart: collateral.valueStartByStartTime.get(startTime) ?? 0,
          valueEnd: collateral.valueEnd,
        };

    const valueEnd = marketId ? sumPortfolioValueCurrent(positions) : valueEndGlobal;
    const valueStart = sumPortfolioValueAtReference(positionsAtStart, hp, startTime) + collateralValues.valueStart;

    const deltaV = valueEnd - valueStart;
    const routerPrimaryCollateralNetInWindow = marketId
      ? reconstructedByPeriod![p].routerPrimaryCollateralNetInWindow
      : 0;
    const pnl = marketId
      ? deltaV + routerPrimaryCollateralNetInWindow - tradingCollateralNetOut
      : deltaV - tradingCollateralNetOut;

    byPeriod[p] = {
      account: account.toLowerCase(),
      chainId: chainIdNum,
      period: p,
      ...(marketId ? { marketId: marketId.toLowerCase(), marketName: markets[0].marketName } : {}),
      startTime,
      endTime,
      valueStart,
      valueEnd,
      tradingCollateralNetOut,
      ...(marketId
        ? {
            routerPrimaryCollateralNetInWindow,
            events: reconstructedByPeriod![p].events,
          }
        : {}),
      pnl,
    };
  }

  let debugPayload: Record<string, unknown> | undefined;
  if (debugPeriod) {
    const st = startTimeByPeriod[debugPeriod];
    const positionsAtStart = positionsAtStartByPeriod[debugPeriod];
    const hp = historyPrices[debugPeriod];
    const tradingCollateralNetOut = swapNetByPeriod[debugPeriod];

    const collateralValues = marketId
      ? { valueStart: 0, valueEnd: 0 }
      : {
          valueStart: collateral.valueStartByStartTime.get(st) ?? 0,
          valueEnd: collateral.valueEnd,
        };

    const valueEnd = marketId ? sumPortfolioValueCurrent(positions) : valueEndGlobal;
    const valueStart = sumPortfolioValueAtReference(positionsAtStart, hp, st) + collateralValues.valueStart;
    const deltaV = valueEnd - valueStart;
    const routerWin = marketId ? reconstructedByPeriod![debugPeriod].routerPrimaryCollateralNetInWindow : 0;
    const pnl = marketId ? deltaV + routerWin - tradingCollateralNetOut : deltaV - tradingCollateralNetOut;

    const tokensEndOnly = sumPortfolioValueCurrent(positions);
    const tokensStartOnly = sumPortfolioValueAtReference(positionsAtStart, hp, st);

    let swapFlowDebug: { primary: unknown; netOut: number; rowCount: number; rows: unknown[] } | undefined;
    try {
      const flow = await computeNetPrimaryCollateralSwapFlow(account, chainId, st, endTime, markets, marketId, {
        limitRows: 300,
      });
      swapFlowDebug = {
        primary: flow.primary,
        netOut: flow.netOut,
        rowCount: flow.rows.length,
        rows: flow.rows,
      };
    } catch (err) {
      console.error("get-portfolio-pl: failed to compute primary collateral swap net flow (debug rows)", err);
    }

    const positionRows = positions.map((pos, i) => {
      const atStart = positionsAtStart[i];
      const vEnd = pos.tokenPrice * pos.tokenBalance;
      const vStart = positionRowValueAtReference(atStart, hp, st);
      let priceStartUsed = hp[pos.tokenId.toLowerCase()] ?? atStart.tokenPrice;
      if (atStart.marketFinalizeTs < st) {
        priceStartUsed = atStart.redeemedPrice || priceStartUsed;
      }
      return {
        tokenId: pos.tokenId,
        marketName: pos.marketName.slice(0, 80),
        endBalance: pos.tokenBalance,
        startBalance: atStart.tokenBalance,
        priceEnd: pos.tokenPrice,
        priceStartUsed,
        valueEnd: vEnd,
        valueStart: vStart,
        rowDelta: vEnd - vStart,
      };
    });
    positionRows.sort((a, b) => Math.abs(b.rowDelta) - Math.abs(a.rowDelta));

    debugPayload = {
      formula: "pnl = (valueEnd - valueStart) - tradingCollateralNetOut",
      windowSeconds: endTime - st,
      components: {
        tokensMTMEnd: tokensEndOnly,
        collateralCumulativeEnd: collateralValues.valueEnd,
        tokensMTMStart: tokensStartOnly,
        collateralCumulativeStart: collateralValues.valueStart,
        deltaTokensMTM: tokensEndOnly - tokensStartOnly,
        deltaCollateralCumulative: collateralValues.valueEnd - collateralValues.valueStart,
        deltaV,
        tradingCollateralNetOut,
        pnl,
      },
      primaryCollateralSwaps: swapFlowDebug ?? { error: "swap debug missing (unexpected)" },
      topPositionsByAbsRowDelta: positionRows.slice(0, 25),
      positionCount: positions.length,
    };
  }

  return { startTimeByPeriod, byPeriod, debugPayload };
}

const jsonReplacer = (_: string, v: unknown) => (typeof v === "bigint" ? v.toString() : v);

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const accountParam = url.searchParams.get("account");
    const chainId = url.searchParams.get("chainId");
    const period = (url.searchParams.get("period") ?? "1d").toLowerCase() as Period;
    const marketIdParam = url.searchParams.get("marketId");
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

    const supportedChains = Object.keys(SUBGRAPHS.tokens).map(Number);
    if (!supportedChains.includes(chainIdNum)) {
      return new Response(
        JSON.stringify({
          error: `Unsupported chain ID: ${chainIdNum}. Supported chains: ${supportedChains.join(", ")}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const supportedChain = chainIdNum as SupportedChain;

    const marketId = marketIdParam ? (isAddress(marketIdParam) ? (marketIdParam as Address) : null) : undefined;
    if (marketId === null) {
      return new Response(JSON.stringify({ error: "marketId must be a valid address" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const endTime = Math.floor(Date.now() / 1000);

    const cacheKey = `${chainIdNum}:${account.toLowerCase()}:${marketId ? marketId.toLowerCase() : "global"}`;
    const cached = await readCachedPortfolioPl(cacheKey, { bypassCache: debug });
    if (!debug && cached && Date.now() - cached.cachedAt < PORTFOLIO_PL_CACHE_MS && cached.byPeriod[period]) {
      return new Response(JSON.stringify(cached.byPeriod[period], jsonReplacer), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    const computed = await computeAllPeriods(
      supabase,
      account,
      supportedChain,
      chainIdNum,
      endTime,
      marketId,
      debug ? period : undefined,
    );
    if (!computed) {
      return new Response(JSON.stringify({ error: `Market not found: ${marketId}` }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!debug) {
      const payload: PortfolioPlCachePayload = {
        cachedAt: Date.now(),
        chainId: chainIdNum,
        account: account.toLowerCase(),
        ...(marketId ? { marketId: marketId.toLowerCase() } : {}),
        endTime,
        startTimeByPeriod: computed.startTimeByPeriod,
        byPeriod: computed.byPeriod,
      };
      await writeCachedPortfolioPl(cacheKey, payload);
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
    return new Response(JSON.stringify({ error: e?.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

import type { PortfolioPosition, SupportedChain, Token } from "@seer-pm/sdk";
import type { Market } from "@seer-pm/sdk/market-types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type Address, formatUnits } from "viem";
import { buildPortfolioPositionsFromBalances } from "./buildPortfolioPositions";
import { getHistoryTokensPricesForPortfolio } from "./dexPoolPricesFromDb";
import { computeLpPrimaryCollateralNetOutForPeriods } from "./lpPrimaryCollateralFlow";
import { searchAllMarkets } from "./markets";
import {
  computeNetPrimaryCollateralSwapFlow,
  computeNetPrimaryCollateralSwapFlowForPeriods,
} from "./netPrimaryCollateralSwapFlow";
import { sumPortfolioValueAtReference, sumPortfolioValueCurrent } from "./portfolioValuation";
import {
  PORTFOLIO_PL_PERIODS,
  type PortfolioPlPeriod,
  computeCollateralPortfolioValuesForPeriods,
  eodStartTimesForPeriods,
  fetchAccountActivity,
  fetchConditionalEventsForAccount,
  fetchMarketIdsFromAccountTransfers,
  fetchTokenBalances,
  fetchTokenBalancesAtEods,
  positionsWithBalances,
  routerPrimaryNetFromConditionalEvents,
} from "./seerIndexerPortfolio";
import type { Database } from "./supabase";

export type { PortfolioPlPeriod };
export { PORTFOLIO_PL_PERIODS };

export type PortfolioPlPeriodSnapshot = {
  account: string;
  chainId: number;
  period: PortfolioPlPeriod;
  marketIds?: string[];
  startTime: number;
  endTime: number;
  valueStart: number;
  valueEnd: number;
  tradingCollateralNetOut: number;
  /** Net primary into LP pools in the window (mints − burns). */
  lpCollateralNetOut: number;
  /** Gross primary-collateral notional of outcome swaps in the window (buy + sell). */
  volume: number;
  /** Distinct markets with counted primary-collateral swaps in the window. */
  marketCount: number;
  routerPrimaryCollateralNetInWindow?: number;
  events?: unknown[];
  pnl: number;
};

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

async function getMarketsAndPositions(
  supabase: SupabaseClient<Database>,
  account: Address,
  chainId: SupportedChain,
  marketIds: Address[] | undefined,
  collateralProfile: string,
  holdings: Map<string, bigint>,
  historicalMarketIds: Address[],
): Promise<{ markets: Market[]; positions: PortfolioPosition[] } | null> {
  if (marketIds?.length) {
    const { markets } = await searchAllMarkets({
      chainIds: [chainId],
      marketIds: marketIds.map((id) => id.toLowerCase()),
      collateralProfile,
    });
    if (markets.length === 0) return null;
    const relevantTokens = [
      ...new Set(markets.flatMap((m) => (m.wrappedTokens ?? []).map((w) => String(w).toLowerCase()))),
    ] as Address[];
    const positions = await buildPortfolioPositionsFromBalances(supabase, chainId, markets, relevantTokens, holdings);
    return { markets, positions };
  }

  const distinctTokens = [...holdings.keys()] as Address[];
  let markets: Market[] = [];
  if (distinctTokens.length > 0) {
    const { markets: loaded } = await searchAllMarkets({
      chainIds: [chainId],
      tokens: distinctTokens,
      collateralProfile,
    });
    markets = loaded;
  }

  // Holdings can be empty after full exit; still load markets touched by historical transfers
  // so swap/LP cashflow is not zeroed by an empty market list.
  if (historicalMarketIds.length > 0) {
    const have = new Set(markets.map((m) => m.id.toLowerCase()));
    const missing = historicalMarketIds.filter((id) => !have.has(id.toLowerCase()));
    if (missing.length > 0) {
      const { markets: hist } = await searchAllMarkets({
        chainIds: [chainId],
        marketIds: missing.map((id) => id.toLowerCase()),
        collateralProfile,
      });
      markets = [...markets, ...hist];
    }
  }

  const positions = await buildPortfolioPositionsFromBalances(supabase, chainId, markets, distinctTokens, holdings);
  return { markets, positions };
}

async function computePositionsAtStartByPeriod(
  positionsNow: PortfolioPosition[],
  account: Address,
  chainId: SupportedChain,
  startTimeByPeriod: Record<PortfolioPlPeriod, number>,
): Promise<Record<PortfolioPlPeriod, PortfolioPosition[]>> {
  const empty: Record<PortfolioPlPeriod, PortfolioPosition[]> = { "1d": [], "1w": [], "1m": [], all: [] };
  if (positionsNow.length === 0) return empty;

  const startTimes = PORTFOLIO_PL_PERIODS.map((p) => startTimeByPeriod[p]);
  const tokens = positionsNow.map((p) => p.tokenId.toLowerCase() as Address);
  const balancesByStart = await fetchTokenBalancesAtEods(account, chainId, startTimes, tokens);

  const out = {} as Record<PortfolioPlPeriod, PortfolioPosition[]>;
  for (const p of PORTFOLIO_PL_PERIODS) {
    const bal = balancesByStart.get(startTimeByPeriod[p]) ?? new Map();
    out[p] = positionsWithBalances(positionsNow, bal, chainId);
  }
  return out;
}

async function reconstructRouterLegsByPeriod(
  account: Address,
  chainId: SupportedChain,
  markets: Market[],
  primaryCollateral: Token,
  startTimeByPeriod: Record<PortfolioPlPeriod, number>,
  endTime: number,
): Promise<Record<PortfolioPlPeriod, { routerPrimaryCollateralNetInWindow: number; events: unknown[] }>> {
  const out = {} as Record<PortfolioPlPeriod, { routerPrimaryCollateralNetInWindow: number; events: unknown[] }>;
  for (const p of PORTFOLIO_PL_PERIODS) {
    out[p] = { routerPrimaryCollateralNetInWindow: 0, events: [] };
  }
  if (markets.length === 0) return out;

  const marketSet = new Set(markets.map((m) => m.id.toLowerCase()));
  const minStart = Math.min(...PORTFOLIO_PL_PERIODS.map((p) => startTimeByPeriod[p]));
  const allEvents = await fetchConditionalEventsForAccount(account, chainId, {
    startTime: minStart,
    endTime,
  });
  const scoped = allEvents.filter((e) => marketSet.has(e.marketId.toLowerCase()));

  for (const p of PORTFOLIO_PL_PERIODS) {
    const start = startTimeByPeriod[p];
    const inWindow = scoped.filter((e) => e.timestamp > start && e.timestamp <= endTime);
    const { netHuman, transactionEvents } = routerPrimaryNetFromConditionalEvents(inWindow, primaryCollateral);
    out[p] = { routerPrimaryCollateralNetInWindow: netHuman, events: transactionEvents };
  }
  return out;
}

export type ComputePortfolioPlAllPeriodsArgs = {
  supabase: SupabaseClient<Database>;
  account: Address;
  chainId: SupportedChain;
  chainIdNum: number;
  endTime: number;
  /** When set and non-empty, PnL is scoped to this market set on `chainId`. */
  marketIds?: Address[];
  collateralProfile: string;
  primaryCollateral: Token;
  debugPeriod?: PortfolioPlPeriod;
};

/**
 * Portfolio P/L (all periods) — how this compute works (important assumptions)
 *
 * Used by market-scoped `get-portfolio-pl` (live) and by the PnL leaderboard refresh job
 * (materialized into `pnl_leaderboard` for global / app-scoped reads).
 *
 * What we value (`valueEnd` / `valueStart`)
 * - **Outcome-token positions** (same shape as `get-portfolio` / `get-portfolio-value`).
 * - **Global** (no `marketIds`): also **protocol collateral (router legs)** — cumulative
 *   HyperIndex `Transfer` with `kind=router_collateral` between the user and Seer routers
 *   for the request **primary** collateral (`computeCollateralPortfolioValuesForPeriods`).
 * - **Market-scoped** (`marketIds` set): outcome MTM only in `value*`. Split/merge/redeem
 *   primary legs come from HyperIndex `ConditionalEvent` as
 *   `routerPrimaryCollateralNetInWindow` (split → −amount, merge/redeem → +amount; only
 *   legs whose collateral matches primary). Not folded into `valueStart`/`valueEnd`.
 *
 * Data sources
 * - Balances / activity / CTF: HyperIndex (`TokenBalance`, `TokenBalanceDaily`, account
 *   activity, `ConditionalEvent`, `router_collateral` transfers).
 * - Markets + historical DEX prices: Supabase (`searchAllMarkets`, `dex_pool_hour_prices`
 *   via `dexPoolPricesFromDb`). Current outcome prices come from position building.
 * - Swap cashflow: DEX subgraphs + CoW fills via `getSwapEvents` /
 *   `computeNetPrimaryCollateralSwapFlowForPeriods` (same semantics as `/get-transactions`
 *   swap rows).
 *
 * Prices
 * - Historical at each `startTime`: latest pool-hour snapshot at/before that time.
 * - `redeemedPrice` rules follow `portfolioValuation.ts` (mirrors the UI hook semantics).
 *
 * Period window (`startTime` / `endTime`)
 * - `endTime` is “now” (unix seconds), passed by the caller.
 * - For `1d` / `1w` / `1m`: UTC **end-of-day** of D−1 / D−7 / D−30 (`eodStartTimesForPeriods`).
 * - For `all`: UTC **end-of-day** of the day **before** earliest indexed account activity
 *   (HyperIndex), so first-day legs are inside `(startTime, endTime]`; fallback 2024-01-01
 *   if none.
 *
 * Positions at `startTime` (for `valueStart`)
 * - Current positions from head HyperIndex balances + markets loaded for those tokens
 *   (or the scoped market set).
 * - Start balances are **EOD snapshots** from `TokenBalanceDaily` at each period’s
 *   `startTime` (`fetchTokenBalancesAtEods`) — not “current minus transfers over the window”.
 *
 * P/L formula
 * - `deltaV = valueEnd − valueStart`.
 * - `tradingCollateralNetOut`: net **primary collateral** spent on outcome swaps in
 *   `(startTime, endTime]` (primary as `tokenIn` minus primary as `tokenOut`). Positive =
 *   typical net cost of buying outcomes.
 * - `lpCollateralNetOut`: net primary deposited into outcome/collateral LP pools
 *   (mint − burn) in the window. Positive = capital locked in LP.
 * - `volume`: gross primary notional of those same swaps (primary as `tokenIn` + primary as
 *   `tokenOut`) in the window.
 * - `marketCount`: distinct markets with counted primary-collateral swaps in the window.
 * - **Global**: `pnl = deltaV − tradingCollateralNetOut − lpCollateralNetOut` (`value*` already
 *   includes cumulative router primary collateral).
 * - **Market-scoped**: `pnl = deltaV + routerPrimaryCollateralNetInWindow − tradingCollateralNetOut − lpCollateralNetOut`.
 * - Subtracting swap/LP net-out treats those legs as cash so buying outcome with 10 sDAI or
 *   providing LP does not masquerade as MTM profit.
 *
 * Limits (documented)
 * - P2P ERC20 transfers of outcome tokens affect indexed balances / EOD snapshots but are
 *   excluded from swap cashflow — assumed rare.
 * - Swaps counted only through venues indexed in `getSwapEvents` (pool subgraph + CoW
 *   owner trades).
 * - When this runs inside the leaderboard job: only recent-activity candidates within the
 *   wallet cap and Netlify budget are refreshed; other wallets keep prior/zero rows.
 *   `marketCount` is always for the period window (not the recent-activity candidate filter).
 */
export async function computePortfolioPlAllPeriods(args: ComputePortfolioPlAllPeriodsArgs): Promise<{
  startTimeByPeriod: Record<PortfolioPlPeriod, number>;
  byPeriod: Record<PortfolioPlPeriod, PortfolioPlPeriodSnapshot>;
  debugPayload?: Record<string, unknown>;
  markets: Market[];
} | null> {
  const {
    supabase,
    account,
    chainId,
    chainIdNum,
    endTime,
    marketIds,
    collateralProfile,
    primaryCollateral,
    debugPeriod,
  } = args;

  const scopedMarketIds = marketIds?.length ? marketIds.map((id) => id.toLowerCase() as Address) : undefined;
  const isMarketScoped = !!scopedMarketIds?.length;
  const singleMarketIdForSwapFilter = scopedMarketIds?.length === 1 ? scopedMarketIds[0] : undefined;

  const activity = await fetchAccountActivity(account, chainId);
  const startTimeByPeriod = eodStartTimesForPeriods(endTime, activity?.earliestTransferTimestamp ?? null);

  const holdings = await fetchTokenBalances(account, chainId);
  const historicalMarketIds = isMarketScoped ? [] : await fetchMarketIdsFromAccountTransfers(account, chainId, endTime);
  const marketsAndPositions = await getMarketsAndPositions(
    supabase,
    account,
    chainId,
    scopedMarketIds,
    collateralProfile,
    holdings,
    historicalMarketIds,
  );
  if (!marketsAndPositions) return null;

  const { markets, positions } = marketsAndPositions;
  const startTimes = PORTFOLIO_PL_PERIODS.map((p) => startTimeByPeriod[p]);

  const positionsAtStartByPeriod = await computePositionsAtStartByPeriod(
    positions,
    account,
    chainId,
    startTimeByPeriod,
  );

  const historyPricesByPeriod = await Promise.all(
    PORTFOLIO_PL_PERIODS.map((p) =>
      getHistoryTokensPricesForPortfolio(supabase, positions, chainId, startTimeByPeriod[p]),
    ),
  );
  const historyPrices: Record<PortfolioPlPeriod, Record<string, number | undefined>> = {
    "1d": historyPricesByPeriod[0],
    "1w": historyPricesByPeriod[1],
    "1m": historyPricesByPeriod[2],
    all: historyPricesByPeriod[3],
  };

  const swapNetByPeriod: Record<PortfolioPlPeriod, number> = { "1d": 0, "1w": 0, "1m": 0, all: 0 };
  const swapVolumeByPeriod: Record<PortfolioPlPeriod, number> = { "1d": 0, "1w": 0, "1m": 0, all: 0 };
  const swapMarketCountByPeriod: Record<PortfolioPlPeriod, number> = { "1d": 0, "1w": 0, "1m": 0, all: 0 };
  try {
    const flow = await computeNetPrimaryCollateralSwapFlowForPeriods(
      account,
      chainId,
      startTimes,
      endTime,
      markets,
      primaryCollateral,
      singleMarketIdForSwapFilter,
      { limitRows: 0 },
    );
    for (const p of PORTFOLIO_PL_PERIODS) {
      swapNetByPeriod[p] = flow.netOutByStartTime.get(startTimeByPeriod[p]) ?? 0;
      swapVolumeByPeriod[p] = flow.volumeByStartTime.get(startTimeByPeriod[p]) ?? 0;
      swapMarketCountByPeriod[p] = flow.marketCountByStartTime.get(startTimeByPeriod[p]) ?? 0;
    }
  } catch (err) {
    // CoW rate-limit / circuit skips are handled inside getCowswapSwapsCached (returns []).
    // This catch covers subgraph or unexpected failures — swap legs stay at 0 for this wallet.
    console.error("portfolio-pl: failed to compute primary collateral swap net flow; using zero swap cashflow", {
      account: account.toLowerCase(),
      chainId: chainIdNum,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const lpNetByPeriod: Record<PortfolioPlPeriod, number> = { "1d": 0, "1w": 0, "1m": 0, all: 0 };
  try {
    const lpFlow = await computeLpPrimaryCollateralNetOutForPeriods(
      account,
      chainId,
      startTimes,
      endTime,
      markets,
      primaryCollateral,
    );
    for (const p of PORTFOLIO_PL_PERIODS) {
      lpNetByPeriod[p] = lpFlow.netOutByStartTime.get(startTimeByPeriod[p]) ?? 0;
    }
  } catch (err) {
    console.error("portfolio-pl: failed to compute LP primary collateral net flow; using zero LP cashflow", {
      account: account.toLowerCase(),
      chainId: chainIdNum,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  let reconstructedByPeriod:
    | Record<PortfolioPlPeriod, { routerPrimaryCollateralNetInWindow: number; events: unknown[] }>
    | undefined;
  if (isMarketScoped) {
    reconstructedByPeriod = await reconstructRouterLegsByPeriod(
      account,
      chainId,
      markets,
      primaryCollateral,
      startTimeByPeriod,
      endTime,
    );
  }

  const collateral = isMarketScoped
    ? { valueEnd: 0, valueStartByStartTime: new Map<number, number>() }
    : await computeCollateralPortfolioValuesForPeriods(account, chainId, endTime, startTimes, primaryCollateral);

  const tokensEndOnly = sumPortfolioValueCurrent(positions);
  const valueEndGlobal = tokensEndOnly + collateral.valueEnd;

  const byPeriod = {} as Record<PortfolioPlPeriod, PortfolioPlPeriodSnapshot>;

  for (const p of PORTFOLIO_PL_PERIODS) {
    const startTime = startTimeByPeriod[p];
    const positionsAtStart = positionsAtStartByPeriod[p];
    const hp = historyPrices[p];
    const tradingCollateralNetOut = swapNetByPeriod[p];
    const lpCollateralNetOut = lpNetByPeriod[p];
    const volume = swapVolumeByPeriod[p];
    const marketCount = swapMarketCountByPeriod[p];

    const collateralValues = isMarketScoped
      ? { valueStart: 0, valueEnd: 0 }
      : {
          valueStart: collateral.valueStartByStartTime.get(startTime) ?? 0,
          valueEnd: collateral.valueEnd,
        };

    const valueEnd = isMarketScoped ? sumPortfolioValueCurrent(positions) : valueEndGlobal;
    const valueStart = sumPortfolioValueAtReference(positionsAtStart, hp, startTime) + collateralValues.valueStart;

    const deltaV = valueEnd - valueStart;
    const routerPrimaryCollateralNetInWindow = isMarketScoped
      ? reconstructedByPeriod![p].routerPrimaryCollateralNetInWindow
      : 0;
    const pnl = isMarketScoped
      ? deltaV + routerPrimaryCollateralNetInWindow - tradingCollateralNetOut - lpCollateralNetOut
      : deltaV - tradingCollateralNetOut - lpCollateralNetOut;

    byPeriod[p] = {
      account: account.toLowerCase(),
      chainId: chainIdNum,
      period: p,
      ...(isMarketScoped ? { marketIds: scopedMarketIds!.map((id) => id.toLowerCase()) } : {}),
      startTime,
      endTime,
      valueStart,
      valueEnd,
      tradingCollateralNetOut,
      lpCollateralNetOut,
      volume,
      marketCount,
      ...(isMarketScoped
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
    const lpCollateralNetOut = lpNetByPeriod[debugPeriod];

    const collateralValues = isMarketScoped
      ? { valueStart: 0, valueEnd: 0 }
      : {
          valueStart: collateral.valueStartByStartTime.get(st) ?? 0,
          valueEnd: collateral.valueEnd,
        };

    const valueEnd = isMarketScoped ? sumPortfolioValueCurrent(positions) : valueEndGlobal;
    const valueStart = sumPortfolioValueAtReference(positionsAtStart, hp, st) + collateralValues.valueStart;
    const deltaV = valueEnd - valueStart;
    const routerWin = isMarketScoped ? reconstructedByPeriod![debugPeriod].routerPrimaryCollateralNetInWindow : 0;
    const pnl = isMarketScoped
      ? deltaV + routerWin - tradingCollateralNetOut - lpCollateralNetOut
      : deltaV - tradingCollateralNetOut - lpCollateralNetOut;

    const tokensStartOnly = sumPortfolioValueAtReference(positionsAtStart, hp, st);

    let swapFlowDebug:
      | { primary: unknown; netOut: number; volume: number; rowCount: number; rows: unknown[] }
      | undefined;
    try {
      const flow = await computeNetPrimaryCollateralSwapFlow(
        account,
        chainId,
        st,
        endTime,
        markets,
        primaryCollateral,
        singleMarketIdForSwapFilter,
        { limitRows: 300 },
      );
      const primaryDecimals = flow.primary.decimals;
      const absWei = (weiStr: string) => {
        const w = BigInt(weiStr);
        return w < 0n ? -w : w;
      };
      const rows = [...flow.rows]
        .map((r) => ({
          ...r,
          countedPrimaryNetOutHuman: formatUnits(BigInt(r.countedPrimaryNetOutWei), primaryDecimals),
          countedPrimaryVolumeHuman: formatUnits(BigInt(r.countedPrimaryVolumeWei), primaryDecimals),
        }))
        .sort((a, b) => {
          const cmp = absWei(b.countedPrimaryNetOutWei) - absWei(a.countedPrimaryNetOutWei);
          return cmp > 0n ? 1 : cmp < 0n ? -1 : 0;
        });
      swapFlowDebug = {
        primary: flow.primary,
        netOut: flow.netOut,
        volume: flow.volume,
        rowCount: flow.rows.length,
        rows,
      };
    } catch (err) {
      console.error("portfolio-pl: failed to compute primary collateral swap net flow (debug rows)", err);
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
      formula: isMarketScoped
        ? "pnl = (valueEnd - valueStart) + routerPrimaryCollateralNetInWindow - tradingCollateralNetOut - lpCollateralNetOut"
        : "pnl = (valueEnd - valueStart) - tradingCollateralNetOut - lpCollateralNetOut",
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
        lpCollateralNetOut,
        volume: swapVolumeByPeriod[debugPeriod],
        pnl,
      },
      primaryCollateralSwaps: swapFlowDebug ?? { error: "swap debug missing (unexpected)" },
      topPositionsByAbsRowDelta: positionRows.slice(0, 25),
      positionCount: positions.length,
    };
  }

  return { startTimeByPeriod, byPeriod, debugPayload, markets };
}

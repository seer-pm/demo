import type { PortfolioPosition, SupportedChain, Token } from "@seer-pm/sdk";
import { getRedeemedPrice } from "@seer-pm/sdk/market";
import type { Market } from "@seer-pm/sdk/market-types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type Address, formatUnits, zeroAddress } from "viem";
import { buildPortfolioPositionsFromBalances } from "./buildPortfolioPositions";
import { getPublicClientByChainId } from "./config";
import { getHistoryTokensPricesForPortfolio } from "./dexPoolHourPrices";
import { computeLpPrimaryCollateralNetOutForPeriodsFromEvents } from "./lpPrimaryCollateralFlow";
import { getMappingsCached } from "./mappingsCache";
import { getMarketsMappings, searchAllMarkets } from "./markets";
import {
  type CollateralPriceByMarketId,
  computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents,
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
import { fetchAccountDexEvents } from "./transactions/fetchAccountDexEvents";

export type { PortfolioPlPeriod };
export { PORTFOLIO_PL_PERIODS };

export type PortfolioPlPeriodSnapshot = {
  account: string;
  chainId: number | "all";
  period: PortfolioPlPeriod;
  marketIds?: string[];
  /** EOD window start; null for global `period=all` leaderboard reads (no fabricated earliest). */
  startTime: number | null;
  endTime: number;
  valueStart: number;
  valueEnd: number;
  tradingCollateralNetOut: number;
  /** Net primary into LP pools in the window (mints − burns). */
  lpCollateralNetOut: number;
  /**
   * Gross swap notional in primary collateral (buy + sell): market-collateral leg × settlement
   * price for conditional markets. See `netPrimaryCollateralSwapFlow.volumeByStartTime`.
   */
  volume: number;
  /** Distinct markets with a market-collateral swap leg in the window. */
  marketCount: number;
  /**
   * Primary put to work in the window: primary spent buying outcomes, plus (market-scoped only)
   * primary split through the router. ROI denominator — not part of the P/L formula.
   */
  capitalDeployed: number;
  /** Snapshot write time from `pnl_leaderboard.updated_at` (global path). */
  updatedAt?: string | null;
  routerPrimaryCollateralNetInWindow?: number;
  events?: unknown[];
  pnl: number;
  /** Set on the global leaderboard path; `pnl` / value fields are USD. */
  unit?: "USD";
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

/**
 * What one unit of each market's collateral token is worth in primary collateral.
 *
 * Flat markets collateralised in primary: 1. Conditional markets use a parent outcome token —
 * valued at settlement (`getRedeemedPrice` on the parent). Lost / unresolved parents price at 0.
 * Keyed by market id (what a mapped swap carries).
 */
function collateralPricesByMarketId(markets: Market[], primaryCollateral: Token): CollateralPriceByMarketId {
  const primaryLc = primaryCollateral.address.toLowerCase();
  const { marketIdToMarket } = getMarketsMappings(markets);
  const byIdLower = new Map(Object.entries(marketIdToMarket).map(([id, m]) => [id.toLowerCase(), m]));
  const prices: CollateralPriceByMarketId = new Map();

  for (const market of markets) {
    const parentId = market.parentMarket?.id;
    const isConditional = !!parentId && parentId.toLowerCase() !== zeroAddress;
    if (!isConditional) {
      prices.set(market.id.toLowerCase(), market.collateralToken.toLowerCase() === primaryLc ? 1 : 0);
      continue;
    }
    const parent = byIdLower.get(parentId.toLowerCase());
    const parentOutcome = Number(market.parentOutcome);
    prices.set(
      market.id.toLowerCase(),
      parent
        ? getRedeemedPrice(parent, parentOutcome)
        : payoutShare(market.parentMarket.payoutReported, market.parentMarket.payoutNumerators, parentOutcome),
    );
  }
  return prices;
}

function payoutShare(payoutReported: boolean, payoutNumerators: readonly bigint[], index: number): number {
  if (!payoutReported) return 0;
  const sum = payoutNumerators.reduce((total, numerator) => total + Number(numerator), 0);
  if (sum === 0) return 0;
  return Number(payoutNumerators[index] ?? 0n) / sum;
}

/** P/L is Generic-only: Futarchy (PNK/GNO, …) would mix 1.0 notional into primary-collateral units. */
function searchGenericMarkets(
  args: Omit<Parameters<typeof searchAllMarkets>[0], "type">,
): ReturnType<typeof searchAllMarkets> {
  return searchAllMarkets({ ...args, type: "Generic" });
}

async function getMarketsAndPositions(
  chainId: SupportedChain,
  marketIds: Address[] | undefined,
  collateralProfile: string,
  holdings: Map<string, bigint>,
  historicalMarketIds: Address[],
): Promise<{ markets: Market[]; positions: PortfolioPosition[] } | null> {
  if (marketIds?.length) {
    const { markets } = await searchGenericMarkets({
      chainIds: [chainId],
      marketIds: marketIds.map((id) => id.toLowerCase()),
      collateralProfile,
    });
    if (markets.length === 0) return null;
    const relevantTokens = [
      ...new Set(markets.flatMap((m) => (m.wrappedTokens ?? []).map((w) => String(w).toLowerCase()))),
    ] as Address[];
    const positions = await buildPortfolioPositionsFromBalances(chainId, markets, relevantTokens, holdings);
    return { markets, positions };
  }

  const distinctTokens = [...holdings.keys()] as Address[];
  let markets: Market[] = [];
  if (distinctTokens.length > 0) {
    const { markets: loaded } = await searchGenericMarkets({
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
      const { markets: hist } = await searchGenericMarkets({
        chainIds: [chainId],
        marketIds: missing.map((id) => id.toLowerCase()),
        collateralProfile,
      });
      markets = [...markets, ...hist];
    }
  }

  const positions = await buildPortfolioPositionsFromBalances(chainId, markets, distinctTokens, holdings);
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

type RouterLegs = {
  routerPrimaryCollateralNetInWindow: number;
  /** Gross primary collateral sent into splits — capital deployed, for ROI. */
  routerPrimaryCollateralSplitOut: number;
  events: unknown[];
};

async function reconstructRouterLegsByPeriod(
  account: Address,
  chainId: SupportedChain,
  markets: Market[],
  primaryCollateral: Token,
  startTimeByPeriod: Record<PortfolioPlPeriod, number>,
  endTime: number,
): Promise<Record<PortfolioPlPeriod, RouterLegs>> {
  const out = {} as Record<PortfolioPlPeriod, RouterLegs>;
  for (const p of PORTFOLIO_PL_PERIODS) {
    out[p] = { routerPrimaryCollateralNetInWindow: 0, routerPrimaryCollateralSplitOut: 0, events: [] };
  }
  if (markets.length === 0) return out;

  const marketSet = new Set(markets.map((m) => m.id.toLowerCase()));
  const minStart = Math.min(...PORTFOLIO_PL_PERIODS.map((p) => startTimeByPeriod[p]));
  const allEvents = await fetchConditionalEventsForAccount(account, chainId, {
    startTime: minStart,
    endTime,
    marketAddresses: [...marketSet] as Address[],
  });
  const scoped = allEvents.filter((e) => marketSet.has(e.marketId.toLowerCase()));

  for (const p of PORTFOLIO_PL_PERIODS) {
    const start = startTimeByPeriod[p];
    const inWindow = scoped.filter((e) => e.timestamp > start && e.timestamp <= endTime);
    const { netHuman, splitOutHuman, transactionEvents } = routerPrimaryNetFromConditionalEvents(
      inWindow,
      primaryCollateral,
    );
    out[p] = {
      routerPrimaryCollateralNetInWindow: netHuman,
      routerPrimaryCollateralSplitOut: splitOutHuman,
      events: transactionEvents,
    };
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

export type PortfolioPlComputed = {
  startTimeByPeriod: Record<PortfolioPlPeriod, number>;
  byPeriod: Record<PortfolioPlPeriod, PortfolioPlPeriodSnapshot>;
  debugPayload?: Record<string, unknown>;
  markets: Market[];
};

/**
 * Portfolio P/L (all periods) — how this compute works (important assumptions)
 *
 * Used by market-scoped `get-portfolio-pl` (live) and by the PnL leaderboard refresh job
 * (materialized into `pnl_leaderboard` for global / app-scoped reads).
 *
 * What we value (`valueEnd` / `valueStart`)
 * - **Generic** outcome-token positions only. Futarchy is excluded so PNK/GNO (etc.)
 *   notional at `redeemedPrice = 1` is not mixed into primary-collateral units.
 *   (`get-portfolio` still lists Futarchy; this compute does not.)
 * - **Global** (no `marketIds`): also **protocol collateral (router legs)** — cumulative
 *   HyperIndex `Transfer` with `kind=router_collateral` between the user and Seer routers
 *   for the request **primary** collateral (`computeCollateralPortfolioValuesForPeriods`).
 * - **Market-scoped** (`marketIds` set): outcome MTM only in `value*`. Split/merge/redeem
 *   primary legs come from HyperIndex `ConditionalEvent` as
 *   `routerPrimaryCollateralNetInWindow` (split → −amount, merge/redeem → +amount; only
 *   legs whose collateral matches primary). Not folded into `valueStart`/`valueEnd`.
 *   A scoped Futarchy id yields no Generic markets → caller 404.
 *
 * Data sources
 * - Balances / activity / CTF: HyperIndex (`TokenBalance`, `TokenBalanceDaily`, account
 *   activity, `ConditionalEvent`, `router_collateral` transfers).
 * - Markets + historical DEX prices: Supabase (`searchAllMarkets` with `type: Generic`,
 *   `dex_pool_hour_prices` via `dexPoolHourPrices`). Current outcome prices come from
 *   position building, which reads the pools on-chain.
 * - Swap cashflow: DEX subgraphs + CoW fills via `fetchAccountDexEvents` /
 *   `computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents` (same semantics as
 *   `/get-transactions` swap rows).
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
 *   typical net cost of buying outcomes. Deliberately primary-only: on a conditional market both
 *   legs of a swap are positions inside the valued set, so `deltaV` already nets them.
 * - `lpCollateralNetOut`: net primary deposited into outcome/collateral LP pools
 *   (mint − burn) in the window. Positive = capital locked in LP.
 * - `volume`: each swap's market-collateral leg valued in primary (primary on flat markets;
 *   parent outcome × settlement price on conditional ones).
 * - `marketCount`: distinct markets with a market-collateral swap leg in the window.
 * - `capitalDeployed`: primary spent buying outcomes (`tokenIn` = primary), plus (market-scoped
 *   only) gross primary split through the router — the ROI denominator, not part of P/L.
 * - **Global**: `pnl = deltaV − tradingCollateralNetOut − lpCollateralNetOut` (`value*` already
 *   includes cumulative router primary collateral).
 * - **Market-scoped**: `pnl = deltaV + routerPrimaryCollateralNetInWindow − tradingCollateralNetOut − lpCollateralNetOut`.
 * - Subtracting swap/LP net-out treats those legs as cash so buying outcome with 10 sDAI or
 *   providing LP does not masquerade as MTM profit.
 *
 * Limits (documented)
 * - P2P ERC20 transfers of outcome tokens affect indexed balances / EOD snapshots but are
 *   excluded from swap cashflow — assumed rare.
 * - Swaps counted only through venues indexed in `fetchAccountDexEvents` (pool subgraph + CoW
 *   owner trades).
 * - When this runs inside the leaderboard job: wallets with analytics activity are
 *   refreshed in stale/missing batches under the Netlify time budget; other wallets
 *   keep prior/zero rows. `marketCount` is always for the period window (not the
 *   candidate activity filter).
 * - Fail closed: DEX/subgraph/price outages throw. The leaderboard skips the upsert so a
 *   prior row is kept. Live `get-portfolio-pl` catches that and returns a zeroed snapshot
 *   (200) so the frontend does not surface a 500.
 */
export async function computePortfolioPlAllPeriods(
  args: ComputePortfolioPlAllPeriodsArgs,
): Promise<PortfolioPlComputed | null> {
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
    chainId,
    scopedMarketIds,
    collateralProfile,
    holdings,
    historicalMarketIds,
  );
  if (!marketsAndPositions) {
    return null;
  }

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
  const swapBuysByPeriod: Record<PortfolioPlPeriod, number> = { "1d": 0, "1w": 0, "1m": 0, all: 0 };
  const swapVolumeByPeriod: Record<PortfolioPlPeriod, number> = { "1d": 0, "1w": 0, "1m": 0, all: 0 };
  const swapMarketCountByPeriod: Record<PortfolioPlPeriod, number> = { "1d": 0, "1w": 0, "1m": 0, all: 0 };

  const collateralPrices = collateralPricesByMarketId(markets, primaryCollateral);
  const minDexStart = Math.min(...startTimes);
  // One Goldsky pass per wallet: swaps + mints + burns (+ CoW in parallel inside fetchAccountDexEvents).
  // Empty Generic markets (e.g. TradeExecutor owner EOA that never held outcome tokens) is a
  // legitimate zero cashflow. DEX/subgraph failures throw so callers fail closed (no partial upsert).
  let dexEvents: Awaited<ReturnType<typeof fetchAccountDexEvents>> | null = null;
  if (markets.length > 0) {
    const mappings = await getMappingsCached(getPublicClientByChainId(chainId), markets, chainId);
    const walletTokenIds = [...holdings.keys(), primaryCollateral.address];
    dexEvents = await fetchAccountDexEvents(mappings, account, chainId, minDexStart, endTime, {
      walletTokenIds,
    });
  }

  if (dexEvents) {
    const flow = computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents(
      dexEvents.swaps,
      startTimes,
      endTime,
      primaryCollateral,
      collateralPrices,
      singleMarketIdForSwapFilter,
      { limitRows: 0 },
    );
    for (const p of PORTFOLIO_PL_PERIODS) {
      swapNetByPeriod[p] = flow.netOutByStartTime.get(startTimeByPeriod[p]) ?? 0;
      swapBuysByPeriod[p] = flow.buysByStartTime.get(startTimeByPeriod[p]) ?? 0;
      swapVolumeByPeriod[p] = flow.volumeByStartTime.get(startTimeByPeriod[p]) ?? 0;
      swapMarketCountByPeriod[p] = flow.marketCountByStartTime.get(startTimeByPeriod[p]) ?? 0;
    }
  }

  const lpNetByPeriod: Record<PortfolioPlPeriod, number> = { "1d": 0, "1w": 0, "1m": 0, all: 0 };
  if (dexEvents) {
    const lpFlow = computeLpPrimaryCollateralNetOutForPeriodsFromEvents(
      dexEvents.mints,
      dexEvents.burns,
      startTimes,
      endTime,
      primaryCollateral,
    );
    for (const p of PORTFOLIO_PL_PERIODS) {
      lpNetByPeriod[p] = lpFlow.netOutByStartTime.get(startTimeByPeriod[p]) ?? 0;
    }
  }

  let reconstructedByPeriod: Record<PortfolioPlPeriod, RouterLegs> | undefined;
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
    // Global path folds router legs into `value*` rather than reconstructing them, so swap buys
    // alone stand in for capital. Scoped path adds gross splits (conditional contests often
    // enter via split then trade parent-outcome tokens without a primary swap buy).
    const capitalDeployed =
      Math.max(swapBuysByPeriod[p], 0) +
      (isMarketScoped ? Math.max(reconstructedByPeriod![p].routerPrimaryCollateralSplitOut, 0) : 0);
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
      capitalDeployed,
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
    const snap = byPeriod[debugPeriod];
    const st = startTimeByPeriod[debugPeriod];
    const positionsAtStart = positionsAtStartByPeriod[debugPeriod];
    const hp = historyPrices[debugPeriod];
    const tradingCollateralNetOut = snap.tradingCollateralNetOut;
    const lpCollateralNetOut = snap.lpCollateralNetOut;
    const deltaV = snap.valueEnd - snap.valueStart;
    const pnl = snap.pnl;

    const collateralValues = isMarketScoped
      ? { valueStart: 0, valueEnd: 0 }
      : {
          valueStart: collateral.valueStartByStartTime.get(st) ?? 0,
          valueEnd: collateral.valueEnd,
        };

    const tokensStartOnly = sumPortfolioValueAtReference(positionsAtStart, hp, st);

    let swapFlowDebug:
      | { primary: unknown; netOut: number; buys: number; volume: number; rowCount: number; rows: unknown[] }
      | undefined;
    try {
      if (dexEvents) {
        const flow = computeNetPrimaryCollateralSwapFlowForPeriodsFromEvents(
          dexEvents.swaps,
          [st],
          endTime,
          primaryCollateral,
          collateralPrices,
          singleMarketIdForSwapFilter,
          { limitRows: 300 },
        );
        const primaryDecimals = flow.primary.decimals;
        const absWei = (weiStr: string) => {
          const w = BigInt(weiStr);
          return w < 0n ? -w : w;
        };
        const rows = [...(flow.rowsByStartTime.get(st) ?? [])]
          .map((r) => ({
            ...r,
            countedPrimaryNetOutHuman: formatUnits(BigInt(r.countedPrimaryNetOutWei), primaryDecimals),
          }))
          .sort((a, b) => {
            const cmp = absWei(b.countedPrimaryNetOutWei) - absWei(a.countedPrimaryNetOutWei);
            return cmp > 0n ? 1 : cmp < 0n ? -1 : 0;
          });
        swapFlowDebug = {
          primary: flow.primary,
          netOut: flow.netOutByStartTime.get(st) ?? 0,
          buys: flow.buysByStartTime.get(st) ?? 0,
          volume: flow.volumeByStartTime.get(st) ?? 0,
          rowCount: (flow.rowsByStartTime.get(st) ?? []).length,
          rows,
        };
      }
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
        volume: snap.volume,
        capitalDeployed: snap.capitalDeployed,
        pnl,
      },
      primaryCollateralSwaps: swapFlowDebug ?? {
        skipped: true,
        reason: markets.length === 0 ? "no generic markets" : "dex events unavailable",
      },
      topPositionsByAbsRowDelta: positionRows.slice(0, 25),
      positionCount: positions.length,
    };
  }

  return { startTimeByPeriod, byPeriod, debugPayload, markets };
}

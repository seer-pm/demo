import { SUPPORTED_CHAINS } from "@/lib/chains";
import type { SupportedChain } from "@seer-pm/sdk";
import { DEFAULT_COLLATERAL_PROFILE, getCollateralProfileByName } from "@seer-pm/sdk";
import { getRedeemedPrice } from "@seer-pm/sdk/market";
import { createClient } from "@supabase/supabase-js";
import { type Address, zeroAddress } from "viem";
import { requireBackgroundSecret } from "./utils/backgroundAuth";
import { getDexScreenerPriceUSD } from "./utils/common";
import { fetchHoldersOfTokens } from "./utils/marketHoldings";
import {
  type MtmRefreshRow,
  type PricedMarket,
  effectivePricesByToken,
  outcomePriceTokensForChain,
  refreshMarketMtm,
} from "./utils/marketMtmRefresh";
import { searchAllMarkets } from "./utils/markets";
import { getCurrentOutcomePrices } from "./utils/onchainOutcomePrices";
import type { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

/** Stay under Netlify's ~15m background limit. */
const BUDGET_MS = 13 * 60 * 1000;
/** Markets per run. Each costs one price read plus one holder query. */
const DEFAULT_MARKET_BATCH = 40;
const ROW_PAGE = 1000;

/**
 * Mark-to-market refresh, walking markets instead of wallets.
 *
 * Cashflow is refreshed by the wallet pass when a wallet acts. MTM has no such signal: it moves on
 * every price tick and on every resolution, so a market that settles changes the P/L of all its
 * holders at once with no transfer anywhere. Walking wallets to catch that costs one price read per
 * wallet per market; walking markets costs one per market, shared across holders.
 *
 * Only the MTM half is rewritten — `pnl` is rebuilt from stored cashflow columns, and
 * `capital_deployed` is left alone because the peak already includes the window's opening position.
 *
 * **Dry run by default.** The loop recomputes a value that the wallet pass also computes, from a
 * different code path, so a disagreement between them is a bug in one of the two — and writing
 * first is how you find that out by corrupting rows. Pass `?apply=1` only once a dry run shows the
 * two agree. See `mismatchVsWalletPass` in the output.
 *
 * `?chainId=100` to restrict, `?markets=N` for the batch size, `?apply=1` to write.
 */
type MarketLike = Awaited<ReturnType<typeof searchAllMarkets>>["markets"][number];

function isRoot(market: MarketLike): boolean {
  const parent = market.parentMarket?.id;
  return !parent || parent.toLowerCase() === (zeroAddress as string);
}

function toPricedMarket(market: MarketLike): PricedMarket {
  return {
    id: market.id.toLowerCase(),
    collateralToken: market.collateralToken.toLowerCase(),
    wrappedTokens: (market.wrappedTokens ?? []).map((t) => String(t).toLowerCase()),
    parentMarketId: isRoot(market) ? undefined : market.parentMarket.id.toLowerCase(),
  };
}

/**
 * The market plus every ancestor, ordered root first — the order `mapOutcomePrices` needs to resolve
 * a chain deeper than one level in its single pass.
 */
async function loadParentChain(
  market: MarketLike,
  chainId: SupportedChain,
  cache: Map<string, MarketLike>,
): Promise<PricedMarket[]> {
  const chain: MarketLike[] = [market];
  let current = market;
  // Depth is small (session market -> conditional), but bound it so a cyclic parent cannot hang.
  for (let depth = 0; depth < 8 && !isRoot(current); depth++) {
    const parentId = current.parentMarket.id.toLowerCase();
    let parent = cache.get(parentId);
    if (!parent) {
      const { markets: found } = await searchAllMarkets({
        chainIds: [chainId],
        marketIds: [parentId],
        collateralProfile: DEFAULT_COLLATERAL_PROFILE,
        type: "Generic",
      });
      parent = found[0];
      if (!parent) break;
      cache.set(parentId, parent);
    }
    chain.push(parent);
    current = parent;
  }
  return chain.reverse().map(toPricedMarket);
}

export default async (req: Request) => {
  if (process.env.DISABLE_SCHEDULED_FUNCTIONS === "true") {
    console.log("refresh-pnl-market-mtm: disabled");
    return;
  }
  const unauthorized = requireBackgroundSecret(req);
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const onlyChain = url.searchParams.get("chainId");
  const marketBatch = Number(url.searchParams.get("markets")) || DEFAULT_MARKET_BATCH;
  const apply = url.searchParams.get("apply") === "1";
  const chains = Object.values(SUPPORTED_CHAINS)
    .map((c) => c.id as number)
    .filter((id) => (onlyChain ? id === Number(onlyChain) : true));

  const startedAt = Date.now();
  const deadlineMs = startedAt + BUDGET_MS;
  const results: unknown[] = [];

  for (const chainId of chains) {
    if (Date.now() >= deadlineMs) break;
    const supportedChain = chainId as SupportedChain;

    // Oldest-touched markets first, so the sweep rotates rather than re-doing the same head.
    const { data: marketRows, error: marketsError } = await supabase
      .from("pnl_market_leaderboard")
      .select("market_id, updated_at")
      .eq("chain_id", chainId)
      .order("updated_at", { ascending: true })
      .limit(ROW_PAGE);
    if (marketsError) throw new Error(`pnl-market-mtm: market list failed: ${marketsError.message}`);

    const marketIds = [...new Set((marketRows ?? []).map((r) => r.market_id.toLowerCase()))].slice(0, marketBatch);
    if (marketIds.length === 0) continue;

    const profile = getCollateralProfileByName(supportedChain, DEFAULT_COLLATERAL_PROFILE);
    const collateralPriceUsd = await getDexScreenerPriceUSD(profile.primary.address, supportedChain);
    if (!(collateralPriceUsd > 0)) {
      throw new Error(`pnl-market-mtm: refusing chain ${chainId}: collateral USD price is ${collateralPriceUsd}`);
    }

    const { markets } = await searchAllMarkets({
      chainIds: [supportedChain],
      marketIds,
      collateralProfile: DEFAULT_COLLATERAL_PROFILE,
      type: "Generic",
    });

    const marketCache = new Map<string, MarketLike>();
    let updated = 0;
    let scanned = 0;
    let wouldUpdate = 0;
    let collapsedToZero = 0;
    let largeMoves = 0;
    const moves: Array<{ address: string; period: string; from: number; to: number; relative: number }> = [];
    for (const market of markets) {
      if (Date.now() >= deadlineMs) break;
      const tokens = (market.wrappedTokens ?? []).map((t) => String(t).toLowerCase() as Address);
      if (tokens.length === 0) continue;

      // Price the whole parent chain, not this market alone. A conditional outcome is quoted
      // against its parent's outcome token, so a batch holding only this market's tokens values
      // every conditional at 0 — see `outcomePricingContract.test.ts`.
      const chain = await loadParentChain(market, supportedChain, marketCache);
      const currentByToken = await getCurrentOutcomePrices(outcomePriceTokensForChain(chain), supportedChain);
      // A resolved market has no live pool, so the settled payout has to take precedence — same
      // rule `buildPortfolioPositions` uses, and the reason an earlier version zeroed real positions.
      const redeemedByToken: Record<string, number> = {};
      tokens.forEach((tokenId, index) => {
        redeemedByToken[tokenId] = getRedeemedPrice(market, index);
      });
      const pricesByToken = effectivePricesByToken({ tokens, redeemedByToken, currentByToken });
      const holdings = await fetchHoldersOfTokens(supportedChain, tokens);

      const { data: rows, error: rowsError } = await supabase
        .from("pnl_market_leaderboard")
        .select(
          "address, market_id, period, value_end_mtm, value_start_mtm, router_primary_cum_start, router_primary_cum_end, trading_collateral_net_out, lp_collateral_net_out, window_start, window_end",
        )
        .eq("chain_id", chainId)
        .eq("market_id", market.id.toLowerCase());
      if (rowsError) throw new Error(`pnl-market-mtm: row read failed: ${rowsError.message}`);

      const current = new Map<string, number>();
      // The upsert replaces the whole row, so the window bounds have to be carried through: writing
      // a placeholder would erase what the wallet pass established.
      const windows = new Map<string, { start: number; end: number }>();
      const refreshRows: MtmRefreshRow[] = (rows ?? []).map((r) => {
        const rowKey = `${r.address.toLowerCase()}|${r.market_id.toLowerCase()}|${r.period}`;
        current.set(rowKey, Number(r.value_end_mtm) || 0);
        windows.set(rowKey, { start: Number(r.window_start) || 0, end: Number(r.window_end) || 0 });
        return {
          address: r.address,
          marketId: r.market_id,
          period: r.period,
          valueStartMtm: Number(r.value_start_mtm) || 0,
          routerPrimaryCumStart: Number(r.router_primary_cum_start) || 0,
          routerPrimaryCumEnd: Number(r.router_primary_cum_end) || 0,
          tradingCollateralNetOut: Number(r.trading_collateral_net_out) || 0,
          lpCollateralNetOut: Number(r.lp_collateral_net_out) || 0,
        };
      });
      scanned += refreshRows.length;

      const updates = refreshMarketMtm({
        rows: refreshRows,
        currentValueEndMtm: current,
        holdings,
        pricesByToken,
        collateralPriceUsd,
        // A hundredth of a collateral unit: below that the write is not worth the churn.
        epsilon: 0.01,
      });
      if (updates.length === 0) continue;

      // Every update is a disagreement with what the wallet pass stored. Some are legitimate (the
      // price moved since), but a value collapsing to zero is the signature of a failed price read,
      // not of a market going worthless — so it is counted and sampled rather than trusted.
      for (const u of updates) {
        const key = `${u.address.toLowerCase()}|${u.marketId.toLowerCase()}|${u.period}`;
        const previous = current.get(key) ?? 0;
        if (previous !== 0 && u.valueEndMtm === 0) collapsedToZero += 1;
        // Track the relative move, not only collapses: a value dropping 100 -> 5 is just as wrong
        // and would pass a zero-check unnoticed. Price drift between passes is small; a large
        // relative jump means the two paths disagree about something other than the clock.
        const relative =
          previous === 0 ? (u.valueEndMtm === 0 ? 0 : 1) : Math.abs(u.valueEndMtm - previous) / Math.abs(previous);
        if (relative > 0.1) largeMoves += 1;
        moves.push({ address: u.address, period: u.period, from: previous, to: u.valueEndMtm, relative });
      }

      if (!apply) {
        wouldUpdate += updates.length;
        continue;
      }

      const writtenAt = new Date().toISOString();
      const { error: upsertError } = await supabase.from("pnl_market_leaderboard").upsert(
        updates.map((u) => {
          const w = windows.get(`${u.address.toLowerCase()}|${u.marketId.toLowerCase()}|${u.period}`);
          return {
            chain_id: chainId,
            address: u.address.toLowerCase(),
            market_id: u.marketId.toLowerCase(),
            period: u.period,
            value_end_mtm: u.valueEndMtm,
            value_end: u.valueEnd,
            pnl: u.pnl,
            pnl_usd: u.pnlUsd,
            collateral_price_usd: collateralPriceUsd,
            updated_at: writtenAt,
            window_start: w?.start ?? 0,
            window_end: w?.end ?? 0,
          };
        }),
        { onConflict: "chain_id,address,market_id,period" },
      );
      if (upsertError) throw new Error(`pnl-market-mtm: upsert failed: ${upsertError.message}`);
      updated += updates.length;
    }
    results.push({
      chainId,
      markets: markets.length,
      scanned,
      applied: apply,
      updated,
      wouldUpdate,
      mismatchVsWalletPass: collapsedToZero,
      movesOver10pct: largeMoves,
      worstMoves: moves.sort((a, b) => b.relative - a.relative).slice(0, 8),
    });
  }

  console.log("refresh-pnl-market-mtm: finished", JSON.stringify({ elapsedMs: Date.now() - startedAt, results }));
  return new Response(JSON.stringify({ results }), { headers: { "Content-Type": "application/json" } });
};

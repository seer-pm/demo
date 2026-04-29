import type { SupportedChain } from "@seer-pm/sdk";
import { SUBGRAPHS } from "@seer-pm/sdk/subgraph";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { type Address, formatUnits, isAddress, isAddressEqual } from "viem";
import { buildPortfolioPositions } from "./utils/buildPortfolioPositions";
import { computeCollateralPortfolioValuesForPeriod } from "./utils/collateralPortfolioValue";
import { getHistoryTokensPricesForPortfolio } from "./utils/dexPoolPricesFromDb";
import { searchMarkets } from "./utils/markets";
import { computeNetPrimaryCollateralSwapFlow } from "./utils/netPrimaryCollateralSwapFlow";
import { sumPortfolioValueAtReference, sumPortfolioValueCurrent } from "./utils/portfolioValuation";
import type { Database } from "./utils/supabase";
import { getTokenDecimals } from "./utils/tokenDecimals";
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
 * - We start from **current** positions (`buildPortfolioPositions` with `forHistoricPnl: true`) and **roll back balances** using `tokens_transfers`
 *   between `(startTime, endTime]` for the outcome tokens in that portfolio (includes zero-balance rows from Supabase for redeemed winners).
 * - This is an approximation: it assumes `tokens_transfers` is complete for those tokens over the window.
 *
 * P/L formula
 * - `deltaV = valueEnd − valueStart`: outcome-token MTM plus net router–user ERC20 collateral legs (cumulative to `endTime` vs `startTime`).
 * - `tradingCollateralNetOut`: net **primary collateral** spent on outcome swaps in `(startTime, endTime]` (DEX subgraph + CoW fills), i.e.
 *   primary spent as `tokenIn` minus primary received as `tokenOut`. Same semantics as `/get-transactions` swap rows.
 * - **`pnl = deltaV − tradingCollateralNetOut`**: treats swap legs as cash so buying outcome with 10 sDAI does not masquerade as +10 MTM profit.
 *
 * Limits (documented)
 * - P2P ERC20 transfers of outcome tokens would affect MTM rollback via `tokens_transfers` but are excluded from swap cashflow — assumed rare.
 * - Swaps routed only through venues indexed in `getSwapEvents` (pool subgraph + CoW owner trades).
 */

type Period = "1d" | "1w" | "1m" | "all";

async function computePositionsAtStartFromTransfers(
  supabase: SupabaseClient<Database>,
  positionsNow: Awaited<ReturnType<typeof buildPortfolioPositions>>,
  account: Address,
  chainId: SupportedChain,
  startTime: number,
  endTime: number,
) {
  if (positionsNow.length === 0) return [];
  const tokenIds = Array.from(new Set(positionsNow.map((p) => p.tokenId.toLowerCase()))) as Address[];
  const decimalsByToken = getTokenDecimals(chainId, tokenIds);

  const { data, error } = await supabase
    .from("tokens_transfers")
    .select("token,from,to,value::text,timestamp")
    .eq("chain_id", chainId)
    .in("token", tokenIds)
    .gt("timestamp", startTime)
    .lte("timestamp", endTime)
    // user is sender or receiver
    .or(`from.eq.${account.toLowerCase()},to.eq.${account.toLowerCase()}`);

  if (error) {
    throw new Error(`Error fetching tokens_transfers: ${error.message}`);
  }

  const deltaWeiByToken: Record<string, bigint> = {};
  for (const row of data ?? []) {
    const token = (row.token as string | null)?.toLowerCase();
    if (!token) continue;
    const valueWei = BigInt(row.value);

    // delta = incoming - outgoing after startTime (same units as rawBalance)
    if (isAddressEqual(row.to as Address, account)) {
      deltaWeiByToken[token] = (deltaWeiByToken[token] ?? 0n) + valueWei;
    } else if (isAddressEqual(row.from as Address, account)) {
      deltaWeiByToken[token] = (deltaWeiByToken[token] ?? 0n) - valueWei;
    }
  }

  return positionsNow.map((p) => {
    const deltaWei = deltaWeiByToken[p.tokenId.toLowerCase()] ?? 0n;
    const rawNow = BigInt(p.rawBalance);
    if (rawNow < deltaWei) {
      console.warn(
        "get-portfolio-pl: current balance smaller than net transfers in window; clamping start balance to 0 (possible missing or late transfer data)",
        {
          tokenId: p.tokenId,
          rawNow: rawNow.toString(),
          deltaWei: deltaWei.toString(),
          startTime,
          endTime,
          chainId,
          account: account.toLowerCase(),
        },
      );
    }
    const startWei = rawNow >= deltaWei ? rawNow - deltaWei : 0n;
    const decimals = decimalsByToken[p.tokenId.toLowerCase()] ?? 18;
    const startBalance = Number(formatUnits(startWei, decimals));
    return { ...p, tokenBalance: startBalance, rawBalance: startWei.toString() };
  });
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
  p: Awaited<ReturnType<typeof buildPortfolioPositions>>[number],
  tokenIdToReferencePrice: Record<string, number | undefined>,
  referenceTimeSeconds: number,
): number {
  let tokenPrice = tokenIdToReferencePrice[p.tokenId.toLowerCase()] ?? p.tokenPrice;
  if (p.marketFinalizeTs < referenceTimeSeconds) {
    tokenPrice = p.redeemedPrice || tokenPrice;
  }
  return tokenPrice * p.tokenBalance;
}

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

    const endTime = Math.floor(Date.now() / 1000); // now
    const startTime = await computeStartTime(supabase, period, chainIdNum as SupportedChain, account, endTime);

    const marketId = marketIdParam ? (isAddress(marketIdParam) ? (marketIdParam as Address) : null) : undefined;
    if (marketId === null) {
      return new Response(JSON.stringify({ error: "marketId must be a valid address" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const positionsAll = await buildPortfolioPositions(supabase, account, chainIdNum as SupportedChain, true);
    const positions = marketId
      ? positionsAll.filter((p) => p.marketId.toLowerCase() === marketId.toLowerCase())
      : positionsAll;

    const positionsAtStart = await computePositionsAtStartFromTransfers(
      supabase,
      positions,
      account,
      chainIdNum as SupportedChain,
      startTime,
      endTime,
    );

    const historyPrices = await getHistoryTokensPricesForPortfolio(
      supabase,
      positions,
      chainIdNum as SupportedChain,
      startTime,
    );

    let tradingCollateralNetOut = 0;
    let swapFlowDebug: { primary: unknown; netOut: number; rowCount: number; rows: unknown[] } | undefined;
    try {
      const flow = await computeNetPrimaryCollateralSwapFlow(
        supabase,
        account,
        chainIdNum as SupportedChain,
        startTime,
        endTime,
        marketId,
        { limitRows: debug ? 300 : 0 },
      );
      tradingCollateralNetOut = flow.netOut;
      if (debug) {
        swapFlowDebug = {
          primary: flow.primary,
          netOut: flow.netOut,
          rowCount: flow.rows.length,
          rows: flow.rows,
        };
      }
    } catch (err) {
      console.error("get-portfolio-pl: failed to compute primary collateral swap net flow", err);
      tradingCollateralNetOut = 0;
    }

    let routerPrimaryCollateralNetInWindow = 0;
    let reconstructedEvents: unknown[] | undefined;
    let marketName: string | undefined;

    if (marketId) {
      const { markets } = await searchMarkets({ chainIds: [chainIdNum as SupportedChain], id: marketId });
      const market = markets[0];
      if (!market) {
        return new Response(JSON.stringify({ error: `Market not found: ${marketId}` }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      marketName = market.marketName;

      const reconstructed = await reconstructSplitMergeRedeemFromTransfersForMarket({
        supabase,
        account,
        chainId: chainIdNum as SupportedChain,
        marketId,
        marketName: market.marketName,
        wrappedTokens: market.wrappedTokens as Address[],
        startTime,
        endTime,
      });
      routerPrimaryCollateralNetInWindow = reconstructed.routerPrimaryCollateralNetInWindow;
      reconstructedEvents = reconstructed.events;
    }

    const collateralValues = marketId
      ? { valueEnd: 0, valueStart: 0 }
      : await computeCollateralPortfolioValuesForPeriod(
          supabase,
          account,
          chainIdNum as SupportedChain,
          startTime,
          endTime,
        );

    const valueEnd = sumPortfolioValueCurrent(positions) + collateralValues.valueEnd;
    const valueStart =
      sumPortfolioValueAtReference(positionsAtStart, historyPrices, startTime) + collateralValues.valueStart;

    const deltaV = valueEnd - valueStart;
    // Why PnL differs for `marketId` vs global:
    // - Global P&L includes protocol-style collateral as a **cumulative** component (`collateralValues.valueStart/valueEnd`)
    //   derived from primary-collateral ERC20 transfers user↔router across all markets.
    // - Market P&L cannot (yet) attribute that cumulative router-collateral component to a *single* market without scanning
    //   and partitioning all router transfers since the user's first indexed transfer.
    //   Instead, we add `routerPrimaryCollateralNetInWindow` reconstructed for this market within (startTime, endTime].
    const pnl = marketId
      ? deltaV + routerPrimaryCollateralNetInWindow - tradingCollateralNetOut
      : deltaV - tradingCollateralNetOut;

    const tokensEndOnly = sumPortfolioValueCurrent(positions);
    const tokensStartOnly = sumPortfolioValueAtReference(positionsAtStart, historyPrices, startTime);

    let debugPayload: Record<string, unknown> | undefined;
    if (debug) {
      const rows = positions.map((p, i) => {
        const atStart = positionsAtStart[i];
        const vEnd = p.tokenPrice * p.tokenBalance;
        const vStart = positionRowValueAtReference(atStart, historyPrices, startTime);
        let priceStartUsed = historyPrices[p.tokenId.toLowerCase()] ?? atStart.tokenPrice;
        if (atStart.marketFinalizeTs < startTime) {
          priceStartUsed = atStart.redeemedPrice || priceStartUsed;
        }
        return {
          tokenId: p.tokenId,
          marketName: p.marketName.slice(0, 80),
          endBalance: p.tokenBalance,
          startBalance: atStart.tokenBalance,
          priceEnd: p.tokenPrice,
          priceStartUsed,
          valueEnd: vEnd,
          valueStart: vStart,
          rowDelta: vEnd - vStart,
        };
      });
      rows.sort((a, b) => Math.abs(b.rowDelta) - Math.abs(a.rowDelta));

      debugPayload = {
        formula: "pnl = (valueEnd - valueStart) - tradingCollateralNetOut",
        windowSeconds: endTime - startTime,
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
        topPositionsByAbsRowDelta: rows.slice(0, 25),
        positionCount: positions.length,
      };
    }

    return new Response(
      JSON.stringify(
        {
          account: account.toLowerCase(),
          chainId: chainIdNum,
          period,
          ...(marketId ? { marketId: marketId.toLowerCase(), marketName } : {}),
          startTime,
          endTime,
          valueStart,
          valueEnd,
          tradingCollateralNetOut,
          ...(marketId ? { routerPrimaryCollateralNetInWindow, events: reconstructedEvents } : {}),
          pnl,
          ...(debug && debugPayload ? { debug: debugPayload } : {}),
        },
        (_, v) => (typeof v === "bigint" ? v.toString() : v),
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
        },
      },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e?.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

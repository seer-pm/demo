import type { SupportedChain } from "@seer-pm/sdk";
import { SUBGRAPHS } from "@seer-pm/sdk/subgraph";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { type Address, formatUnits, isAddressEqual } from "viem";
import { buildPortfolioPositions } from "./utils/buildPortfolioPositions";
import { getCurrentTokensPricesForPortfolio, getHistoryTokensPricesForPortfolio } from "./utils/dexPoolPricesFromDb";
import { sumPortfolioValueAtReference, sumPortfolioValueCurrent } from "./utils/portfolioValuation";
import type { Database } from "./utils/supabase";
import { getTokenDecimals } from "./utils/tokenDecimals";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

/**
 * Portfolio P/L (period) — how this endpoint works (important assumptions)
 *
 * What we value (`valueEnd` / `valueStart`)
 * - We value **outcome-token positions only** (the same shape as `get-portfolio` / `get-portfolio-value`).
 * - We intentionally **do not** include “idle” primary collateral (e.g. sDAI sitting in the wallet) in `V`.
 *   Therefore, pure wallet deposits/withdrawals of collateral should not move `V`.
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
 * - We start from **current** positions (`buildPortfolioPositions`) and **roll back balances** using `tokens_transfers`
 *   between `(startTime, endTime]` for the outcome tokens in the current portfolio.
 * - This is an approximation: it assumes `tokens_transfers` is complete for those tokens over the window.
 *
 * P/L formula (explicitly simplified for our `V`)
 * - Because `V` is positions-only, we **do not subtract external collateral cashflows** from P/L.
 * - So: `pnl = valueEnd - valueStart`.
 *
 * What this P/L is / isn’t
 * - This is closer to “change in marked-to-market value of current holdings between two timestamps”, not a full
 *   realized P/L ledger with cost basis.
 * - If you later want Polymarket-style P/L including cash in `V`, you must re-introduce a `NetFlows` term aligned with
 *   whatever cash component is included in `V`.
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
    .select("token,from,to,value,timestamp")
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

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const account = url.searchParams.get("account") as Address | null;
    const chainId = url.searchParams.get("chainId");
    const period = (url.searchParams.get("period") ?? "1d").toLowerCase() as Period;

    if (!account) {
      return new Response(JSON.stringify({ error: "Account parameter is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
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

    const chainIdNum = Number.parseInt(chainId, 10);
    if (Number.isNaN(chainIdNum)) {
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

    const positions = await buildPortfolioPositions(supabase, account, chainIdNum as SupportedChain);

    const positionsAtStart = await computePositionsAtStartFromTransfers(
      supabase,
      positions,
      account,
      chainIdNum as SupportedChain,
      startTime,
      endTime,
    );

    const [currentPrices, historyPrices] = await Promise.all([
      getCurrentTokensPricesForPortfolio(supabase, positions, chainIdNum as SupportedChain),
      getHistoryTokensPricesForPortfolio(supabase, positions, chainIdNum as SupportedChain, startTime),
    ]);

    const valueEnd = sumPortfolioValueCurrent(positions, currentPrices);
    const valueStart = sumPortfolioValueAtReference(positionsAtStart, historyPrices, currentPrices, startTime);

    const pnl = valueEnd - valueStart;

    return new Response(
      JSON.stringify(
        {
          account: account.toLowerCase(),
          chainId: chainIdNum,
          period,
          startTime,
          endTime,
          valueStart,
          valueEnd,
          pnl,
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

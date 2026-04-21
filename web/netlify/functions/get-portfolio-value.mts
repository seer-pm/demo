import type { SupportedChain } from "@seer-pm/sdk";
import { SUBGRAPHS } from "@seer-pm/sdk/subgraph";
import { createClient } from "@supabase/supabase-js";
import { subDays } from "date-fns";
import { type Address, isAddress } from "viem";
import { buildPortfolioPositions } from "./utils/buildPortfolioPositions";
import { getHistoryTokensPricesForPortfolio } from "./utils/dexPoolPricesFromDb";
import { sumPortfolioValueAtReference, sumPortfolioValueCurrent } from "./utils/portfolioValuation";
import type { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

/**
 * Portfolio value + ~24h mark-to-market change — how this endpoint works (important assumptions)
 *
 * What we value (`currentPortfolioValue` / `historyPortfolioValue`)
 * - We value **outcome-token positions only** (same shape as `get-portfolio` / `get-portfolio-pl`).
 * - We intentionally **do not** include “idle” primary collateral in wallet in these totals.
 *
 * Prices
 * - Current and historical prices come from DEX subgraphs via `dexPoolPricesFromDb` and `portfolioValuation.ts`
 *   (`redeemedPrice` rules match the UI).
 *
 * Historical snapshot (`historyTimestamp`)
 * - Fixed offset: **one calendar day** before “now” via `subDays(new Date(), 1)` (unix seconds), **not** necessarily
 *   exactly `now - 86400` (DST / calendar semantics differ from `get-portfolio-pl`’s `1d` window).
 *
 * Critical difference vs `get-portfolio-pl`
 * - We use the **same current positions** for both valuations: `historyPortfolioValue` is “this **same** bag of tokens,
 *   priced at `historyTimestamp`”, and `currentPortfolioValue` is that bag at current prices.
 * - We **do not** roll back balances with `tokens_transfers`. If the user traded in the last ~24h, `delta` / `deltaPercent`
 *   are **not** period P/L on what they held at the start of the window; they answer “how would the **current**
 *   portfolio have moved purely from price between `historyTimestamp` and now?”.
 *
 * Response shape
 * - `currentPortfolioValue`, `historyPortfolioValue`, `historyTimestamp`.
 * - `delta` = `currentPortfolioValue - historyPortfolioValue`; `deltaPercent` = `delta / historyPortfolioValue` (0 if undefined/NaN).
 */

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const accountParam = url.searchParams.get("account");
    const chainId = url.searchParams.get("chainId");

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

    const positions = await buildPortfolioPositions(supabase, account, chainIdNum as SupportedChain);

    const historyTimestamp = Math.floor(subDays(new Date(), 1).getTime() / 1000);

    const historyPrices = await getHistoryTokensPricesForPortfolio(
      supabase,
      positions,
      chainIdNum as SupportedChain,
      historyTimestamp,
    );

    const currentPortfolioValue = sumPortfolioValueCurrent(positions);
    const historyPortfolioValue = sumPortfolioValueAtReference(positions, historyPrices, historyTimestamp);
    const delta = currentPortfolioValue - historyPortfolioValue;
    const ratio = delta / historyPortfolioValue;
    const deltaPercent = Number.isFinite(ratio) ? ratio * 100 : 0;

    const body = JSON.stringify({
      currentPortfolioValue,
      historyPortfolioValue,
      historyTimestamp,
      delta,
      deltaPercent,
    });

    return new Response(body, {
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

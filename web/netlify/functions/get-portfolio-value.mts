import { SUPPORTED_CHAINS } from "@/lib/chains";
import type { PortfolioPosition, SupportedChain } from "@seer-pm/sdk";
import { DEFAULT_COLLATERAL_PROFILE } from "@seer-pm/sdk/collateral";
import { createClient } from "@supabase/supabase-js";
import { type Address, isAddress } from "viem";
import { outcomePriceInputsForPositions } from "./utils/buildPortfolioPositions";
import { getDexScreenerPriceUSD } from "./utils/common";
import { getHistoryTokensPricesForPortfolio } from "./utils/dexPoolHourPrices";
import { settledPayoutRatios } from "./utils/outcomePrices";
import { parseChainIdQueryParam } from "./utils/parseChainIdParam";
import { resolvePortfolioIdentity } from "./utils/portfolioIdentity";
import { type ResolvedChain, filterPositionsByChain, loadPortfolioPositions } from "./utils/portfolioPositionsCache";
import { sumPortfolioValueAtReference, sumPortfolioValueCurrent } from "./utils/portfolioValuation";
import { parseCollateralProfileQueryParam } from "./utils/resolveCollateralParam";
import type { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

/**
 * Portfolio value + ~24h mark-to-market change — how this endpoint works (important assumptions)
 *
 * What we value (`currentPortfolioValue` / `historyPortfolioValue`)
 * - We value **outcome-token positions only** (same shape as `get-portfolio`, including Futarchy).
 *   `get-portfolio-pl` is Generic-only and is not the same bag.
 * - We intentionally **do not** include “idle” primary collateral in wallet in these totals.
 *
 * Prices
 * - Current outcome prices are read from the pools at request time (`onchainOutcomePrices`); the historical
 *   side uses hour candles (`dexPoolHourPrices`) and `portfolioValuation.ts` (`redeemedPrice` rules match the UI).
 * - Totals are converted to **USD** with `getDexScreenerPriceUSD` on the profile primary (same spot source as the
 *   PnL leaderboard). `chainId=all` sums USD across `SUPPORTED_CHAINS`.
 *
 * Historical snapshot (`historyTimestamp`)
 * - Fixed offset: **one calendar day** before “now” (unix seconds), **not** necessarily exactly `now - 86400`
 *   (DST / calendar semantics differ from `get-portfolio-pl`’s `1d` window).
 *
 * Critical difference vs `get-portfolio-pl`
 * - We use the **same current positions** for both valuations: `historyPortfolioValue` is “this **same** bag of tokens,
 *   priced at `historyTimestamp`”, and `currentPortfolioValue` is that bag at current prices.
 * - We **do not** roll back balances with `tokens_transfers`. If the user traded in the last ~24h, `delta` / `deltaPercent`
 *   are **not** period P/L on what they held at the start of the window; they answer “how would the **current**
 *   portfolio have moved purely from price between `historyTimestamp` and now?”.
 *
 * Response shape
 * - `currentPortfolioValue`, `historyPortfolioValue`, `historyTimestamp`, `unit: "USD"`.
 * - `delta` = `currentPortfolioValue - historyPortfolioValue`; `deltaPercent` = `delta / historyPortfolioValue` (0 if undefined/NaN).
 */

type ValueUsd = {
  currentPortfolioValue: number;
  historyPortfolioValue: number;
  historyTimestamp: number;
};

async function portfolioValueUsdForChain(args: {
  positions: PortfolioPosition[];
  chainId: SupportedChain;
  primaryCollateral: Address;
  historyTimestamp: number;
}): Promise<ValueUsd | null> {
  const { positions, chainId, primaryCollateral, historyTimestamp } = args;

  // The same token batch prices both ends. Handing the historical side bare positions instead would
  // price every conditional at 0 there while the current side chains it through its parent, and the
  // delta would then be the difference between two incompatible answers rather than a price move.
  const priceInputs = await outcomePriceInputsForPositions(positions, chainId);
  const historyPrices = await getHistoryTokensPricesForPortfolio(
    supabase,
    priceInputs.tokens,
    chainId,
    historyTimestamp,
    settledPayoutRatios(priceInputs.markets, historyTimestamp),
  );

  const currentNative = sumPortfolioValueCurrent(positions);
  const historyNative = sumPortfolioValueAtReference(positions, historyPrices, historyTimestamp);
  const priceUsd = await getDexScreenerPriceUSD(primaryCollateral, chainId);
  if (!(priceUsd > 0)) {
    console.warn(`get-portfolio-value: chain ${chainId} USD price is ${priceUsd} (token ${primaryCollateral})`);
    return null;
  }

  return {
    currentPortfolioValue: currentNative * priceUsd,
    historyPortfolioValue: historyNative * priceUsd,
    historyTimestamp,
  };
}

function jsonUsd(body: ValueUsd & { delta: number; deltaPercent: number }) {
  return JSON.stringify({ ...body, unit: "USD" as const });
}

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
    const chainParsed = parseChainIdQueryParam(chainId, { allowAll: true });
    if ("error" in chainParsed) {
      return new Response(JSON.stringify({ error: chainParsed.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const historyTimestamp = Math.floor(oneDayAgo.getTime() / 1000);
    const profileParam = url.searchParams.get("collateralProfile");

    if (chainParsed.chainId !== "all" && !(chainParsed.chainId in SUPPORTED_CHAINS)) {
      return new Response(JSON.stringify({ error: "Unsupported chainId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const chainIds: SupportedChain[] =
      chainParsed.chainId === "all"
        ? (Object.values(SUPPORTED_CHAINS).map((c) => c.id) as SupportedChain[])
        : [chainParsed.chainId as SupportedChain];

    const resolvedChains: (ResolvedChain & { primaryCollateral: Address })[] = [];
    for (const chainId of chainIds) {
      const collateralResolved = parseCollateralProfileQueryParam(chainId, profileParam);
      if ("error" in collateralResolved) {
        console.warn(`get-portfolio-value: skip chain ${chainId}: ${collateralResolved.error}`);
        continue;
      }
      resolvedChains.push({
        chainId,
        profileName: collateralResolved.profileName,
        primaryCollateral: collateralResolved.primaryCollateral.address,
      });
    }
    if (resolvedChains.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid collateral profile" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Resolved once for the whole fan-out rather than per chain.
    const identity = await resolvePortfolioIdentity(account);
    // The same rows `get-portfolio` serves, read from the same blob. This endpoint used to rebuild
    // them: the portfolio page calls both at once, so every balance, market and LP query was paid
    // for twice, and the value card could disagree with the positions tab it sits above.
    const positions = await loadPortfolioPositions({
      account,
      profileName: profileParam?.trim() || DEFAULT_COLLATERAL_PROFILE,
      identity,
      chains: resolvedChains,
      chainScope: chainParsed.chainId,
    });

    const parts = await Promise.all(
      resolvedChains.map(({ chainId, primaryCollateral }) =>
        portfolioValueUsdForChain({
          positions: filterPositionsByChain(positions, chainId),
          chainId,
          primaryCollateral,
          historyTimestamp,
        }),
      ),
    );
    const ok = parts.filter((p): p is ValueUsd => p != null);
    if (ok.length === 0) {
      return new Response(JSON.stringify({ error: "Unable to price portfolio collateral in USD" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentPortfolioValue = ok.reduce((s, p) => s + p.currentPortfolioValue, 0);
    const historyPortfolioValue = ok.reduce((s, p) => s + p.historyPortfolioValue, 0);
    const delta = currentPortfolioValue - historyPortfolioValue;
    const ratio = delta / historyPortfolioValue;
    const deltaPercent = Number.isFinite(ratio) ? ratio * 100 : 0;

    return new Response(
      jsonUsd({
        currentPortfolioValue,
        historyPortfolioValue,
        historyTimestamp,
        delta,
        deltaPercent,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          // Same reasoning as the other portfolio endpoints: an incomplete identity is a value
          // computed over the EOA alone, and publishing that for a minute is the pre-executor bug.
          "Cache-Control": identity.complete ? "public, max-age=60" : "no-store",
        },
      },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error)?.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

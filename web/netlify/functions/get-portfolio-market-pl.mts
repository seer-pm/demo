import { SEER_APP_ALL_ID } from "@/lib/apps";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import type { PortfolioMarketPnLResponse, PortfolioMarketPnLRow } from "@seer-pm/sdk";
import { createClient } from "@supabase/supabase-js";
import { type Address, isAddress } from "viem";
import { parseChainIdQueryParam } from "./utils/parseChainIdParam";
import { resolvePortfolioIdentity } from "./utils/portfolioIdentity";
import { PORTFOLIO_PL_PERIODS, type PortfolioPlPeriod } from "./utils/seerIndexerPortfolio";
import type { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

/** Supabase caps a single select at 1000 rows, so a wallet with more market rows is read in pages. */
const PAGE_SIZE = 1000;

/**
 * Per-market P/L and traded volume for one portfolio, read from `pnl_market_leaderboard`.
 *
 * The rows are the same materialization the market leaderboard reads, keyed the other way round:
 * every market the account's wallet set touched in `period`, one row per (chain, market, wallet).
 * Executor wallets are not rolled up into the owner: the Positions table lists executor holdings
 * as their own rows, so the client matches on the triple and keeps the figures per wallet.
 *
 * `pnl` and `volume` are native collateral of the row's chain; the USD fields use the spot price
 * at refresh time. `marketId` is the child market on conditional markets, as the positions are.
 *
 * `computed` comes from `pnl_leaderboard`, not from the presence of market rows: all-zero buckets
 * are never written, so an empty market set is also what a wallet that only ever split and merged
 * looks like. Only a missing wallet-level row says the refresh job has not reached the account.
 */

type MarketRow = Pick<
  Database["public"]["Tables"]["pnl_market_leaderboard"]["Row"],
  | "address"
  | "chain_id"
  | "market_id"
  | "pnl"
  | "pnl_usd"
  | "volume"
  | "volume_usd"
  | "capital_deployed"
  | "collateral_price_usd"
  | "traded"
  | "updated_at"
>;

function json(body: unknown, status: number, cacheControl?: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(cacheControl ? { "Cache-Control": cacheControl } : {}),
    },
  });
}

async function readMarketRows(wallets: Address[], chainId: number | "all", period: PortfolioPlPeriod) {
  const rows: MarketRow[] = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    let query = supabase
      .from("pnl_market_leaderboard")
      .select(
        "address, chain_id, market_id, pnl, pnl_usd, volume, volume_usd, capital_deployed, collateral_price_usd, traded, updated_at",
      )
      .in("address", wallets)
      .eq("period", period);
    if (chainId !== "all") {
      query = query.eq("chain_id", chainId);
    }
    // `range()` needs a total order, or a page boundary inside a tie group can drop or repeat a row.
    const { data, error } = await query
      .order("chain_id", { ascending: true })
      .order("address", { ascending: true })
      .order("market_id", { ascending: true })
      .range(start, start + PAGE_SIZE - 1);
    if (error) {
      throw new Error(`pnl_market_leaderboard read failed: ${error.message}`);
    }
    const page = (data ?? []) as MarketRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

async function hasWalletLevelRow(wallets: Address[], chainId: number | "all", period: PortfolioPlPeriod) {
  let query = supabase
    .from("pnl_leaderboard")
    .select("address")
    .eq("app_id", SEER_APP_ALL_ID)
    .in("address", wallets)
    .eq("period", period);
  if (chainId !== "all") {
    query = query.eq("chain_id", chainId);
  }
  const { data, error } = await query.limit(1);
  if (error) {
    throw new Error(`pnl_leaderboard read failed: ${error.message}`);
  }
  return (data?.length ?? 0) > 0;
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const accountParam = url.searchParams.get("account");
  const period = (url.searchParams.get("period") ?? "all").toLowerCase() as PortfolioPlPeriod;

  if (!accountParam || !isAddress(accountParam)) {
    return json({ error: "Account parameter is required" }, 400);
  }
  const account = accountParam as Address;
  if (!PORTFOLIO_PL_PERIODS.includes(period)) {
    return json({ error: `period must be one of: ${PORTFOLIO_PL_PERIODS.join(", ")}` }, 400);
  }
  const chainParsed = parseChainIdQueryParam(url.searchParams.get("chainId"), { allowAll: true });
  if ("error" in chainParsed) {
    return json({ error: chainParsed.error }, 400);
  }
  if (chainParsed.chainId !== "all" && !(chainParsed.chainId in SUPPORTED_CHAINS)) {
    return json({ error: "Unsupported chainId" }, 400);
  }

  try {
    const identity = await resolvePortfolioIdentity(account);
    const [computed, marketRows] = await Promise.all([
      hasWalletLevelRow(identity.wallets, chainParsed.chainId, period),
      readMarketRows(identity.wallets, chainParsed.chainId, period),
    ]);

    const rows: PortfolioMarketPnLRow[] = marketRows.map((row) => ({
      chainId: row.chain_id,
      marketId: row.market_id as Address,
      address: row.address as Address,
      pnl: Number(row.pnl) || 0,
      pnlUsd: Number(row.pnl_usd) || 0,
      volume: Number(row.volume) || 0,
      volumeUsd: Number(row.volume_usd) || 0,
      capitalDeployed: Number(row.capital_deployed) || 0,
      collateralPriceUsd: Number(row.collateral_price_usd) || 0,
      traded: Boolean(row.traded),
      updatedAt: row.updated_at,
    }));

    const body: PortfolioMarketPnLResponse = { period, computed, rows };
    // An incomplete identity narrows the wallet set to the EOA, so executor rows would be missing
    // for a minute if that answer were cached.
    return json(body, 200, identity.complete ? "public, max-age=60" : "no-store");
  } catch (error) {
    console.error("get-portfolio-market-pl failed", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500, "no-store");
  }
};

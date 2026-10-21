import { SEER_APP_ALL_ID } from "@/lib/apps";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import type { PortfolioCostBasisResponse, PortfolioCostBasisRow } from "@seer-pm/sdk";
import { createClient } from "@supabase/supabase-js";
import { type Address, isAddress } from "viem";
import { parseChainIdQueryParam } from "./utils/parseChainIdParam";
import { resolvePortfolioIdentity } from "./utils/portfolioIdentity";
import type { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const PAGE_SIZE = 1000;

/**
 * Cost basis per outcome token for one portfolio, read from `pnl_token_basis`.
 *
 * One row per (chain, token, wallet) over the account's wallet set, so the Positions table matches
 * each of its rows (which are per source wallet) on that triple. Costs are native collateral of
 * the row's chain. `computed` says whether the refresh job has reached the account at all, read
 * from `pnl_leaderboard` like the P/L endpoints: basis rows are sparse, so none at all is also
 * what a wallet with no history looks like.
 */

type BasisRow = Database["public"]["Tables"]["pnl_token_basis"]["Row"];

function json(body: unknown, status: number, cacheControl?: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...(cacheControl ? { "Cache-Control": cacheControl } : {}) },
  });
}

async function readBasisRows(wallets: Address[], chainId: number | "all") {
  const rows: BasisRow[] = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    let query = supabase.from("pnl_token_basis").select("*").in("address", wallets);
    if (chainId !== "all") query = query.eq("chain_id", chainId);
    const { data, error } = await query
      .order("chain_id", { ascending: true })
      .order("address", { ascending: true })
      .order("token_id", { ascending: true })
      .range(start, start + PAGE_SIZE - 1);
    if (error) throw new Error(`pnl_token_basis read failed: ${error.message}`);
    const page = (data ?? []) as BasisRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

async function hasWalletLevelRow(wallets: Address[], chainId: number | "all") {
  let query = supabase
    .from("pnl_leaderboard")
    .select("address")
    .eq("app_id", SEER_APP_ALL_ID)
    .in("address", wallets)
    .eq("period", "all");
  if (chainId !== "all") query = query.eq("chain_id", chainId);
  const { data, error } = await query.limit(1);
  if (error) throw new Error(`pnl_leaderboard read failed: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const accountParam = url.searchParams.get("account");
  if (!accountParam || !isAddress(accountParam)) {
    return json({ error: "Account parameter is required" }, 400);
  }
  const account = accountParam as Address;
  const chainParsed = parseChainIdQueryParam(url.searchParams.get("chainId"), { allowAll: true });
  if ("error" in chainParsed) return json({ error: chainParsed.error }, 400);
  if (chainParsed.chainId !== "all" && !(chainParsed.chainId in SUPPORTED_CHAINS)) {
    return json({ error: "Unsupported chainId" }, 400);
  }

  try {
    const identity = await resolvePortfolioIdentity(account);
    const [computed, basisRows] = await Promise.all([
      hasWalletLevelRow(identity.wallets, chainParsed.chainId),
      readBasisRows(identity.wallets, chainParsed.chainId),
    ]);
    const rows: PortfolioCostBasisRow[] = basisRows.map((row) => ({
      chainId: row.chain_id,
      address: row.address as Address,
      tokenId: row.token_id as Address,
      marketId: row.market_id as Address,
      tokenIndex: row.token_index,
      quantity: Number(row.quantity) || 0,
      cost: Number(row.cost) || 0,
      averageCost: row.average_cost === null ? undefined : Number(row.average_cost),
      realized: Number(row.realized) || 0,
      totalBought: Number(row.total_bought) || 0,
      totalSold: Number(row.total_sold) || 0,
      lpTouched: Boolean(row.lp_touched),
      approximate: Boolean(row.approximate),
      evenSplit: Boolean(row.even_split),
      lastEventAt: row.last_event_at === null ? undefined : Number(row.last_event_at),
      updatedAt: row.updated_at,
    }));
    const body: PortfolioCostBasisResponse = { computed, rows };
    return json(body, 200, identity.complete ? "public, max-age=60" : "no-store");
  } catch (error) {
    console.error("get-portfolio-cost-basis failed", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500, "no-store");
  }
};

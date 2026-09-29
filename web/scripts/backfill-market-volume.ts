/**
 * Fills `markets.volume_usd` (cash) and `markets.volume_notional_usd` (notional) for every market of
 * one chain, closed markets included.
 *
 * WHY THIS EXISTS: `batch-odds-background` computes the same two figures on its 5-minute rotation,
 * but it skips markets finalized more than two days ago, so a market that closed before the columns
 * existed never gets them. Run this once per chain after applying `supabase/sql/markets_volume.sql`,
 * and again whenever the valuation rules in `utils/getMarketsLiquidity.ts` change.
 *
 * It writes the two volume columns and nothing else: odds, liquidity and `odds_run_timestamp` of a
 * closed market stay as they were when it closed. Markets whose pools could not be fetched are
 * skipped rather than zeroed.
 *
 * A whole chain goes through one `getMarketsLiquidity` call because a child market is priced through
 * its parent's pools, which have to be in the same batch.
 *
 * Usage (from the `web/` directory, so tsconfig `paths` resolve):
 *   npx tsx --env-file=.env.local scripts/backfill-market-volume.ts --chain 100 --dry-run
 *   npx tsx --env-file=.env.local scripts/backfill-market-volume.ts --chain 100
 *
 * Options:
 *   --chain <id>   Required. One chain per run: pool balances are read on-chain in multicall batches,
 *                  and a failed batch retries the whole list at a smaller size, so chains stay apart.
 *   --dry-run      Print the chain totals and the top markets without writing.
 *   --top <n>      How many markets to print. Default 15.
 * Env: SUPABASE_PROJECT_URL, SUPABASE_API_KEY (service_role) and the RPC / subgraph variables the
 * Netlify functions use.
 */
import type { SupportedChain } from "@seer-pm/sdk";
import type { Market } from "@seer-pm/sdk/market-types";
import { createClient } from "@supabase/supabase-js";
// Imported for its side effects (initApiHost + configurePublicRpcUrls) before anything talks to a
// subgraph proxy or an RPC, so keep it above the modules that do.
import { chainIds } from "../netlify/functions/utils/config.ts";
import { getAllMarketPools } from "../netlify/functions/utils/fetchPools.ts";
import { getMarketsLiquidity } from "../netlify/functions/utils/getMarketsLiquidity.ts";
import {
  type LegacySubgraphMarket,
  MARKET_DB_FIELDS,
  mapGraphMarketFromDbResult,
} from "../netlify/functions/utils/markets.ts";
import type { Database } from "../netlify/functions/utils/supabase.ts";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

/** PostgREST caps a plain select at 1000 rows; a chain holds a few thousand markets. */
const SELECT_PAGE_SIZE = 1000;
/** Same chunking the scheduled import uses, for the same PostgREST request-size reason. */
const UPSERT_CHUNK_SIZE = 250;

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  return idx === -1 ? undefined : process.argv[idx + 1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

/**
 * Every market of the chain, straight from the `markets` table paginated by id. The `markets_search`
 * view with an exact count and its default multi-column sort times out on the larger chains.
 */
async function loadChainMarkets(chainId: SupportedChain): Promise<Market[]> {
  const markets: Market[] = [];
  for (let from = 0; ; from += SELECT_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("markets")
      .select(MARKET_DB_FIELDS)
      .eq("chain_id", chainId)
      .not("subgraph_data", "is", null)
      .order("id", { ascending: true })
      .range(from, from + SELECT_PAGE_SIZE - 1);
    if (error) throw new Error(`markets page at ${from}: ${error.message}`);
    if (!data?.length) break;
    for (const row of data) {
      try {
        markets.push(mapGraphMarketFromDbResult(row.subgraph_data as LegacySubgraphMarket, row));
      } catch (e) {
        console.warn(`skipping malformed row ${row.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    if (data.length < SELECT_PAGE_SIZE) break;
  }
  return markets;
}

function usd(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

async function main() {
  const chainId = Number(getArg("--chain")) as SupportedChain;
  if (!chainIds.includes(chainId)) {
    throw new Error(`--chain is required and must be one of ${chainIds.join(", ")}`);
  }
  const dryRun = hasFlag("--dry-run");
  const top = Number(getArg("--top") ?? 15);

  console.log(`chain ${chainId}: loading markets...`);
  const markets = await loadChainMarkets(chainId);
  console.log(`chain ${chainId}: ${markets.length} markets, fetching pools...`);

  const pools = await getAllMarketPools(markets);
  if (pools.length === 0) {
    throw new Error(`chain ${chainId}: no pool came back, refusing to write zeros`);
  }
  const marketsWithPools = new Set(pools.map((pool) => pool.market.id));
  console.log(`chain ${chainId}: ${pools.length} pools over ${marketsWithPools.size} markets, pricing...`);

  const mapping = await getMarketsLiquidity(markets, pools);

  const rows = markets
    .filter((market) => marketsWithPools.has(market.id))
    .map((market) => ({
      id: market.id,
      chain_id: market.chainId,
      volume_usd: mapping[market.id]?.volumeUSD ?? 0,
      volume_notional_usd: mapping[market.id]?.volumeNotionalUSD ?? 0,
      updated_at: new Date().toISOString(),
    }));

  const totalCash = rows.reduce((sum, row) => sum + row.volume_usd, 0);
  const totalNotional = rows.reduce((sum, row) => sum + row.volume_notional_usd, 0);
  const priced = rows.filter((row) => row.volume_usd > 0).length;
  console.log(
    `chain ${chainId}: ${rows.length} markets with pools, ${priced} with volume, ` +
      `cash $${usd(totalCash)}, notional $${usd(totalNotional)}`,
  );

  const names = new Map(markets.map((market) => [market.id, market.marketName]));
  for (const row of [...rows].sort((a, b) => b.volume_usd - a.volume_usd).slice(0, top)) {
    console.log(`  $${usd(row.volume_usd).padStart(12)}  $${usd(row.volume_notional_usd).padStart(12)}  ${names.get(row.id)}`);
  }

  if (dryRun) {
    console.log("dry run, nothing written");
    return;
  }

  for (let i = 0; i < rows.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK_SIZE);
    const { error } = await supabase.from("markets").upsert(chunk);
    if (error) throw new Error(`upsert at ${i}: ${error.message}`);
  }
  console.log(`chain ${chainId}: wrote ${rows.length} markets`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

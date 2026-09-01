import { createClient } from "@supabase/supabase-js";
import { startOfWeek } from "date-fns";
import { gnosis, mainnet } from "viem/chains";
import { Database } from "./utils/supabase";
import { withRetry } from "./utils/withRetry";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const SEER_PER_DAY = 200000000 / 30;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

interface AirdropTotals {
  outcomeTokenHoldingAllocation: number;
  pohUserAllocation: number;
  totalAllocation: number;
  currentWeekAllocation: number;
  monthlyEstimate: number;
  monthlyEstimatePoH: number;
}

/**
 * Aggregate the user's whole airdrop history in Postgres and return a single row.
 * The RPC returns raw sums rather than SEER amounts so that SEER_PER_DAY and the 0.25
 * factor stay defined only here and the two implementations can't drift.
 */
async function getTotalsFromRpc(address: string, weekStart: Date): Promise<AirdropTotals> {
  const { data, error } = await supabase
    .rpc("get_airdrop_summary_by_user", { p_address: address, p_week_start: weekStart.toISOString() })
    .single();
  if (error) throw error;

  return {
    outcomeTokenHoldingAllocation: SEER_PER_DAY * data.sum_share_of_holding * 0.25,
    pohUserAllocation: SEER_PER_DAY * data.sum_share_of_holding_poh * 0.25,
    totalAllocation: data.total_seer_tokens,
    currentWeekAllocation: data.current_week_seer_tokens,
    monthlyEstimate: SEER_PER_DAY * 30 * data.last_share_of_holding * 0.25,
    monthlyEstimatePoH: SEER_PER_DAY * 30 * data.last_share_of_holding_poh * 0.25,
  };
}

/**
 * Fallback for when get_airdrop_summary_by_user hasn't been applied to the database yet
 * (the SQL in supabase/sql/ is applied by hand). Scans the user's rows and aggregates in
 * Node, as this endpoint did originally.
 */
async function getTotalsFromRows(address: string, weekStart: Date): Promise<AirdropTotals> {
  // Paged explicitly: PostgREST caps a response independently of the requested range (observed at
  // 1000 rows), and this table holds one row per user per snapshot day since the Oct 2024 genesis.
  // An unpaged select silently truncated once a wallet passed the cap, quietly understating totals.
  const PAGE_SIZE = 1000;
  const rows: {
    timestamp: string;
    share_of_holding: number;
    share_of_holding_poh: number;
    seer_tokens_count: number;
  }[] = [];
  for (let offset = 0; ; ) {
    const { data, error } = await supabase
      .from("airdrops")
      .select("timestamp,share_of_holding,share_of_holding_poh,seer_tokens_count")
      .eq("address", address)
      .order("timestamp", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = data ?? [];
    if (page.length === 0) {
      break;
    }
    rows.push(...page);
    offset += page.length;
  }
  let outcomeTokenHoldingAllocation = 0;
  let pohUserAllocation = 0;
  let totalAllocation = 0;
  let currentWeekAllocation = 0;
  for (const row of rows) {
    outcomeTokenHoldingAllocation += SEER_PER_DAY * row.share_of_holding * 0.25;
    pohUserAllocation += SEER_PER_DAY * row.share_of_holding_poh * 0.25;
    totalAllocation += row.seer_tokens_count;
    if (new Date(row.timestamp) >= weekStart) {
      currentWeekAllocation += row.seer_tokens_count;
    }
  }

  // latest share of holdings drives the monthly estimates
  const { share_of_holding = 0, share_of_holding_poh = 0 } = rows[rows.length - 1] ?? {};

  return {
    outcomeTokenHoldingAllocation,
    pohUserAllocation,
    totalAllocation,
    currentWeekAllocation,
    monthlyEstimate: SEER_PER_DAY * 30 * share_of_holding * 0.25,
    monthlyEstimatePoH: SEER_PER_DAY * 30 * share_of_holding_poh * 0.25,
  };
}

async function getTotals(address: string, weekStart: Date): Promise<AirdropTotals> {
  try {
    return await withRetry(() => getTotalsFromRpc(address, weekStart), "airdrops.summary");
  } catch (error) {
    // biome-ignore lint/suspicious/noExplicitAny: error shape varies (PostgREST / fetch)
    if ((error as any)?.code !== "PGRST202") {
      throw error;
    }
    console.log("get_airdrop_summary_by_user not found, falling back to row scan");
    return await withRetry(() => getTotalsFromRows(address, weekStart), "airdrops.byUser");
  }
}

async function getSerLppBalances(address: string) {
  const { data, error } = await supabase.from("ser_lpp_balances").select("chain_id,balance").eq("address", address);
  if (error) throw error;
  return data ?? [];
}

export default async (req: Request) => {
  const body = await req.json().catch(() => undefined);

  if (!body) {
    return json({ error: "Missing request body" }, 400);
  }

  if (!body.address) {
    return json({ error: "Missing required parameters: address" }, 400);
  }

  const address = body.address.toLowerCase();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  try {
    const [totals, serLppBalances] = await Promise.all([
      getTotals(address, weekStart),
      withRetry(() => getSerLppBalances(address), "serLppBalances.byUser"),
    ]);

    return json(
      {
        ...totals,
        serLppMainnet: serLppBalances.find((x) => x.chain_id === mainnet.id)?.balance ?? 0,
        serLppGnosis: serLppBalances.find((x) => x.chain_id === gnosis.id)?.balance ?? 0,
      },
      200,
    );
  } catch (error) {
    // biome-ignore lint/suspicious/noExplicitAny: error shape varies (PostgREST / fetch)
    const err = error as any;
    // full detail stays server side; the client gets a message safe to render
    console.error("get-airdrop-data-by-user failed", { address, code: err?.code, message: err?.message });
    const isTimeout = err?.code === "57014" || /timeout/i.test(err?.message ?? "");
    return json(
      {
        error: isTimeout
          ? "Airdrop data is taking longer than usual to load. Please try again in a moment."
          : "Could not load airdrop data. Please try again.",
        code: isTimeout ? "TIMEOUT" : "UNKNOWN",
      },
      isTimeout ? 503 : 500,
    );
  }
};

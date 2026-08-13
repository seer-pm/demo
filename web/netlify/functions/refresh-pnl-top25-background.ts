import { SEER_APP_ALL_ID } from "@/lib/apps";
import { createClient } from "@supabase/supabase-js";
import { type LeaderboardCandidate, refreshPnlLeaderboardForAppChain } from "./utils/pnlLeaderboard";
import type { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const CHAIN_ID = 100;
const TOP_N = 25;
/** Local invoke can exceed Netlify's ~15m production background cap. */
const BUDGET_MS = 6 * 60 * 60 * 1000;

/**
 * TEMP: recompute Generic PNL for the current top 25 of the public leaderboard
 * (`app=all`, Gnosis, `period=all`). Invoke with Netlify so Blobs (CoW cache) is configured:
 *
 *   netlify functions:invoke refresh-pnl-top25-background
 *
 * Do not commit.
 */
export default async () => {
  const { data, error } = await supabase
    .from("pnl_leaderboard")
    .select("address")
    .eq("app_id", SEER_APP_ALL_ID)
    .eq("chain_id", CHAIN_ID)
    .eq("period", "all")
    .order("pnl_usd", { ascending: false })
    .order("address", { ascending: true })
    .limit(TOP_N);
  if (error) {
    throw new Error(`refresh-pnl-top25: leaderboard lookup failed: ${error.message}`);
  }

  const candidates: LeaderboardCandidate[] = (data ?? [])
    .map((row) => (row.address ?? "").toLowerCase())
    .filter((address) => address && address !== "0x0000000000000000000000000000000000000000")
    .map((address) => ({ address }));

  console.log(`TEMP: refresh-pnl-top25 wallets=${candidates.length} first=${candidates[0]?.address ?? "none"}`);

  const result = await refreshPnlLeaderboardForAppChain(supabase, SEER_APP_ALL_ID, CHAIN_ID, undefined, {
    deadlineMs: Date.now() + BUDGET_MS,
    candidates,
  });
  console.log("TEMP: refresh-pnl-top25 done", result);
};

import { createClient } from "@supabase/supabase-js";
import { startOfWeek } from "date-fns";
import { gnosis, mainnet } from "viem/chains";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const SEER_PER_DAY = 200000000 / 30;

export default async (req: Request) => {
  const body = await req.json();

  if (!body) {
    return new Response(JSON.stringify({ error: "Missing request body" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  if (!body.address) {
    return new Response(JSON.stringify({ error: "Missing required parameters: address" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const { data, error } = await supabase.from("airdrops").select("*").eq("address", body.address.toLowerCase());
  const { data: serLppBalances, error: errorBalances } = await supabase
    .from("ser_lpp_balances")
    .select("*")
    .eq("address", body.address.toLowerCase());

  if (error || errorBalances) {
    return new Response(JSON.stringify({ error: error?.message || errorBalances?.message }), { status: 500 });
  }
  const outcomeTokenHoldingAllocation = data.reduce(
    (acc, curr) => acc + SEER_PER_DAY * curr.share_of_holding * 0.25,
    0,
  );
  const pohUserAllocation = data.reduce((acc, curr) => acc + SEER_PER_DAY * curr.share_of_holding_poh * 0.25, 0);
  const totalAllocation = data.reduce((acc, curr) => acc + curr.seer_tokens_count, 0);
  const today = new Date();
  const currentWeekAllocation = data.reduce((acc, curr) => {
    if (new Date(curr.timestamp) >= startOfWeek(today, { weekStartsOn: 1 })) {
      return acc + curr.seer_tokens_count;
    }
    return acc;
  }, 0);
  const serLppMainnet = serLppBalances.find((x) => x.chain_id === mainnet.id)?.balance ?? 0;
  const serLppGnosis = serLppBalances.find((x) => x.chain_id === gnosis.id)?.balance ?? 0;
  return new Response(
    JSON.stringify({
      outcomeTokenHoldingAllocation,
      pohUserAllocation,
      totalAllocation,
      currentWeekAllocation,
      serLppMainnet,
      serLppGnosis,
    }),
    { status: 200 },
  );
};

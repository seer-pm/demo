import { SER_LPP } from "@seer-pm/rewards/claims";
import type { SupportedChain } from "@seer-pm/sdk";
import { createClient } from "@supabase/supabase-js";
import { formatUnits } from "viem";
import type { Database } from "./utils/supabase";
import { getTokenHolders } from "./utils/token-transactions";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

async function getSerLppBalances(chainId: SupportedChain): Promise<{ address: string; balance: number }[]> {
  const serLpp = SER_LPP[chainId];
  if (!serLpp) {
    throw new Error("Invalid SER_LPP chain");
  }

  const byToken = await getTokenHolders(supabase, Number(chainId), [serLpp]);
  const holders = byToken[serLpp.toLowerCase()] ?? [];

  return holders.map((h) => ({
    address: h.address.toLowerCase(),
    balance: Number(formatUnits(BigInt(h.balance), 18)),
  }));
}

export default async () => {
  console.time("get and write");
  const chainIds = Object.keys(SER_LPP).map(Number) as SupportedChain[];
  const balancesByChain = await Promise.all(chainIds.map((chainId) => getSerLppBalances(chainId)));
  const upsertData = chainIds.flatMap((chainId, i) =>
    balancesByChain[i].map(({ address, balance }) => ({
      id: `${address}-${chainId}`,
      address,
      balance,
      chain_id: chainId,
    })),
  );
  const { error } = await supabase.from("ser_lpp_balances").upsert(upsertData);
  console.log(error);
  console.timeEnd("get and write");
};

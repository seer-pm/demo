import type { SupportedChain } from "@seer-pm/sdk";
import { createClient } from "@supabase/supabase-js";
import { formatUnits } from "viem";
import { gnosis, mainnet } from "viem/chains";
import { SER_LPP } from "./utils/airdropCalculation/constants";
import type { Database } from "./utils/supabase";
import { getTokenHolders } from "./utils/token-transactions";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

async function getSerLppBalances(chainId: SupportedChain): Promise<{ address: string; balance: number }[]> {
  const serLpp = SER_LPP[chainId as keyof typeof SER_LPP];
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
  const [serLppBalancesGnosis, serLppBalancesMainnet] = await Promise.all([
    getSerLppBalances(gnosis.id),
    getSerLppBalances(mainnet.id),
  ]);
  const upsertData = [
    ...serLppBalancesGnosis.map(({ address, balance }) => ({
      id: `${address}-${gnosis.id}`,
      address,
      balance,
      chain_id: gnosis.id,
    })),
    ...serLppBalancesMainnet.map(({ address, balance }) => ({
      id: `${address}-${mainnet.id}`,
      address,
      balance,
      chain_id: mainnet.id,
    })),
  ];
  const { error } = await supabase.from("ser_lpp_balances").upsert(upsertData);
  console.log(error);
  console.timeEnd("get and write");
};

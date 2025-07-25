import { createClient } from "@supabase/supabase-js";
import { gnosis, mainnet } from "viem/chains";
import { getSerLppBalances } from "./utils/airdropCalculation/getSerLppBalances";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

export default async () => {
  console.time("get and write");
  const [serLppBalancesGnosis, serLppBalancesMainnet] = await Promise.all([
    getSerLppBalances(gnosis.id),
    getSerLppBalances(mainnet.id),
  ]);
  const upsertData = [
    ...Object.entries(serLppBalancesGnosis).map(([address, balance]) => ({
      id: `${address}-${gnosis.id}`,
      address,
      balance,
      chain_id: gnosis.id,
    })),
    ...Object.entries(serLppBalancesMainnet).map(([address, balance]) => ({
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

import { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { simulateContract, writeContract } from "@wagmi/core";
import { Address, privateKeyToAccount } from "viem/accounts";
import { config as wagmiConfig } from "./utils/config.ts";
import { Database } from "./utils/supabase.ts";

const supabase = createClient<Database>(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

export default async () => {
  const chainId = 100;
  const now = Math.round(new Date().getTime() / 1000);

  const { data: markets, error } = await supabase
    .from("markets")
    .select("id,subgraph_data->marketName,subgraph_data->payoutReported,subgraph_data->finalizeTs")
    .eq("chain_id", chainId)
    .not("subgraph_data", "is", null)
    .eq("subgraph_data->payoutReported::boolean", false)
    .lt("subgraph_data->>finalizeTs::bigint", now);

  if (error) {
    console.error("Error fetching markets:", error);
    return;
  }

  if (!markets || markets.length === 0) {
    console.log("No results found");
    return;
  }

  const privateKey = process.env.LIQUIDITY_ACCOUNT_PRIVATE_KEY!;

  const account = privateKeyToAccount((privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Address);

  const result = [];
  for (const market of markets) {
    try {
      const simulation = await simulateContract(wagmiConfig, {
        account,
        address: market.id as `0x${string}`,
        functionName: "resolve",
        chainId,
        abi: [
          {
            inputs: [],
            name: "resolve",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
      });

      const res = await writeContract(wagmiConfig, simulation.request);
      result.push({ status: "fulfilled", value: res });
    } catch (error) {
      // TODO: probably the question is answered too soon, we should fix it on the subgraph
      result.push({ status: "rejected", reason: error });
    }

    // Wait 1 second before next call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  console.log(result);
};

export const config: Config = {
  schedule: "*/15 * * * *",
};

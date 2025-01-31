import { Config } from "@netlify/functions";
import { simulateContract, writeContract } from "@wagmi/core";
import { Address, privateKeyToAccount } from "viem/accounts";
import { config as wagmiConfig } from "./utils/config.ts";
import { SUBGRAPHS } from "./utils/subgraph.ts";

export default async () => {
  const chainId = 100;
  const now = Math.round(new Date().getTime() / 1000);

  const response = await fetch(SUBGRAPHS.seer[chainId]!, {
    method: "POST",
    body: JSON.stringify({
      query: `{
        markets(where: {payoutReported: false, finalizeTs_lt: ${now}}) {
          id
          marketName 
          finalizeTs
        }
      }`,
    }),
  });
  const {
    data: { markets },
  } = await response.json();

  if (!markets) {
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
        address: market.id,
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
  schedule: "*/5 * * * *",
};

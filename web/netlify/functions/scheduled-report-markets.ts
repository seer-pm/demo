import { Config } from "@netlify/functions";
import { writeContract } from "@wagmi/core";
import { Address, privateKeyToAccount } from "viem/accounts";
import { config as wagmiConfig } from "./utils/config.ts";
import { SEER_SUBGRAPH_URLS } from "./utils/constants.ts";

require("dotenv").config();

export const handler = async () => {
  const chainId = 100;
  const now = Math.round(new Date().getTime() / 1000);

  const response = await fetch(SEER_SUBGRAPH_URLS[chainId]!, {
    method: "POST",
    body: JSON.stringify({
      query: `{
        markets(first: 1, where: {payoutReported: false, finalizeTs_lt: ${now}}) {
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

  const result = await Promise.allSettled(
    markets.map(async (market) =>
      writeContract(wagmiConfig, {
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
      }),
    ),
  );

  return {
    statusCode: 200,
    result: result,
  };
};

export const config: Config = {
  schedule: "*/5 * * * *",
};

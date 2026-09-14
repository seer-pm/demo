import type { Config } from "@netlify/functions";
import type { SupportedChain } from "@seer-pm/sdk";
import { createClient } from "@supabase/supabase-js";
import { BaseError, InsufficientFundsError } from "viem";
import { type Address, type PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";
import { simulateContract, writeContract } from "viem/actions";
import { sepolia } from "viem/chains";
import { chainIds, getPublicClientByChainId, getWalletClientForNetwork } from "./utils/config.ts";
import type { Database } from "./utils/supabase.ts";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const RESOLVE_ABI = [
  {
    inputs: [],
    name: "resolve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

async function reportChainMarkets(chainId: SupportedChain, account: PrivateKeyAccount, now: number) {
  const { data: markets, error } = await supabase
    .from("markets")
    .select("id,subgraph_data->marketName,subgraph_data->payoutReported,subgraph_data->finalizeTs")
    .eq("chain_id", chainId)
    .not("subgraph_data", "is", null)
    .eq("subgraph_data->payoutReported::boolean", false)
    .lt("subgraph_data->>finalizeTs::bigint", now);

  if (error) {
    console.error(`scheduled-report-markets: chain ${chainId} query failed:`, error);
    return;
  }

  if (!markets || markets.length === 0) {
    console.log(`scheduled-report-markets: chain ${chainId} has no markets to report`);
    return;
  }

  const publicClient = getPublicClientByChainId(chainId);
  const walletClient = getWalletClientForNetwork(account, chainId);

  const reported: string[] = [];
  const skipped: string[] = [];
  for (const market of markets) {
    try {
      const simulation = await simulateContract(publicClient, {
        account,
        address: market.id as `0x${string}`,
        functionName: "resolve",
        abi: RESOLVE_ABI,
      });

      reported.push(await writeContract(walletClient, simulation.request));
    } catch (error) {
      if (error instanceof BaseError && error.walk((e) => e instanceof InsufficientFundsError)) {
        // Every remaining market on this chain would fail the same way; don't burn the run's time budget.
        console.error(`scheduled-report-markets: chain ${chainId} account has no gas, skipping remaining markets`);
        break;
      }
      // Usually "payout denominator already set" (the indexer hasn't caught up with an already
      // reported payout) or a question answered too soon.
      skipped.push(`${market.id}: ${(error as Error).message.split("\n")[0]}`);
    }

    // Wait 1 second before next call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`scheduled-report-markets: chain ${chainId} reported ${reported.length}/${markets.length}`, {
    reported,
    skipped,
  });
}

export default async () => {
  const now = Math.round(new Date().getTime() / 1000);
  const privateKey = process.env.LIQUIDITY_ACCOUNT_PRIVATE_KEY!;
  const account = privateKeyToAccount((privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Address);

  // Run chains sequentially so one chain's RPC problems can't starve the others of run time.
  for (const chainId of chainIds.filter((chainId) => chainId !== sepolia.id)) {
    try {
      await reportChainMarkets(chainId, account, now);
    } catch (error) {
      console.error(`scheduled-report-markets: chain ${chainId} failed:`, error);
    }
  }
};

export const config: Config = {
  schedule: "*/15 * * * *",
};

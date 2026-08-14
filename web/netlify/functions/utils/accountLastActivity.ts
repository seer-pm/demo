import { SUPPORTED_CHAINS } from "@/lib/chains";
import type { SupportedChain } from "@seer-pm/sdk";
import type { Address } from "viem";
import { fetchAccountActivities } from "./seerIndexerPortfolio";

export function supportedChainIds(): SupportedChain[] {
  return Object.values(SUPPORTED_CHAINS).map((c) => c.id as SupportedChain);
}

/** Max HyperIndex `AccountActivity.lastTransferTimestamp` across chains (0 if none). */
export async function fetchLastActivityTimestamp(account: Address): Promise<number> {
  const rows = await fetchAccountActivities(account);
  let max = 0;
  for (const row of rows) {
    if (row.lastTransferTimestamp > max) {
      max = row.lastTransferTimestamp;
    }
  }
  return max;
}

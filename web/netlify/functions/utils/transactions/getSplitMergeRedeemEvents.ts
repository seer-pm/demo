import type { SupportedChain } from "@seer-pm/sdk";
import { unescapeJson } from "@seer-pm/sdk/market";
import { graphQLClient } from "@seer-pm/sdk/subgraph";
import { ConditionalEvent_OrderBy, OrderDirection, getSdk as getSeerSdk } from "@seer-pm/sdk/subgraph/seer";
import type { Address } from "viem";
import type { TransactionData } from "../portfolio";

export async function getSplitMergeRedeemEvents(account: string, chainId: SupportedChain): Promise<TransactionData[]> {
  const client = graphQLClient(chainId);

  if (!client) {
    throw new Error("Subgraph not available");
  }
  const data = await getSeerSdk(client).GetConditionalEvents({
    first: 1000,
    orderBy: ConditionalEvent_OrderBy.BlockNumber,
    orderDirection: OrderDirection.Desc,
    where: {
      accountId: account.toLowerCase() as Address,
    },
  });
  return data.conditionalEvents.map((d) => ({
    marketName: unescapeJson(d.market.marketName),
    marketId: d.market.id,
    [d.type === "redeem" ? "payout" : "amount"]: d.amount,
    type: d.type as "split" | "merge" | "redeem",
    blockNumber: Number(d.blockNumber),
    collateral: d.collateral,
    transactionHash: d.transactionHash,
    timestamp: Number(d.timestamp),
  }));
}

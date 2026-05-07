import type { SupportedChain } from "@seer-pm/sdk";
import { unescapeJson } from "@seer-pm/sdk/market";
import { graphQLClient } from "@seer-pm/sdk/subgraph";
import { ConditionalEvent_Select_Column, Order_By, getSdk as getSeerSdk } from "@seer-pm/sdk/subgraph/seer";
import type { Address } from "viem";
import type { TransactionData } from "../portfolio";

export async function getSplitMergeRedeemEvents(account: string, chainId: SupportedChain): Promise<TransactionData[]> {
  const client = graphQLClient(chainId);

  if (!client) {
    throw new Error("Subgraph not available");
  }
  const data = await getSeerSdk(client).GetConditionalEvents({
    first: 1000,
    orderBy: { [ConditionalEvent_Select_Column.BlockNumber]: Order_By.Desc },
    where: {
      accountId: { _eq: account },
    },
  });
  return data.ConditionalEvent.map((d) => ({
    marketName: unescapeJson(d.market!.marketName),
    marketId: d.market!.address,
    [d.eventType === "redeem" ? "payout" : "amount"]: d.amount,
    type: d.eventType as "split" | "merge" | "redeem",
    blockNumber: Number(d.blockNumber),
    collateral: d.collateral as Address,
    transactionHash: d.transactionHash,
  }));
}

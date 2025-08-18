import { TransactionData } from "@/hooks/portfolio/historyTab/types";
import { ConditionalEvent_OrderBy, OrderDirection, getSdk as getSeerSdk } from "@/hooks/queries/gql-generated-seer";
import { SupportedChain } from "@/lib/chains";
import { unescapeJson } from "@/lib/reality";
import { graphQLClient } from "@/lib/subgraph";
import { Address } from "viem";

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
      accountId: account as Address,
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
  }));
}

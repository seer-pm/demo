import { ConditionalEvent_OrderBy, OrderDirection, getSdk as getSeerSdk } from "@/hooks/queries/gql-generated-seer";
import { SupportedChain } from "@/lib/chains";
import { graphQLClient } from "@/lib/subgraph";
import { Address } from "viem";
import { MarketDataMapping } from "./getMappings";
import { TransactionData } from "./types";

export async function getSplitMergeRedeemEvents(
  mappings: MarketDataMapping,
  account: string,
  chainId: SupportedChain,
): Promise<TransactionData[]> {
  const client = graphQLClient(chainId);

  if (!client) {
    throw new Error("Subgraph not available");
  }
  const { marketIdToCollateral } = mappings;
  const data = await getSeerSdk(client).GetConditionalEvents({
    first: 1000,
    orderBy: ConditionalEvent_OrderBy.BlockNumber,
    orderDirection: OrderDirection.Desc,
    where: {
      accountId: account as Address,
    },
  });
  return data.conditionalEvents.map((d) => ({
    marketName: d.market.marketName,
    marketId: d.market.id,
    [d.type === "redeem" ? "payout" : "amount"]: d.amount,
    type: d.type as "split" | "merge" | "redeem",
    blockNumber: Number(d.blockNumber),
    collateral: marketIdToCollateral[d.market.id.toLocaleLowerCase()],
    transactionHash: d.transactionHash,
  }));
}

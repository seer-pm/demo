import type { SupportedChain, TransactionData } from "@seer-pm/sdk";
import { unescapeJson } from "@seer-pm/sdk/market";
import { graphQLClient } from "@seer-pm/sdk/subgraph";
import { ConditionalEvent_Select_Column, Order_By, getSdk as getSeerSdk } from "@seer-pm/sdk/subgraph/seer";
import type { Address } from "viem";
import type { EventFetchOptions } from "./subgraphTimestampIdPagination";

const PAGE = 1000;

export async function getSplitMergeRedeemEvents(
  account: string,
  chainId: SupportedChain,
  startTime?: number,
  endTime?: number,
  options?: EventFetchOptions,
): Promise<TransactionData[]> {
  const client = graphQLClient(chainId);

  if (!client) {
    throw new Error("Subgraph not available");
  }

  const sdk = getSeerSdk(client);
  const limit = options?.limit !== undefined && options.limit > 0 ? options.limit : undefined;
  const rows: TransactionData[] = [];
  let offset = 0;

  // Previously a single unpaginated `limit: 1000` with no time filter, which silently dropped
  // events for any account with more than 1000 lifetime split/merge/redeems.
  for (;;) {
    const pageSize = limit === undefined ? PAGE : Math.min(PAGE, limit - rows.length);
    if (pageSize <= 0) break;

    const data = await sdk.GetConditionalEvents({
      limit: pageSize,
      offset,
      orderBy: { [ConditionalEvent_Select_Column.BlockNumber]: Order_By.Desc },
      where: {
        accountId: { _eq: account.toLowerCase() },
        chainId: { _eq: String(chainId) },
        ...(startTime !== undefined ? { timestamp: { _gte: String(startTime) } } : {}),
        ...(endTime !== undefined ? { timestamp: { _lte: String(endTime) } } : {}),
      },
    });

    for (const d of data.ConditionalEvent) {
      if (!d.market) continue;
      const isRedeem = d.eventType === "redeem";
      rows.push({
        marketName: unescapeJson(d.market.marketName),
        marketId: d.market.address,
        // `undefined` keys are dropped by JSON.stringify, so the wire shape is unchanged.
        amount: isRedeem ? undefined : d.amount,
        payout: isRedeem ? d.amount : undefined,
        type: d.eventType as "split" | "merge" | "redeem",
        blockNumber: Number(d.blockNumber),
        collateral: d.collateral as Address,
        transactionHash: d.transactionHash,
        timestamp: Number(d.timestamp),
      });
    }

    if (data.ConditionalEvent.length < pageSize) break;
    offset += data.ConditionalEvent.length;
    if (limit !== undefined && rows.length >= limit) break;
  }

  if (options && limit !== undefined && rows.length >= limit) options.truncated = true;

  return rows;
}

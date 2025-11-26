import { OrderDirection, Transfer_Filter, Transfer_OrderBy, getSdk } from "@/hooks/queries/gql-generated-tokens";
import { SupportedChain } from "@/lib/chains";
import { TokenTransfer } from "@/lib/tokens";
import { Address } from "viem";
import { swaprGraphQLClient } from "./subgraph";

export async function getAllTransactions(
  where: Transfer_Filter,
  initialTimestamp: string,
  chainId: SupportedChain,
  loopLimit: number,
): Promise<TokenTransfer[]> {
  const subgraphClient = swaprGraphQLClient(chainId, "tokens");
  if (!subgraphClient) {
    return [];
  }

  const sdk = getSdk(subgraphClient);

  let allTransfers: TokenTransfer[] = [];
  let currentTimestamp: string = initialTimestamp;

  let i = 0;

  // Paginate through all transfers for all tokens
  while (true) {
    const result = await sdk.GetTransfers({
      first: 1000,
      orderBy: Transfer_OrderBy.Timestamp,
      orderDirection: OrderDirection.Asc,
      where: {
        ...where,
        ...(currentTimestamp && { timestamp_gt: currentTimestamp }),
      },
    });

    const transfers: TokenTransfer[] = result.transfers.map((transfer) => {
      return {
        id: transfer.id,
        chain_id: chainId,
        block_number: Number(transfer.blockNumber),
        timestamp: Number(transfer.timestamp),
        from: transfer.from,
        to: transfer.to,
        tx_hash: transfer.id.split("-")[0],
        token: transfer.token.id as Address,
        value: BigInt(transfer.value),
      };
    });
    allTransfers = allTransfers.concat(transfers);

    if (transfers.length < 1000) {
      break; // We've fetched all
    }

    currentTimestamp = String(transfers[transfers.length - 1]?.timestamp);

    i++;

    if (loopLimit > 0 && i >= loopLimit) {
      break;
    }
  }

  return allTransfers;
}

export async function getAllTransactionsForTokens(
  tokenIds: string[],
  chainId: SupportedChain,
): Promise<TokenTransfer[]> {
  return getAllTransactions(
    {
      token_in: tokenIds.map((id) => id.toLowerCase()),
    },
    "0",
    chainId,
    0,
  );
}

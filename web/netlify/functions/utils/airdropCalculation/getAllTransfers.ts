import type { SupportedChain } from "@seer-pm/sdk";
import { graphQLClient } from "@seer-pm/sdk/subgraph";
import {
  type GetTransfersQuery,
  Order_By,
  type Transfer_Bool_Exp,
  getSdk as getSeerSdk,
} from "@seer-pm/sdk/subgraph/seer";
import pLimit from "p-limit";
import { formatUnits, zeroAddress } from "viem";

type Transfer = Omit<GetTransfersQuery["Transfer"][number], "token"> & {
  token: { id: string };
};

export async function getAllTransfers(chainId: SupportedChain, initialStartTime?: number) {
  const client = graphQLClient(chainId);
  const sdk = getSeerSdk(client);

  const [ascResult, descResult] = await Promise.all([
    sdk.GetTransfers({
      limit: 1,
      offset: 0,
      where: { chainId: { _eq: String(Number(chainId)) } },
      orderBy: [{ timestamp: Order_By.Asc }],
    }),
    sdk.GetTransfers({
      limit: 1,
      offset: 0,
      where: { chainId: { _eq: String(Number(chainId)) } },
      orderBy: [{ timestamp: Order_By.Desc }],
    }),
  ]);

  const startTime = initialStartTime ?? Number.parseInt(ascResult.Transfer[0]?.timestamp ?? "0", 10);
  const endTime = Number.parseInt(descResult.Transfer[0]?.timestamp ?? "0", 10);

  // Divide into chunks
  const CHUNK_SIZE = 24 * 60 * 60; // 1 days in seconds
  const chunks: Promise<Transfer[]>[] = [];
  const limit = pLimit(10);

  for (let time = startTime; time < endTime; time += CHUNK_SIZE) {
    chunks.push(limit(() => fetchTimeRange(chainId, time, Math.min(time + CHUNK_SIZE, endTime))));
  }
  const results = await Promise.all(chunks);
  return results.flat();
}

async function fetchTimeRange(chainId: SupportedChain, chunkStart: number, chunkEnd: number): Promise<Transfer[]> {
  const client = graphQLClient(chainId);
  const sdk = getSeerSdk(client);

  let allTransfers: Transfer[] = [];
  let currentTimestamp = chunkStart;

  while (currentTimestamp < chunkEnd) {
    const where: Transfer_Bool_Exp = {
      _and: [
        { chainId: { _eq: String(Number(chainId)) } },
        {
          timestamp: {
            _gte: String(currentTimestamp),
            _lt: String(chunkEnd),
          },
        },
      ],
    };

    const { Transfer: transfers } = await sdk.GetTransfers({
      limit: 1000,
      offset: 0,
      where,
      orderBy: [{ timestamp: Order_By.Asc }],
    });

    if (transfers.length === 0) {
      break;
    }

    allTransfers = allTransfers.concat(transfers.filter((t): t is Transfer => t.token != null && t.token.id != null));

    if (transfers.length < 1000) {
      break;
    }
    currentTimestamp = Number.parseInt(transfers[transfers.length - 1].timestamp, 10) + 1;
  }

  return allTransfers;
}

export function getHoldersAtTimestamp(allTransfers: Transfer[], timestamp: number) {
  const records = allTransfers.filter((transfer) => Number(transfer.timestamp) <= timestamp);
  const tokenBalances: { [key: string]: { [key: string]: bigint } } = {};

  // Process each transfer
  for (const transfer of records) {
    const tokenId = transfer.token.id.toLowerCase();
    const from = transfer.from.toLowerCase();
    const to = transfer.to.toLowerCase();
    const value = BigInt(transfer.value);

    // Initialize token balances if not exists
    if (!tokenBalances[from]) {
      tokenBalances[from] = {};
    }
    if (!tokenBalances[to]) {
      tokenBalances[to] = {};
    }

    tokenBalances[from][tokenId] = (tokenBalances[from][tokenId] ?? 0n) - value;
    tokenBalances[to][tokenId] = (tokenBalances[to][tokenId] ?? 0n) + value;
  }

  const formattedBalances: { [key: string]: { [key: string]: number } } = {};
  for (const [user, balances] of Object.entries(tokenBalances)) {
    // Exclude zero address and non-positive balances
    if (user !== zeroAddress) {
      formattedBalances[user] = {};
      for (const [tokenId, balance] of Object.entries(balances)) {
        if (balance > 0n) {
          formattedBalances[user][tokenId] = Number(formatUnits(balance, 18));
        }
      }
    }
  }
  return formattedBalances;
}

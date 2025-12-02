import { SupportedChain } from "@/lib/chains";
import { SUBGRAPHS } from "@/lib/subgraph-endpoints";
import ethers, { BigNumber } from "ethers";
import { gnosis } from "viem/chains";

export interface Transfer {
  id: string;
  from: string;
  to: string;
  token: {
    id: string;
  };
  timestamp: string;
  blockNumber: string;
  value: string;
}

export async function getAllTransfers(type: "futarchy" | "tokens", chainId: SupportedChain, initialStartTime?: number) {
  if (type === "futarchy" && chainId !== gnosis.id) {
    return [];
  }
  const subgraphUrl = type === "futarchy" ? SUBGRAPHS[type][100] : SUBGRAPHS[type][chainId as 1 | 100];
  // First, get the time range
  const timeRangeQuery = `{
    transfers(first: 1, orderBy: timestamp, orderDirection: asc) { timestamp }
    transfersDesc: transfers(first: 1, orderBy: timestamp, orderDirection: desc) { timestamp }
  }`;

  const timeRangeResult = await fetch(subgraphUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: timeRangeQuery }),
  });
  const timeRangeJson = await timeRangeResult.json();

  const startTime = initialStartTime || Number.parseInt(timeRangeJson.data.transfers[0]?.timestamp || "0");
  const endTime = Number.parseInt(timeRangeJson.data.transfersDesc[0]?.timestamp || "0");

  // Divide into chunks
  const CHUNK_SIZE = 24 * 60 * 60; // 1 days in seconds
  const chunks: Promise<Transfer[]>[] = [];

  for (let time = startTime; time < endTime; time += CHUNK_SIZE) {
    chunks.push(fetchTimeRange(subgraphUrl, time, Math.min(time + CHUNK_SIZE, endTime)));
  }

  const results = await Promise.all(chunks);
  const allTransfers = results.flat();

  return allTransfers;
}

async function fetchTimeRange(subgraphUrl: string, startTime: number, endTime: number): Promise<Transfer[]> {
  let allTransfers: Transfer[] = [];
  let currentTimestamp = startTime;

  while (currentTimestamp < endTime) {
    const query = `{
      transfers(
        first: 1000, 
        orderBy: timestamp, 
        orderDirection: asc,
        where: {timestamp_gte: "${currentTimestamp}", timestamp_lt: "${endTime}"}
      ) {
        id
        from
        to
        token {
          id
        }
        timestamp
        blockNumber
        value
      }
    }`;

    const result = await fetch(subgraphUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const json = await result.json();

    if (json.errors?.length) {
      throw json.errors[0].message;
    }

    const transfers = json?.data?.transfers ?? [];
    allTransfers = allTransfers.concat(transfers);

    if (transfers.length < 1000) break;
    currentTimestamp = Number.parseInt(transfers[transfers.length - 1].timestamp) + 1;
  }

  return allTransfers;
}

export function getHoldersAtTimestamp(allTransfers: Transfer[], timestamp: number) {
  const records = allTransfers.filter((transfer) => Number(transfer.timestamp) <= timestamp);
  const tokenBalances: { [key: string]: { [key: string]: BigNumber } } = {};

  // Process each transfer
  for (const transfer of records) {
    const tokenId = transfer.token.id.toLowerCase();
    const from = transfer.from.toLowerCase();
    const to = transfer.to.toLowerCase();
    const value = ethers.BigNumber.from(transfer.value);

    // Initialize token balances if not exists
    if (!tokenBalances[from]) {
      tokenBalances[from] = {};
    }
    if (!tokenBalances[to]) {
      tokenBalances[to] = {};
    }

    tokenBalances[from][tokenId] = (tokenBalances[from][tokenId] || ethers.BigNumber.from(0)).sub(value);
    tokenBalances[to][tokenId] = (tokenBalances[to][tokenId] || ethers.BigNumber.from(0)).add(value);
  }

  const formattedBalances: { [key: string]: { [key: string]: number } } = {};
  for (const [user, balances] of Object.entries(tokenBalances)) {
    // Exclude zero address and non-positive balances
    if (user !== ethers.constants.AddressZero) {
      formattedBalances[user] = {};
      for (const [tokenId, balance] of Object.entries(balances)) {
        if (balance.gt(0)) {
          formattedBalances[user][tokenId] = Number(ethers.utils.formatUnits(balance, 18));
        }
      }
    }
  }
  return formattedBalances;
}

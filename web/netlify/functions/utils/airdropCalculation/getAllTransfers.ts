import { type SupportedChain, getPrimaryCollateralAddress } from "@seer-pm/sdk";
import { SUBGRAPHS } from "@seer-pm/sdk/subgraph";
import { formatUnits, zeroAddress } from "viem";
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

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function getAllTransfers(
  type: "futarchy" | "tokens",
  chainId: SupportedChain,
  includePrimaryCollateral = false,
  initialStartTime?: number,
) {
  if (type === "futarchy" && chainId !== gnosis.id) {
    return [];
  }
  const primaryCollateral = getPrimaryCollateralAddress(chainId);
  const excludeToken = includePrimaryCollateral ? undefined : primaryCollateral.toLowerCase();
  const subgraphUrl = type === "futarchy" ? SUBGRAPHS[type][100] : SUBGRAPHS[type][chainId as 1 | 100];
  // First, get the time range
  const timeRangeTokenWhere = excludeToken ? `, where: { token_not: "${excludeToken}" }` : "";
  const timeRangeQuery = `{
    transfers(first: 1, orderBy: timestamp, orderDirection: asc${timeRangeTokenWhere}) { timestamp }
    transfersDesc: transfers(first: 1, orderBy: timestamp, orderDirection: desc${timeRangeTokenWhere}) { timestamp }
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
  const CHUNK_SIZE = 24 * 60 * 60 * 10; // 10 days in seconds
  const allTransfers: Transfer[] = [];
  const totalChunks = Math.ceil((endTime - startTime) / CHUNK_SIZE);
  let chunkIndex = 0;

  for (let time = startTime; time < endTime; time += CHUNK_SIZE) {
    chunkIndex += 1;
    console.log(`[getAllTransfers] chunk ${chunkIndex}/${totalChunks}`);
    const transfers = await fetchTimeRange(subgraphUrl, time, Math.min(time + CHUNK_SIZE, endTime), excludeToken);
    allTransfers.push(...transfers);
    await sleep(1000);
  }

  return allTransfers;
}

async function fetchTimeRange(
  subgraphUrl: string,
  startTime: number,
  endTime: number,
  excludeToken: string | undefined,
): Promise<Transfer[]> {
  const tokenNotClause = excludeToken ? `, token_not: "${excludeToken}"` : "";
  let allTransfers: Transfer[] = [];
  let currentTimestamp = startTime;

  while (currentTimestamp < endTime) {
    const query = `{
      transfers(
        first: 1000, 
        orderBy: timestamp, 
        orderDirection: asc,
        where: {timestamp_gte: "${currentTimestamp}", timestamp_lt: "${endTime}"${tokenNotClause}}
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
    if (!result.ok) {
      throw new Error(`Subgraph request failed (${result.status}): ${await result.text()}`);
    }
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

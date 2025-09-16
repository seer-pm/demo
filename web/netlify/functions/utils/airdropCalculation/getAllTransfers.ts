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

export async function getAllTransfers(chainId: SupportedChain) {
  let allTransfers: Transfer[] = [];
  let currentTimestamp = undefined;
  while (true) {
    const query: string = `{
              transfers(first: 1000, orderBy: timestamp, orderDirection: asc${currentTimestamp ? `, where: {timestamp_gt: "${currentTimestamp}"}` : ""}) {
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
    const results = await fetch(SUBGRAPHS["tokens"][chainId as 1 | 100], {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
      }),
    });
    const json = await results.json();
    if (json.errors?.length) {
      throw json.errors[0].message;
    }
    const transfers = json?.data?.transfers ?? [];
    allTransfers = allTransfers.concat(transfers);

    if (transfers[transfers.length - 1]?.timestamp === currentTimestamp) {
      break;
    }
    if (transfers.length < 1000) {
      break; // We've fetched all
    }
    currentTimestamp = transfers[transfers.length - 1]?.timestamp;
  }
  return allTransfers;
}

export async function getAllFutarchyTransfers(chainId: SupportedChain) {
  if (chainId !== gnosis.id) {
    return [];
  }
  let allTransfers: Transfer[] = [];
  let currentTimestamp = undefined;
  while (true) {
    const query: string = `{
              transfers(first: 1000, orderBy: timestamp, orderDirection: asc${currentTimestamp ? `, where: {timestamp_gt: "${currentTimestamp}"}` : ""}) {
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
    const results = await fetch(SUBGRAPHS["futarchy"][100], {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
      }),
    });
    const json = await results.json();
    if (json.errors?.length) {
      throw json.errors[0].message;
    }
    const transfers = json?.data?.transfers ?? [];
    allTransfers = allTransfers.concat(transfers);

    if (transfers[transfers.length - 1]?.timestamp === currentTimestamp) {
      break;
    }
    if (transfers.length < 1000) {
      break; // We've fetched all
    }
    currentTimestamp = transfers[transfers.length - 1]?.timestamp;
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

import { isTwoStringsEqual } from "@/lib/utils";
import type { SupportedChain } from "@seer-pm/sdk";
import { SUBGRAPHS } from "@seer-pm/sdk/subgraph";
import { formatUnits, zeroAddress } from "viem";
import { SER_LPP } from "./constants";
import type { Transfer } from "./getAllTransfers";

export async function getSerLppBalances(chainId: SupportedChain) {
  const serLpp = SER_LPP[chainId as 1 | 100];
  let allTransfers: Transfer[] = [];
  let currentTimestamp = undefined;
  while (true) {
    const query: string = `{
              transfers(first: 1000, orderBy: timestamp, orderDirection: asc${
                currentTimestamp
                  ? `, where: {timestamp_gt: "${currentTimestamp}", token:"${serLpp}"}`
                  : `, where: {token:"${serLpp}"}`
              }) {
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
      throw json.errors[0];
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
  const tokenBalances: { [key: string]: bigint } = {};

  // Process each transfer
  for (const transfer of allTransfers) {
    const tokenId = transfer.token.id.toLowerCase();
    if (!isTwoStringsEqual(tokenId, serLpp)) {
      continue;
    }
    const from = transfer.from.toLowerCase();
    const to = transfer.to.toLowerCase();
    const value = BigInt(transfer.value);
    tokenBalances[from] = (tokenBalances[from] ?? 0n) - value;
    tokenBalances[to] = (tokenBalances[to] ?? 0n) + value;
  }
  const formattedBalances: { [key: string]: number } = {};
  for (const [user, balance] of Object.entries(tokenBalances)) {
    // Exclude zero address and non-positive balances
    if (user !== zeroAddress && balance > 0n) {
      formattedBalances[user] = Number(formatUnits(balance, 18));
    }
  }
  return formattedBalances;
}

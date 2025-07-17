import { SupportedChain } from "@/lib/chains";
import { isTwoStringsEqual } from "@/lib/utils";
import ethers, { BigNumber } from "ethers";
import { SER_LPP, SUBGRAPHS } from "./constants";
import { Transfer } from "./getAllTransfers";

export async function getSerLppBalances(chainId: SupportedChain) {
  const serLpp = SER_LPP[chainId as 1 | 100];
  let allTransfers: Transfer[] = [];
  let currentTimestamp = undefined;
  while (true) {
    const query: string = `{
              transfers(first: 1000, orderBy: timestamp, orderDirection: asc${currentTimestamp ? `, where: {timestamp_gt: "${currentTimestamp}", token:"${serLpp}"}` : `, where: {token:"${serLpp}"}`}) {
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
  const tokenBalances: { [key: string]: BigNumber } = {};

  // Process each transfer
  for (const transfer of allTransfers) {
    const tokenId = transfer.token.id.toLowerCase();
    if (!isTwoStringsEqual(tokenId, serLpp)) {
      continue;
    }
    const from = transfer.from.toLowerCase();
    const to = transfer.to.toLowerCase();
    const value = ethers.BigNumber.from(transfer.value);
    tokenBalances[from] = (tokenBalances[from] || ethers.BigNumber.from(0)).sub(value);
    tokenBalances[to] = (tokenBalances[to] || ethers.BigNumber.from(0)).add(value);
  }
  const formattedBalances: { [key: string]: number } = {};
  for (const [user, balance] of Object.entries(tokenBalances)) {
    // Exclude zero address and non-positive balances
    if (user !== ethers.constants.AddressZero && balance.gt(0)) {
      formattedBalances[user] = Number(ethers.utils.formatUnits(balance, 18));
    }
  }
  return formattedBalances;
}

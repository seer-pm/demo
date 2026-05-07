import { isTwoStringsEqual } from "@/lib/utils";
import type { SupportedChain } from "@seer-pm/sdk";
import { graphQLClient } from "@seer-pm/sdk/subgraph";
import {
  type GetTransfersQuery,
  Order_By,
  type Transfer_Bool_Exp,
  getSdk as getSeerSdk,
} from "@seer-pm/sdk/subgraph/seer";
import { formatUnits, zeroAddress } from "viem";
import { SER_LPP } from "./constants";

type TransferRow = GetTransfersQuery["Transfer"][number];

export async function getSerLppBalances(chainId: SupportedChain) {
  const serLpp = SER_LPP[chainId as keyof typeof SER_LPP];
  if (!serLpp) {
    throw new Error("Invalid SER_LPP chain");
  }
  const client = graphQLClient(chainId);

  let allTransfers: TransferRow[] = [];
  let currentTimestamp: string | undefined;

  while (true) {
    const where: Transfer_Bool_Exp = {
      _and: [
        { chainId: { _eq: String(chainId) } },
        { token_id: { _eq: serLpp.toLowerCase() } },
        ...(currentTimestamp !== undefined ? [{ timestamp: { _gt: currentTimestamp } }] : []),
      ],
    };

    const { Transfer: transfers } = await getSeerSdk(client).GetTransfers({
      limit: 1000,
      offset: 0,
      where,
      orderBy: [{ timestamp: Order_By.Asc }],
    });

    if (transfers.length === 0) {
      break;
    }

    allTransfers = allTransfers.concat(transfers);

    if (transfers[transfers.length - 1]?.timestamp === currentTimestamp) {
      break;
    }
    if (transfers.length < 1000) {
      break;
    }
    currentTimestamp = transfers[transfers.length - 1]?.timestamp;
  }

  const tokenBalances: { [key: string]: bigint } = {};

  // Process each transfer
  for (const transfer of allTransfers) {
    const tokenId = transfer.token?.id?.toLowerCase();
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

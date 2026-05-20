import type { SupportedChain, Token, TokenTransfer } from "@seer-pm/sdk";
import { getRouterAddresses } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type Address, formatUnits } from "viem";
import type { Database } from "./supabase";
import { listUserRouterTokenTransfersInWindow } from "./transactions/listUserRouterTokenTransfersInWindow";

const DEBUG_MAX_TRANSFERS = 50;

type RouterCollateralTransfer = {
  timestamp: number;
  blockNumber: number;
  txHash: string;
  from: string;
  to: string;
  valueWei: bigint;
  signedValueWeiForUser: bigint; // + incoming to user, - outgoing from user
};

async function listRouterPrimaryCollateralTransfersInWindow(
  supabase: SupabaseClient<Database>,
  chainId: SupportedChain,
  account: Address,
  routerAddresses: Address[],
  primaryToken: Address,
  startTime: number,
  endTime: number,
): Promise<RouterCollateralTransfer[]> {
  const rows: TokenTransfer[] = await listUserRouterTokenTransfersInWindow(
    supabase,
    chainId,
    account,
    routerAddresses,
    [primaryToken],
    startTime,
    endTime,
  );

  const accountLc = account.toLowerCase();
  const out: RouterCollateralTransfer[] = [];
  for (const row of rows) {
    const valueWei = BigInt(row.value);
    const from = String(row.from).toLowerCase();
    const to = String(row.to).toLowerCase();
    const signedValueWeiForUser = to === accountLc ? valueWei : -valueWei;
    out.push({
      timestamp: Number(row.timestamp),
      blockNumber: Number(row.block_number),
      txHash: String(row.tx_hash),
      from,
      to,
      valueWei,
      signedValueWeiForUser,
    });
  }

  out.sort((a, b) => a.timestamp - b.timestamp);
  return out;
}

/**
 * One fetch of router↔user primary transfers up to `endTime`, then cumulative human values at each `startTime`
 * and `valueEnd` at `endTime`. Avoids N duplicate full scans of router primary transfers.
 */
export async function computeCollateralPortfolioValuesForPeriods(
  supabase: SupabaseClient<Database>,
  account: Address,
  chainId: SupportedChain,
  endTime: number,
  startTimes: number[],
  primaryCollateral: Token,
): Promise<{ valueEnd: number; valueStartByStartTime: Map<number, number> }> {
  const routers = getRouterAddresses(chainId);

  const transfers = await listRouterPrimaryCollateralTransfersInWindow(
    supabase,
    chainId,
    account,
    routers,
    primaryCollateral.address,
    -1,
    endTime,
  );

  const uniqueStarts = [...new Set(startTimes)].sort((a, b) => a - b);
  const valueStartByStartTime = new Map<number, number>();

  let idx = 0;
  let sumWei = 0n;
  for (const S of uniqueStarts) {
    while (idx < transfers.length && transfers[idx].timestamp <= S) {
      sumWei += transfers[idx].signedValueWeiForUser;
      idx++;
    }
    valueStartByStartTime.set(S, Number(formatUnits(sumWei, primaryCollateral.decimals)));
  }
  while (idx < transfers.length && transfers[idx].timestamp <= endTime) {
    sumWei += transfers[idx].signedValueWeiForUser;
    idx++;
  }
  const valueEnd = Number(formatUnits(sumWei, primaryCollateral.decimals));

  return { valueEnd, valueStartByStartTime };
}

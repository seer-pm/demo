import type { SupportedChain } from "@seer-pm/sdk";
import { COLLATERAL_TOKENS, getPrimaryCollateralAddress, getRouterAddresses } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type Address, formatUnits } from "viem";
import type { Database } from "./supabase";
import {
  type TokenTransferRow,
  listUserRouterTokenTransfersInWindow,
} from "./transactions/listUserRouterTokenTransfersInWindow";

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
  const rows: TokenTransferRow[] = await listUserRouterTokenTransfersInWindow(
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
    const valueWei = BigInt(row.value as string);
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
): Promise<{ valueEnd: number; valueStartByStartTime: Map<number, number> }> {
  const primary = COLLATERAL_TOKENS[chainId as keyof typeof COLLATERAL_TOKENS].primary;
  const routers = getRouterAddresses(chainId);

  const transfers = await listRouterPrimaryCollateralTransfersInWindow(
    supabase,
    chainId,
    account,
    routers,
    primary.address,
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
    valueStartByStartTime.set(S, Number(formatUnits(sumWei, primary.decimals)));
  }
  while (idx < transfers.length && transfers[idx].timestamp <= endTime) {
    sumWei += transfers[idx].signedValueWeiForUser;
    idx++;
  }
  const valueEnd = Number(formatUnits(sumWei, primary.decimals));

  return { valueEnd, valueStartByStartTime };
}

/**
 * Cumulative **net** protocol-style collateral (split/merge/redeem style cash legs) from **ERC20 `tokens_transfers` only**,
 * between the user and Seer routers (`getRouterAddresses` / `routerAddressMap`) for `COLLATERAL_TOKENS.primary` only.
 * No subgraph: Seer flows use `Router` / `GnosisRouter`, so `GetConditionalEvents` credits the router, not the user; wrapped outcomes mean users interact via those routers only.
 */
export async function computeCollateralPortfolioValuesForPeriod(
  supabase: SupabaseClient<Database>,
  account: Address,
  chainId: SupportedChain,
  startTime: number,
  endTime: number,
  opts?: { debug?: boolean },
): Promise<{
  valueEnd: number;
  valueStart: number;
  debug?: {
    primaryToken: string;
    routerCount: number;
    routers: string[];
    startTime: number;
    endTime: number;
    sumUserToRouter: number;
    sumRouterToUser: number;
    netUserSigned: number;
    transferCount: number;
    topTransfersByAbsSigned: Array<{
      timestamp: number;
      blockNumber: number;
      txHash: string;
      from: string;
      to: string;
      value: number;
      signedForUser: number;
    }>;
  };
}> {
  const { valueEnd, valueStartByStartTime } = await computeCollateralPortfolioValuesForPeriods(
    supabase,
    account,
    chainId,
    endTime,
    [startTime],
  );
  const valueStart = valueStartByStartTime.get(startTime) ?? 0;

  if (!opts?.debug) return { valueEnd, valueStart };

  const routers = getRouterAddresses(chainId);
  const primary = COLLATERAL_TOKENS[chainId as keyof typeof COLLATERAL_TOKENS].primary;
  if (!primary || routers.length === 0) return { valueEnd, valueStart };

  const transfers = await listRouterPrimaryCollateralTransfersInWindow(
    supabase,
    chainId,
    account,
    routers,
    primary.address,
    startTime,
    endTime,
  );

  let sumUserToRouterWei = 0n;
  let sumRouterToUserWei = 0n;
  let netUserSignedWei = 0n;
  for (const t of transfers) {
    netUserSignedWei += t.signedValueWeiForUser;
    if (t.signedValueWeiForUser < 0n) sumUserToRouterWei += -t.signedValueWeiForUser;
    if (t.signedValueWeiForUser > 0n) sumRouterToUserWei += t.signedValueWeiForUser;
  }

  const topTransfersByAbsSigned = [...transfers]
    .sort((a, b) => {
      const aa = a.signedValueWeiForUser < 0n ? -a.signedValueWeiForUser : a.signedValueWeiForUser;
      const bb = b.signedValueWeiForUser < 0n ? -b.signedValueWeiForUser : b.signedValueWeiForUser;
      if (aa === bb) return b.timestamp - a.timestamp;
      return bb > aa ? 1 : -1;
    })
    .slice(0, DEBUG_MAX_TRANSFERS)
    .map((t) => ({
      timestamp: t.timestamp,
      blockNumber: t.blockNumber,
      txHash: t.txHash,
      from: t.from,
      to: t.to,
      value: Number(formatUnits(t.valueWei, primary.decimals)),
      signedForUser: Number(formatUnits(t.signedValueWeiForUser, primary.decimals)),
    }));

  return {
    valueEnd,
    valueStart,
    debug: {
      primaryToken: primary.address,
      routerCount: routers.length,
      routers,
      startTime,
      endTime,
      sumUserToRouter: Number(formatUnits(sumUserToRouterWei, primary.decimals)),
      sumRouterToUser: Number(formatUnits(sumRouterToUserWei, primary.decimals)),
      netUserSigned: Number(formatUnits(netUserSignedWei, primary.decimals)),
      transferCount: transfers.length,
      topTransfersByAbsSigned,
    },
  };
}

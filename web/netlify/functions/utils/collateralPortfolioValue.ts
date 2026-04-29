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

/** Net signed wei (primary collateral only): user receives from router (+), user sends to router (−). */
async function sumRouterPrimaryCollateralSignedWeiUpTo(
  supabase: SupabaseClient<Database>,
  chainId: SupportedChain,
  account: Address,
  routerAddresses: Address[],
  primaryToken: Address,
  timestampMax: number,
): Promise<bigint> {
  const transfers = await listRouterPrimaryCollateralTransfersInWindow(
    supabase,
    chainId,
    account,
    routerAddresses,
    primaryToken,
    -1,
    timestampMax,
  );

  let sum = 0n;
  for (const t of transfers) sum += t.signedValueWeiForUser;
  return sum;
}

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

async function cumulativeRouterCollateralHumanUpTo(
  supabase: SupabaseClient<Database>,
  account: Address,
  chainId: SupportedChain,
  timestampMax: number,
): Promise<number> {
  const routers = getRouterAddresses(chainId);
  if (routers.length === 0) return 0;

  const primary = COLLATERAL_TOKENS[chainId]?.primary;
  if (!primary) return 0;

  const wei = await sumRouterPrimaryCollateralSignedWeiUpTo(
    supabase,
    chainId,
    account,
    routers,
    primary.address,
    timestampMax,
  );

  return Number(formatUnits(wei, primary.decimals));
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
  try {
    getPrimaryCollateralAddress(chainId);
  } catch {
    return { valueEnd: 0, valueStart: 0 };
  }

  try {
    const [valueEnd, valueStart] = await Promise.all([
      cumulativeRouterCollateralHumanUpTo(supabase, account, chainId, endTime),
      cumulativeRouterCollateralHumanUpTo(supabase, account, chainId, startTime),
    ]);

    if (!opts?.debug) return { valueEnd, valueStart };

    const routers = getRouterAddresses(chainId);
    const primary = COLLATERAL_TOKENS[chainId]?.primary;
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
  } catch (e) {
    console.error("computeCollateralPortfolioValuesForPeriod failed", e);
    return { valueEnd: 0, valueStart: 0 };
  }
}

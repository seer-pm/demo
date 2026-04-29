import type { SupportedChain } from "@seer-pm/sdk";
import { COLLATERAL_TOKENS, getPrimaryCollateralAddress } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type Address, formatUnits } from "viem";
import { searchAllMarkets, searchMarkets } from "./markets";
import { getMappings } from "./portfolio";
import type { Database } from "./supabase";
import { getSwapEvents } from "./transactions/getSwapEvents";
import { listDistinctUserTransferTokensInWindow } from "./transactions/listDistinctUserTransferTokensInWindow";

export type PrimaryCollateralSwapFlowDebugRow = {
  marketId: string;
  marketName: string;
  timestamp: number;
  blockNumber: number;
  txHash?: string;
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  amountOut?: string;
  tokenInSymbol?: string;
  tokenOutSymbol?: string;
  countedPrimaryNetOutWei: string; // signed, in wei of primary token
};

/**
 * Net **primary collateral** (e.g. sDAI on Gnosis) spent on outcome **DEX/Cowswap** swaps in `(startTime, endTime]`,
 * in human units (same decimals as chain primary collateral).
 *
 * Positive = user sent more primary than they received (typical net cost of buying).
 *
 * Sources: same as transaction history (`getSwapEvents`). Does not include split/merge/redeem (those are captured in
 * `collateralValues` from router `tokens_transfers` when applicable).
 *
 * Global mode (no `marketId`): loads only markets tied to **tokens this user touched** in `tokens_transfers` over the
 * same `(startTime, endTime]` window, instead of every chain market.
 */
export async function computeNetPrimaryCollateralSwapFlow(
  supabase: SupabaseClient<Database>,
  account: Address,
  chainId: SupportedChain,
  startTime: number,
  endTime: number,
  marketId?: Address,
  opts?: { limitRows?: number },
): Promise<{
  netOut: number;
  rows: PrimaryCollateralSwapFlowDebugRow[];
  primary: { address: string; decimals: number };
}> {
  let primaryAddr: string;
  let decimals: number;
  try {
    primaryAddr = getPrimaryCollateralAddress(chainId).toLowerCase();
    decimals = COLLATERAL_TOKENS[chainId as keyof typeof COLLATERAL_TOKENS]?.primary?.decimals ?? 18;
  } catch {
    return { netOut: 0, rows: [], primary: { address: "", decimals: 18 } };
  }

  // Market list strategy:
  // - For market-specific P&L, load only that market by id and build mappings from it.
  // - For global P&L, load markets for tokens this user had in `tokens_transfers` (not full chain).
  let markets: Awaited<ReturnType<typeof searchMarkets>>["markets"] = [];
  if (marketId) {
    const resp = await searchMarkets({ chainIds: [chainId], id: marketId });
    markets = resp.markets;
  } else {
    const fromTransfers = await listDistinctUserTransferTokensInWindow(supabase, chainId, account, startTime, endTime);

    const tokenSet = new Set(fromTransfers);
    tokenSet.delete(primaryAddr);

    const distinctTokens = Array.from(tokenSet);

    if (distinctTokens.length === 0) {
      markets = [];
    } else {
      const { markets: loaded } = await searchAllMarkets({
        chainIds: [chainId],
        tokens: distinctTokens as Address[],
      });
      markets = loaded;
    }
  }

  if (markets.length === 0) return { netOut: 0, rows: [], primary: { address: primaryAddr, decimals } };

  const mappings = await getMappings(markets, chainId);

  const swaps = await getSwapEvents(mappings, account, chainId, startTime, endTime);

  const rows: PrimaryCollateralSwapFlowDebugRow[] = [];
  let netOutWei = 0n;
  const rowLimit = Math.max(0, opts?.limitRows ?? 200);

  for (const s of swaps) {
    if (marketId && (s.marketId ?? "").toLowerCase() !== marketId.toLowerCase()) {
      continue;
    }
    const ts = s.timestamp;
    if (ts <= startTime || ts > endTime) {
      continue;
    }

    const tin = (s.tokenIn ?? "").toLowerCase();
    const tout = (s.tokenOut ?? "").toLowerCase();

    let counted = 0n;
    if (tin === primaryAddr) counted += BigInt(s.amountIn || 0);
    if (tout === primaryAddr) counted -= BigInt(s.amountOut || 0);

    if (counted !== 0n) {
      netOutWei += counted;
      if (rowLimit > 0 && rows.length < rowLimit) {
        rows.push({
          marketId: String(s.marketId ?? ""),
          marketName: String(s.marketName ?? ""),
          timestamp: Number(s.timestamp ?? 0),
          blockNumber: Number(s.blockNumber ?? 0),
          txHash: s.transactionHash,
          tokenIn: s.tokenIn,
          tokenOut: s.tokenOut,
          amountIn: s.amountIn,
          amountOut: s.amountOut,
          tokenInSymbol: s.tokenInSymbol,
          tokenOutSymbol: s.tokenOutSymbol,
          countedPrimaryNetOutWei: counted.toString(),
        });
      }
    }
  }

  return { netOut: Number(formatUnits(netOutWei, decimals)), rows, primary: { address: primaryAddr, decimals } };
}

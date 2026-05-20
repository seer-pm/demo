import type { Market, SupportedChain, Token, TokenTransfer, TransactionData } from "@seer-pm/sdk";
import { getRouterAddresses, reconstructSplitMergeRedeemFromTransfers } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Address } from "viem";
import { formatUnits, isAddressEqual } from "viem";
import { tokensTransfersRowToTransfer } from "../airdropCalculation/getAllTransfers";
import type { Database } from "../supabase";
import { listUserRouterTokenTransfersInWindow } from "./listUserRouterTokenTransfersInWindow";

const TX_HASH_CHUNK = 200;

/** Net primary collateral (human units) for the user across txs that include outcome legs; matches prior portfolio PnL adjustment. */
function routerPrimaryCollateralNetInWindowFromTransfers(
  transfers: TokenTransfer[],
  account: Address,
  wrappedTokens: Address[],
  primaryCollateral: Token,
): number {
  const primaryTokenLc = primaryCollateral.address.toLowerCase();
  const outcomeTokenSet = new Set(wrappedTokens.map((t) => t.toLowerCase()));
  const transfersByTx = new Map<string, { outcome: TokenTransfer[]; primary: TokenTransfer[] }>();

  for (const t of transfers) {
    const tokenLc = String(t.token).toLowerCase();
    const entry = transfersByTx.get(t.tx_hash) ?? { outcome: [], primary: [] };
    if (tokenLc === primaryTokenLc) {
      entry.primary.push(t);
    } else if (outcomeTokenSet.has(tokenLc)) {
      entry.outcome.push(t);
    }
    transfersByTx.set(t.tx_hash, entry);
  }

  let netPrimaryWeiInWindow = 0n;
  for (const grouped of transfersByTx.values()) {
    if (grouped.outcome.length === 0) continue;
    let primaryNetWei = 0n;
    for (const row of grouped.primary) {
      const valueWei = row.value;
      const toIsUser = isAddressEqual(row.to as Address, account);
      const fromIsUser = isAddressEqual(row.from as Address, account);
      if (toIsUser) primaryNetWei += valueWei;
      else if (fromIsUser) primaryNetWei -= valueWei;
    }
    netPrimaryWeiInWindow += primaryNetWei;
  }

  return Number(formatUnits(netPrimaryWeiInWindow, primaryCollateral.decimals));
}

async function listOutcomeTransfersUserRouterInWindow(
  supabase: SupabaseClient<Database>,
  chainId: SupportedChain,
  account: Address,
  routerAddresses: Address[],
  outcomeTokens: Address[],
  startTime: number,
  endTime: number,
): Promise<TokenTransfer[]> {
  return await listUserRouterTokenTransfersInWindow(
    supabase,
    chainId,
    account,
    routerAddresses,
    outcomeTokens,
    startTime,
    endTime,
  );
}

async function listPrimaryCollateralTransfersForTxs(
  supabase: SupabaseClient<Database>,
  chainId: SupportedChain,
  account: string,
  routers: string[],
  primaryToken: string,
  txHashes: string[],
): Promise<TokenTransfer[]> {
  const out: TokenTransfer[] = [];
  const routerAddrLcs = routers.map((r) => r.toLowerCase());
  for (let i = 0; i < txHashes.length; i += TX_HASH_CHUNK) {
    const chunkTx = txHashes.slice(i, i + TX_HASH_CHUNK);
    const { data, error } = await supabase
      .from("tokens_transfers")
      .select("block_number,chain_id,from,to,timestamp,token,tx_hash,value,log_index")
      .eq("chain_id", chainId)
      .eq("token", primaryToken.toLowerCase())
      .in("tx_hash", chunkTx)
      // user is sender or receiver, and counterparty is router
      .or(
        [
          `and(from.eq.${account.toLowerCase()},to.in.(${routerAddrLcs.join(",")}))`,
          `and(to.eq.${account.toLowerCase()},from.in.(${routerAddrLcs.join(",")}))`,
        ].join(","),
      );
    if (error) throw new Error(`tokens_transfers primary for tx hashes: ${error.message}`);
    out.push(...(data ?? []).map(tokensTransfersRowToTransfer));
  }
  return out;
}

type ReconstructInput = {
  supabase: SupabaseClient<Database>;
  account: Address;
  market: Market;
  primaryCollateral: Token;
  startTime: number;
  endTime: number;
  identifySwaps?: boolean;
};

export async function reconstructSplitMergeRedeemFromTransfersForMarket({
  supabase,
  account,
  market,
  primaryCollateral,
  startTime,
  endTime,
  identifySwaps = false,
}: ReconstructInput): Promise<{
  events: TransactionData[];
  routerPrimaryCollateralNetInWindow: number; // signed for user (+ incoming, - outgoing)
}> {
  const routers = getRouterAddresses(market.chainId);
  if (routers.length === 0) {
    return { events: [], routerPrimaryCollateralNetInWindow: 0 };
  }
  const outcomeTransfers = await listOutcomeTransfersUserRouterInWindow(
    supabase,
    market.chainId,
    account,
    routers,
    market.wrappedTokens,
    startTime,
    endTime,
  );

  if (outcomeTransfers.length === 0) {
    return { events: [], routerPrimaryCollateralNetInWindow: 0 };
  }

  const txHashes = [...new Set(outcomeTransfers.map((t) => t.tx_hash))];
  const primaryTransfers = await listPrimaryCollateralTransfersForTxs(
    supabase,
    market.chainId,
    account,
    routers,
    primaryCollateral.address.toLowerCase(),
    txHashes,
  );

  const merged = [...outcomeTransfers, ...primaryTransfers];

  const events = reconstructSplitMergeRedeemFromTransfers(merged, market, primaryCollateral, {
    identifySwaps,
  });

  const routerPrimaryCollateralNetInWindow = routerPrimaryCollateralNetInWindowFromTransfers(
    merged,
    account,
    market.wrappedTokens,
    primaryCollateral,
  );

  return { events, routerPrimaryCollateralNetInWindow };
}

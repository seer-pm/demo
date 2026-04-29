import type { SupportedChain } from "@seer-pm/sdk";
import { COLLATERAL_TOKENS, getRouterAddresses } from "@seer-pm/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Address } from "viem";
import { formatUnits, isAddressEqual } from "viem";
import type { TransactionData } from "../portfolio";
import type { Database } from "../supabase";
import { getTokenDecimals } from "../tokenDecimals";
import { type TokenTransferRow, listUserRouterTokenTransfersInWindow } from "./listUserRouterTokenTransfersInWindow";

const TX_HASH_CHUNK = 200;

type TransferRow = TokenTransferRow;

function pow10(exp: number): bigint {
  let out = 1n;
  for (let i = 0; i < exp; i++) out *= 10n;
  return out;
}

function normalizeWeiTo18(valueWei: bigint, decimals: number): bigint {
  if (decimals === 18) return valueWei;
  if (decimals < 18) return valueWei * pow10(18 - decimals);
  // Should not happen for Seer primary collateral, but keep safe.
  return valueWei / pow10(decimals - 18);
}

async function listOutcomeTransfersUserRouterInWindow(
  supabase: SupabaseClient<Database>,
  chainId: SupportedChain,
  account: Address,
  routerAddresses: Address[],
  outcomeTokens: Address[],
  startTime: number,
  endTime: number,
): Promise<TransferRow[]> {
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
  accountLc: string,
  routerAddrLcs: string[],
  primaryTokenLc: string,
  txHashes: string[],
): Promise<TransferRow[]> {
  const out: TransferRow[] = [];
  for (let i = 0; i < txHashes.length; i += TX_HASH_CHUNK) {
    const chunkTx = txHashes.slice(i, i + TX_HASH_CHUNK);
    const { data, error } = await supabase
      .from("tokens_transfers")
      .select("token,from,to,value::text,timestamp,tx_hash,block_number")
      .eq("chain_id", chainId)
      .eq("token", primaryTokenLc)
      .in("tx_hash", chunkTx)
      // user is sender or receiver, and counterparty is router
      .or(
        [
          `and(from.eq.${accountLc},to.in.(${routerAddrLcs.join(",")}))`,
          `and(to.eq.${accountLc},from.in.(${routerAddrLcs.join(",")}))`,
        ].join(","),
      );
    if (error) throw new Error(`tokens_transfers primary for tx hashes: ${error.message}`);
    out.push(...(((data ?? []) as unknown as TransferRow[]) ?? []));
  }
  return out;
}

type ReconstructInput = {
  supabase: SupabaseClient<Database>;
  account: Address;
  chainId: SupportedChain;
  marketId: Address;
  marketName: string;
  wrappedTokens: Address[];
  startTime: number;
  endTime: number;
};

export async function reconstructSplitMergeRedeemFromTransfersForMarket({
  supabase,
  account,
  chainId,
  marketId,
  marketName,
  wrappedTokens,
  startTime,
  endTime,
}: ReconstructInput): Promise<{
  events: TransactionData[];
  routerPrimaryCollateralNetInWindow: number; // signed for user (+ incoming, - outgoing)
}> {
  const routers = getRouterAddresses(chainId);
  const primary = COLLATERAL_TOKENS[chainId]?.primary;
  if (routers.length === 0 || !primary) {
    return { events: [], routerPrimaryCollateralNetInWindow: 0 };
  }

  const accountLc = account.toLowerCase();
  const routerAddrLcs = routers.map((r) => r.toLowerCase());
  const outcomeTokenLcs = wrappedTokens.map((t) => t.toLowerCase());

  const outcomeTransfers = await listOutcomeTransfersUserRouterInWindow(
    supabase,
    chainId,
    account,
    routers,
    wrappedTokens,
    startTime,
    endTime,
  );

  if (outcomeTransfers.length === 0) {
    return { events: [], routerPrimaryCollateralNetInWindow: 0 };
  }

  const txHashes = [...new Set(outcomeTransfers.map((t) => t.tx_hash))];
  const primaryTokenLc = primary.address.toLowerCase();
  const primaryTransfers = await listPrimaryCollateralTransfersForTxs(
    supabase,
    chainId,
    accountLc,
    routerAddrLcs,
    primaryTokenLc,
    txHashes,
  );

  const transfersByTx = new Map<string, { outcome: TransferRow[]; primary: TransferRow[] }>();
  for (const t of outcomeTransfers) {
    const e = transfersByTx.get(t.tx_hash) ?? { outcome: [], primary: [] };
    e.outcome.push(t);
    transfersByTx.set(t.tx_hash, e);
  }
  for (const t of primaryTransfers) {
    const e = transfersByTx.get(t.tx_hash) ?? { outcome: [], primary: [] };
    e.primary.push(t);
    transfersByTx.set(t.tx_hash, e);
  }

  const decimalsByToken = getTokenDecimals(chainId, [primary.address, ...wrappedTokens]);
  const primaryDecimals = decimalsByToken[primaryTokenLc] ?? primary.decimals;

  const events: TransactionData[] = [];
  let netPrimaryWeiInWindow = 0n; // signed for user

  for (const [txHash, grouped] of transfersByTx.entries()) {
    if (grouped.outcome.length === 0) continue;

    // Compute net outcome per token (signed for user)
    const outcomeNetWeiByToken: Record<string, bigint> = {};
    const outcomeSentWeiByToken: Record<string, bigint> = {};
    const outcomeRecvWeiByToken: Record<string, bigint> = {};

    let timestamp = 0;
    let blockNumber = 0;
    for (const row of grouped.outcome) {
      timestamp = Math.max(timestamp, Number(row.timestamp));
      blockNumber = Math.max(blockNumber, Number(row.block_number));
      const tokenLc = row.token.toLowerCase();
      const valueWei = BigInt(row.value);
      const fromIsUser = isAddressEqual(row.from as Address, account);
      const toIsUser = isAddressEqual(row.to as Address, account);

      if (toIsUser) {
        outcomeNetWeiByToken[tokenLc] = (outcomeNetWeiByToken[tokenLc] ?? 0n) + valueWei;
        outcomeRecvWeiByToken[tokenLc] = (outcomeRecvWeiByToken[tokenLc] ?? 0n) + valueWei;
      } else if (fromIsUser) {
        outcomeNetWeiByToken[tokenLc] = (outcomeNetWeiByToken[tokenLc] ?? 0n) - valueWei;
        outcomeSentWeiByToken[tokenLc] = (outcomeSentWeiByToken[tokenLc] ?? 0n) + valueWei;
      }
    }

    // Compute net primary collateral (signed for user)
    let primaryNetWei = 0n;
    for (const row of grouped.primary) {
      const valueWei = BigInt(row.value);
      const toIsUser = isAddressEqual(row.to as Address, account);
      const fromIsUser = isAddressEqual(row.from as Address, account);
      if (toIsUser) primaryNetWei += valueWei;
      else if (fromIsUser) primaryNetWei -= valueWei;
    }
    netPrimaryWeiInWindow += primaryNetWei;

    const hasOutcomeRecv = Object.values(outcomeRecvWeiByToken).some((v) => v > 0n);
    const hasOutcomeSent = Object.values(outcomeSentWeiByToken).some((v) => v > 0n);

    const primaryNet18 = normalizeWeiTo18(primaryNetWei, primaryDecimals);

    // Balanced set helper
    const sentAllOutcomes = outcomeTokenLcs.every((t) => (outcomeSentWeiByToken[t] ?? 0n) > 0n);
    const recvAllOutcomes = outcomeTokenLcs.every((t) => (outcomeRecvWeiByToken[t] ?? 0n) > 0n);
    const sentAmounts = outcomeTokenLcs.map((t) => outcomeSentWeiByToken[t] ?? 0n);
    const recvAmounts = outcomeTokenLcs.map((t) => outcomeRecvWeiByToken[t] ?? 0n);

    const isAllEqual = (arr: bigint[]) => arr.length > 0 && arr.every((x) => x === arr[0]);

    // Classify
    let type: TransactionData["type"] | null = null;
    let amountWei18: bigint | null = null;

    if (primaryNetWei < 0n && hasOutcomeRecv) {
      // split: user pays collateral, receives outcome(s)
      if (recvAllOutcomes && isAllEqual(recvAmounts)) {
        const base = recvAmounts[0]!;
        amountWei18 = base; // outcomes are 18 decimals by convention here
        // Optional: check collateral magnitude matches base
        if (primaryNet18 === -base) type = "split";
        else type = "split";
      } else {
        type = "split";
      }
    } else if (primaryNetWei > 0n && hasOutcomeSent) {
      // merge vs redeem: merge requires balanced complete set + matching collateral received
      if (sentAllOutcomes && isAllEqual(sentAmounts)) {
        const base = sentAmounts[0]!;
        amountWei18 = base;
        if (primaryNet18 === base) {
          type = "merge";
        } else {
          type = "redeem";
        }
      } else {
        type = "redeem";
      }
    } else {
      // If no collateral leg, we can't reliably classify; skip to avoid noise.
      continue;
    }

    const amountHuman =
      amountWei18 !== null
        ? formatUnits(amountWei18, 18)
        : formatUnits(primaryNetWei < 0n ? -primaryNetWei : primaryNetWei, primaryDecimals);

    events.push({
      marketName,
      marketId: marketId.toLowerCase(),
      type,
      blockNumber,
      collateral: primary.address,
      collateralSymbol: primary.symbol,
      timestamp,
      transactionHash: txHash,
      amount: type === "redeem" ? undefined : amountHuman,
      payout: type === "redeem" ? formatUnits(primaryNetWei, primaryDecimals) : undefined,
    });
  }

  // Sort like other tx sources
  events.sort((a, b) => b.timestamp - a.timestamp);

  return {
    events,
    routerPrimaryCollateralNetInWindow: Number(formatUnits(netPrimaryWeiInWindow, primaryDecimals)),
  };
}

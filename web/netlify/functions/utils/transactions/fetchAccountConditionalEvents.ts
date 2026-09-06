import type { SupportedChain, Token, TransactionData } from "@seer-pm/sdk";
import type { Address } from "viem";
import {
  conditionalEventsToTransactions,
  dedupeConditionalEventLegs,
  fetchConditionalEventsForAccount,
  fetchConditionalEventsForAccountWidened,
} from "../seerIndexerPortfolio";

/**
 * CTF rows (split / merge / redeem) for one wallet, the history counterpart of the DEX source.
 *
 * Ownership is the union the P/L compute already uses, not `accountId` alone. `accountId` is not the
 * economic owner: a TradeExecutor driven by a relayer has its events booked to whichever EOA signed,
 * so the wallet's own splits and redeems never matched the filter and the History tab showed swaps
 * only — while the same legs counted in the P/L behind the header. Without a primary collateral
 * there is no router transfer to follow, so that chain falls back to the narrow read rather than
 * losing its rows.
 *
 * The market fan-out is collapsed here because the endpoint's `transactionKey` cannot: it dedupes by
 * `eventId`, and the indexer's duplicate legs carry distinct ids (`…-{marketEntityId}`), so one
 * redeem would render up to five times. `preferMarketIds` should be *this wallet's* own market
 * universe, matching what `marketPeriodBuckets` passes, so a fanned-out leg lands on the same market
 * here as in the per-market P/L. Handing it a set merged across wallets would let a leg land on a
 * market only a sibling executor touched, and the same redeem would then be shown under one market
 * and counted under another.
 *
 * Reading a router transaction whole is correct because one router transaction carries one wallet's
 * operation: a TradeExecutor belongs to a single owner and is signed by that owner, so nothing
 * batches two wallets into one transaction, and the deduped leg amounts reconcile exactly against
 * the account's own router transfers. `conditionalEventStakeholderIsForeign` covers the case that
 * invariant does not — a third party calling the CTF directly in the same transaction — but it
 * cannot separate two wallets that both went through the router, since the CTF books the router as
 * the stakeholder for both. A relayer that ever drove two wallets in one transaction would need
 * ownership resolved per leg, against the parties of that transaction's collateral transfers.
 */
export async function fetchAccountConditionalTransactions(
  account: Address,
  chainId: SupportedChain,
  primaryCollateral: Token | undefined,
  preferMarketIds: string[] = [],
): Promise<TransactionData[]> {
  const events = primaryCollateral
    ? await fetchConditionalEventsForAccountWidened(account, chainId, primaryCollateral)
    : await fetchConditionalEventsForAccount(account, chainId);
  return conditionalEventsToTransactions(dedupeConditionalEventLegs(events, preferMarketIds).events);
}

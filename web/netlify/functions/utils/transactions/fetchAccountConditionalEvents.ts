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
 * Known limit, inherited from the P/L: reading a router transaction whole assumes it carries one
 * user's operation. It holds for the relayers seen so far — the deduped leg amounts reconcile
 * exactly against the account's own router transfers — but a relayer that ever batched two
 * executors into one transaction would show each the other's rows.
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

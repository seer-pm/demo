/**
 * Gas planning for 7702 batches that may outgrow one transaction.
 *
 * EIP-7825 caps a transaction at 2^24 gas on every supported chain, and Gnosis blocks hold 17M, so
 * a batch is planned under a budget below both. Calls that have to land together (an approval and
 * the split it funds) form one unit; units are packed into batches in order and the batches are
 * sent one after another, each confirmed by the wallet.
 */

import type { Execution } from "./execution";

/** Gas one batch may plan for. The rest up to the EIP-7825 cap is margin for the wallet's estimation buffer and the 7702 delegate overhead. */
export const BATCH_GAS_BUDGET = 14_000_000n;

/**
 * `Router.splitPosition` wraps and transfers every outcome of the set one by one, so its gas grows
 * with the outcome count: about 150k per wrapped token on Gnosis, measured on an 80-token market.
 * Rounded up so the plan errs on the side of an extra batch.
 */
export const SPLIT_GAS_PER_OUTCOME = 155_000n;

/** An ERC20 approve, rounded up. */
export const APPROVE_GAS = 60_000n;

/** One AMM swap through the Lens router, rounded up from Seer pools. */
export const SWAP_GAS = 700_000n;

/**
 * Wrapped tokens a single split may mint and still fit a batch with its approval. A set larger
 * than this cannot be minted at all, since the router always mints the whole partition.
 */
export const MAX_SPLIT_OUTCOMES = Number((BATCH_GAS_BUDGET - APPROVE_GAS) / SPLIT_GAS_PER_OUTCOME);

export function estimateSplitGas(outcomeCount: number): bigint {
  return BigInt(outcomeCount) * SPLIT_GAS_PER_OUTCOME;
}

/** Calls that have to land in the same batch, with the gas they are planned to use. */
export interface CallUnit {
  calls: Execution[];
  gas: bigint;
}

/** Greedy packing: items go into the current batch while it fits the budget, in order. */
export function packByGas<T extends { gas: bigint }>(items: T[], budget: bigint = BATCH_GAS_BUDGET): T[][] {
  const batches: T[][] = [];
  let current: T[] = [];
  let currentGas = 0n;

  for (const item of items) {
    if (current.length > 0 && currentGas + item.gas > budget) {
      batches.push(current);
      current = [];
      currentGas = 0n;
    }
    current.push(item);
    currentGas += item.gas;
  }
  if (current.length > 0) {
    batches.push(current);
  }
  return batches;
}

/** The units packed into batches, each batch flattened into the calls to send. */
export function packUnits(units: CallUnit[], budget: bigint = BATCH_GAS_BUDGET): Execution[][] {
  return packByGas(units, budget).map((batch) => batch.flatMap((unit) => unit.calls));
}

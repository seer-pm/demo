import { type PoHRequest, isPOHVerifiedUserAtTime } from "./getPOHVerifiedUsers";

/** 200M SEER over 30 days. */
export const SEER_PER_DAY = 200000000 / 30;

/** Share of the daily emission going to the holdings pool and to the PoH pool respectively. */
export const POOL_SHARE_FACTOR = 0.25;

/**
 * Holdings below this (in collateral terms) are treated as nothing: excluded from the payout AND
 * from both denominators.
 *
 * The previous test was `totalHoldingPerUser.toLocaleString() !== "0"`, which is locale-dependent
 * and — because `toLocaleString` defaults to 3 fraction digits — silently dropped anything under
 * ~0.0005 while still counting it in the denominators, so the shares did not sum to 1. The measured
 * cost was tiny (~2e-8/day), but an explicit threshold applied to both sides is free.
 */
export const DUST_HOLDING = 1e-9;

export type UserHoldings = {
  [address: string]: { directHolding: number; indirectHolding: number; chainIds: Set<number> };
};

/**
 * Running per-timestamp state.
 *
 * Only per-user holdings live here. The two pool denominators are derived in `finalizeDistribution`
 * once every chain has folded in — see the note there.
 */
export type PerTsAccumulator = { userHoldingsAcrossChains: UserHoldings };

export function createAccumulator(): PerTsAccumulator {
  return { userHoldingsAcrossChains: {} };
}

export type ChainUsers = {
  [address: string]: { directHolding: number; indirectHolding: number; chainId: number };
};

/**
 * Folds one chain's per-user holdings (for a single timestamp) into the running cross-chain
 * accumulator.
 *
 * This used to also accumulate the pool denominators, one chain at a time. That is correct for the
 * linear total (addition is commutative) but WRONG for the PoH pool: it added
 * `sqrt(per-chain holding)` while the numerator uses `sqrt(cross-chain total)`, and sqrt is not
 * additive — `sqrt(a) + sqrt(b) > sqrt(a + b)`. The denominator was inflated for every multi-chain
 * PoH holder and the pool under-distributed (measured at 0.014%-0.064%/day). Both denominators are
 * now computed in one pass over the merged holdings, so numerator and denominator agree by
 * construction and the shares sum to 1.
 */
export function foldChainUsersIntoAccumulator(acc: PerTsAccumulator, users: ChainUsers) {
  for (const [holderAddress, holderData] of Object.entries(users)) {
    if (!acc.userHoldingsAcrossChains[holderAddress]) {
      acc.userHoldingsAcrossChains[holderAddress] = { directHolding: 0, indirectHolding: 0, chainIds: new Set() };
    }
    acc.userHoldingsAcrossChains[holderAddress].directHolding += holderData.directHolding ?? 0;
    acc.userHoldingsAcrossChains[holderAddress].indirectHolding += holderData.indirectHolding ?? 0;
    acc.userHoldingsAcrossChains[holderAddress].chainIds.add(holderData.chainId);
  }
}

export type AirdropRecord = {
  address: string;
  isPOHUser: boolean;
  timestamp: number;
  totalHolding: number;
  directHolding: number;
  indirectHolding: number;
  shareOfHolding: number;
  shareOfHoldingPoh: number;
  seerTokens: number;
  chainIds: number[];
};

/** Turns a fully-folded per-timestamp accumulator into the final per-user airdrop records. */
export function finalizeDistribution(
  acc: PerTsAccumulator,
  requestsGnosis: PoHRequest[],
  requestsMainnet: PoHRequest[],
  timestamp: number,
): AirdropRecord[] {
  const { userHoldingsAcrossChains } = acc;

  // Pass 1: cross-chain total per user, plus both denominators over exactly the users that will be
  // paid out.
  const eligible: { address: string; totalHolding: number; isPOHUser: boolean }[] = [];
  let total = 0;
  let pohTotal = 0;
  for (const [holderAddress, holderData] of Object.entries(userHoldingsAcrossChains)) {
    const totalHoldingPerUser = (holderData.directHolding ?? 0) + (holderData.indirectHolding ?? 0);
    if (!(totalHoldingPerUser > DUST_HOLDING)) {
      continue;
    }
    const isPOHUser =
      isPOHVerifiedUserAtTime(requestsMainnet, holderAddress, timestamp) ||
      isPOHVerifiedUserAtTime(requestsGnosis, holderAddress, timestamp);
    total += totalHoldingPerUser;
    if (isPOHUser) {
      pohTotal += Math.sqrt(totalHoldingPerUser);
    }
    eligible.push({ address: holderAddress, totalHolding: totalHoldingPerUser, isPOHUser });
  }

  // Pass 2: shares. Denominators now cover the same population as the numerators.
  const finalData: AirdropRecord[] = [];
  for (const { address, totalHolding, isPOHUser } of eligible) {
    const holderData = userHoldingsAcrossChains[address];
    const shareOfHolding = total > 0 ? totalHolding / total : 0;
    const shareOfHoldingPoh = isPOHUser && pohTotal > 0 ? Math.sqrt(totalHolding) / pohTotal : 0;
    finalData.push({
      address,
      isPOHUser,
      timestamp,
      totalHolding,
      directHolding: holderData.directHolding ?? 0,
      indirectHolding: holderData.indirectHolding ?? 0,
      shareOfHolding,
      shareOfHoldingPoh,
      seerTokens: SEER_PER_DAY * (shareOfHolding * POOL_SHARE_FACTOR + shareOfHoldingPoh * POOL_SHARE_FACTOR),
      chainIds: Array.from(holderData.chainIds),
    });
  }
  return finalData;
}

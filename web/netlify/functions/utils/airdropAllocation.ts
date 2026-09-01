/**
 * SEER airdrop allocation constants and conversions.
 *
 * The `airdrops` table and the SQL that aggregates it (`get_airdrop_summary_by_user`,
 * `refresh_airdrop_leaderboard`) deliberately return RAW `share_of_holding` sums rather than
 * SEER amounts, so that the emission rate and the pool factor are defined in exactly one place
 * and the SQL and TypeScript implementations cannot silently drift.
 *
 * Both read paths convert through this file:
 *   - get-airdrop-data-by-user.ts  (a single wallet's totals, portfolio Airdrop tab)
 *   - get-airdrop-leaderboard.mts  (every wallet, ranked, /leaderboard/airdrop)
 *
 * The rate and the factor themselves come from `airdropCalculation/constants.ts`, which is where
 * the WRITE path (`distribution.ts`, which stamps `seer_tokens_count` into every row) reads them.
 * They were briefly defined in both places; a read path scoring rows against a different factor
 * than the one they were written with is precisely the drift this file exists to prevent, so it
 * re-exports rather than redeclares.
 */

import { POOL_SHARE_FACTOR, SEER_PER_DAY } from "./airdropCalculation/constants";

export { POOL_SHARE_FACTOR, SEER_PER_DAY };

/** SEER earned from outcome-token holdings, from a summed `share_of_holding`. */
export function holdingsSeerFromShare(sumShareOfHolding: number): number {
  return SEER_PER_DAY * sumShareOfHolding * POOL_SHARE_FACTOR;
}

/** SEER earned from the Proof of Humanity pool, from a summed `share_of_holding_poh`. */
export function pohSeerFromShare(sumShareOfHoldingPoh: number): number {
  return SEER_PER_DAY * sumShareOfHoldingPoh * POOL_SHARE_FACTOR;
}

/**
 * Projection over `days` at the latest snapshot's share. Used for the "30-day estimate" figures,
 * which are forward-looking and are NOT part of any total.
 */
export function projectedSeerFromShare(shareOfHolding: number, days: number): number {
  return SEER_PER_DAY * days * shareOfHolding * POOL_SHARE_FACTOR;
}

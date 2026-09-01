/**
 * SEER airdrop allocation constants and conversions.
 *
 * The `airdrops` table and the SQL that aggregates it (`get_airdrop_summary_by_user`,
 * `refresh_airdrop_leaderboard`) deliberately return RAW `share_of_holding` sums rather than
 * SEER amounts, so that the emission rate and the 0.25 factor are defined in exactly one place
 * and the SQL and TypeScript implementations cannot silently drift.
 *
 * That one place is this file. Both read paths import from here:
 *   - get-airdrop-data-by-user.ts  (a single wallet's totals, portfolio Airdrop tab)
 *   - get-airdrop-leaderboard.mts  (every wallet, ranked, /leaderboard/airdrop)
 */

/** 200M SEER emitted over 30 days. */
export const SEER_PER_DAY = 200_000_000 / 30;

/** Share of the daily emission that goes to the holdings and PoH pools respectively. */
export const HOLDINGS_SHARE_FACTOR = 0.25;

/** SEER earned from outcome-token holdings, from a summed `share_of_holding`. */
export function holdingsSeerFromShare(sumShareOfHolding: number): number {
  return SEER_PER_DAY * sumShareOfHolding * HOLDINGS_SHARE_FACTOR;
}

/** SEER earned from the Proof of Humanity pool, from a summed `share_of_holding_poh`. */
export function pohSeerFromShare(sumShareOfHoldingPoh: number): number {
  return SEER_PER_DAY * sumShareOfHoldingPoh * HOLDINGS_SHARE_FACTOR;
}

/**
 * Projection over `days` at the latest snapshot's share. Used for the "30-day estimate" figures,
 * which are forward-looking and are NOT part of any total.
 */
export function projectedSeerFromShare(shareOfHolding: number, days: number): number {
  return SEER_PER_DAY * days * shareOfHolding * HOLDINGS_SHARE_FACTOR;
}

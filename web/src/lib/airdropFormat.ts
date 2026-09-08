/** `null` and `undefined` both render as an em dash: "no value", not "zero". */
export function formatSeer(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

/**
 * SEER rounded to whole tokens, for the leaderboard's numeric columns.
 *
 * The board reads as a ranking, not an accounting statement: three decimals on every one of five
 * columns made each row a wall of digits, and the fractions never decide a position — the ordering
 * comes from the SQL, not from what is rendered. `formatSeer` keeps its precision for the portfolio
 * tab, where a single wallet's own figure is the whole point. A sub-1 SEER allocation reads as "0"
 * here; the `% of airdrop` line under it is what distinguishes those wallets.
 */
export function formatSeerWhole(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function seerValue(value: number | null | undefined) {
  return `${formatSeer(value)} SEER`;
}

export function hasAmount(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * A share of the airdrop — of the whole programme on the portfolio tab, of a single pool on the
 * leaderboard. Two decimals because a typical holder sits well under 1% either way; one decimal
 * would round most of the userbase to "0.0%".
 */
export function formatPct(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

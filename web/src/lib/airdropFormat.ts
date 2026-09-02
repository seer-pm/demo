export function formatSeer(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

export function seerValue(value: number | undefined) {
  return `${formatSeer(value)} SEER`;
}

export function hasAmount(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * A share of the airdrop — of the whole programme on the portfolio tab, of a single pool on the
 * leaderboard. Two decimals because a typical holder sits well under 1% either way; one decimal
 * would round most of the userbase to "0.0%".
 */
export function formatPct(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

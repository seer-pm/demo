/**
 * Trader score presentation.
 *
 * The API computes the score and returns the tier with it (`get-pnl-leaderboard`), so the frontend
 * never recomputes anything — it only needs labels, bands and styles. That is why this is a table of
 * constants instead of a shared `@seer-pm/sdk` subpath: a new SDK subpath would need a
 * `vite.config.ts` alias and a `tsconfig.json` path ahead of the catch-all, plus an SDK rebuild
 * before `netlify dev` resolves it (see AGENTS.md). A five-entry enum is not worth that.
 *
 * Thresholds and weights live in `netlify/functions/utils/traderScore.ts` and are the single source
 * of truth. The bands and weights below are mirrored for display and are covered by a test that
 * fails if the two drift apart.
 */
export const TRADER_TIERS = ["Elite", "Great", "Good", "Average", "Weak"] as const;

export type TraderTier = (typeof TRADER_TIERS)[number];

export function isTraderTier(value: unknown): value is TraderTier {
  return typeof value === "string" && (TRADER_TIERS as readonly string[]).includes(value);
}

/**
 * Pill styles, from the `--tier-*` tokens in `index.scss` rather than the shared success/warning/
 * error accents: those are calibrated as accent colours and read at ~2:1 as text on their own
 * `-light` fill. Every pair below clears WCAG AA in both themes.
 *
 * Elite is solid where the rest are tinted. It shares the success hue with Great, and the previous
 * `ring-1 … /40` hairline was invisible at 390px, where the tier word used to be dropped entirely.
 */
export const TRADER_TIER_CLASS: Record<TraderTier, string> = {
  Elite: "bg-[oklch(var(--tier-elite-bg))] text-[oklch(var(--tier-elite-fg))]",
  Great: "bg-[oklch(var(--tier-great-bg))] text-[oklch(var(--tier-great-fg))]",
  Good: "bg-[oklch(var(--tier-good-bg))] text-[oklch(var(--tier-good-fg))]",
  Average: "bg-[oklch(var(--tier-average-bg))] text-[oklch(var(--tier-average-fg))]",
  Weak: "bg-[oklch(var(--tier-weak-bg))] text-[oklch(var(--tier-weak-fg))]",
};

/**
 * Shown instead of the full word below `lg`, where the leaderboard's six other columns leave no
 * room for "AVERAGE". Three letters keep the tier legible without colour being the sole carrier —
 * the board is horizontally scrolled on a phone, and Score is one of only three columns that fit.
 */
export const TRADER_TIER_ABBR: Record<TraderTier, string> = {
  Elite: "ELI",
  Great: "GRT",
  Good: "GOO",
  Average: "AVG",
  Weak: "WEA",
};

/** Inclusive lower bound of each tier, mirroring `TRADER_TIERS` in the scoring module. */
export const TRADER_TIER_BANDS: { tier: TraderTier; min: number; max: number | null; gloss: string }[] = [
  { tier: "Elite", min: 85, max: null, gloss: "Strong returns spread across many markets, with small losses." },
  { tier: "Great", min: 70, max: 84.9, gloss: "Profitable and consistent, with one weaker component." },
  { tier: "Good", min: 55, max: 69.9, gloss: "Net positive, but concentrated or with meaningful losses." },
  { tier: "Average", min: 40, max: 54.9, gloss: "Around break-even once losses and concentration are counted." },
  { tier: "Weak", min: 0, max: 39.9, gloss: "Losses outweigh gains, or profit came from a single market." },
];

export function tierBandLabel(band: (typeof TRADER_TIER_BANDS)[number]): string {
  return band.max == null ? `${band.min}–100` : `${band.min}–${band.max}`;
}

/**
 * The five weighted components, named as `netlify/functions/utils/traderScore.ts` names them.
 *
 * That module ends its header with "Name them accordingly in any UI", and the reason is that three
 * of these are easy to mislabel: `lossBurn` is a terminal-state total, not a max drawdown or a
 * worst single loss; `breadth` is profit concentration, not consistency over time; `returns` is ROI
 * with a capital denominator but no risk denominator.
 */
export const TRADER_SCORE_COMPONENTS: { key: string; label: string; weight: number; description: string }[] = [
  { key: "returns", label: "Returns", weight: 25, description: "Profit ÷ capital deployed (ROI)." },
  { key: "profitFactor", label: "Profit factor", weight: 25, description: "Money made ÷ money lost, across markets." },
  { key: "hitRate", label: "Hit rate", weight: 20, description: "Share of markets that ended in profit." },
  { key: "lossBurn", label: "Loss burn", weight: 15, description: "Total losses as a share of capital." },
  { key: "breadth", label: "Breadth", weight: 15, description: "Whether profit came from many markets or one." },
];

/**
 * Spelled out rather than an en dash: a bare glyph in a numeric column reads as a zero, a missing
 * value or "not applicable" depending on the reader, and 11 of 25 rows on a typical page carry it.
 * It also has to be nameable in prose — "N/A means the wallet has too little history to score"
 * works, while the same sentence about a dash has to describe the symbol before it can explain it.
 */
export const SCORE_UNAVAILABLE = "N/A";

/** Mirrors `MIN_SCORED_MARKETS` / `MIN_CAPITAL_USD` in the scoring module. */
export const MIN_SCORED_MARKETS = 3;
export const MIN_CAPITAL_USD = 100;

export const SCORE_ELIGIBILITY_HINT =
  `Wallets with fewer than ${MIN_SCORED_MARKETS} markets above $1 of capital at risk, or under ` +
  `$${MIN_CAPITAL_USD} of capital in this period, show ${SCORE_UNAVAILABLE} rather than a low score.`;

export const SCORE_FORMULA_HINT =
  "Trader Score 0-100: returns 25% · profit factor 25% · hit rate 20% · loss burn 15% · breadth 15%";

/** Shape of `scoreUnavailable` on a leaderboard row — see `traderScoreIneligibility` on the server. */
export type ScoreUnavailable = {
  reason: "markets" | "capital";
  scoredMarketCount: number;
  minScoredMarkets: number;
  minCapitalUsd: number;
};

/**
 * Why this wallet has no score, in one sentence.
 *
 * `marketCount` is every traded market; the gate counts only markets over $1 of capital at risk. A
 * row reading "182 traded markets" beside "needs at least 3 markets" is a flat contradiction, so
 * the markets case always names both numbers.
 */
export function scoreUnavailableReason(unavailable: ScoreUnavailable | undefined, marketCount: number): string {
  if (!unavailable) return `Not enough history to score. ${SCORE_ELIGIBILITY_HINT}`;
  if (unavailable.reason === "capital") {
    return `Not scored: under $${unavailable.minCapitalUsd} of capital at risk in this period.`;
  }
  const { scoredMarketCount, minScoredMarkets } = unavailable;
  return (
    `Not scored: only ${scoredMarketCount} of ${marketCount} traded ` +
    `${marketCount === 1 ? "market" : "markets"} had over $1 of capital at risk, and scoring needs ` +
    `${minScoredMarkets}.`
  );
}

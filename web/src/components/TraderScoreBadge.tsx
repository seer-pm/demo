import Popover from "@/components/Popover";
import {
  SCORE_UNAVAILABLE,
  type ScoreUnavailable,
  TRADER_SCORE_COMPONENTS,
  TRADER_TIER_ABBR,
  TRADER_TIER_CLASS,
  type TraderTier,
  isTraderTier,
  scoreUnavailableReason,
} from "@/lib/traderScore";
import clsx from "clsx";

/** Mirrors `TraderScoreBreakdown` in `netlify/functions/utils/traderScore.ts` (`?breakdown=1`). */
export type TraderScoreBreakdown = {
  method: string;
  score: number;
  tier: string;
  components: Record<string, number>;
  inputs: Record<string, number>;
  /** Present from the `"markets"` method on; the points below sum to `rawScore`, not to `score`. */
  sampleShrink?: { scoredMarketCount: number; factor: number; rawScore: number };
};

interface TraderScoreBadgeProps {
  score: number | null;
  tier: string | null;
  /** Every traded market, for the unscored explanation. The gate counts only non-dust ones. */
  marketCount: number;
  scoreUnavailable?: ScoreUnavailable;
  breakdown?: TraderScoreBreakdown;
}

const pct = (value: number) =>
  `${(value * 100).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

/** Signed points of probability, the unit the hit-rate edge is scored in. */
const signedPp = (value: number) => `${value >= 0 ? "+" : "−"}${Math.abs(value * 100).toFixed(1)}pp`;

/**
 * `TraderScoreBreakdown.inputs` names the returns ratio `roi` and the hit-rate component's measure
 * `hitEdge` (the raw `hitRate` and the `breakEvenHitRate` it is the difference of are also there).
 * Every other component uses the same key on both sides.
 */
const INPUT_KEY: Record<string, string> = { returns: "roi", hitRate: "hitEdge" };

/** How each component's raw ratio reads in the breakdown, in the unit the component is defined in. */
const FORMAT_INPUT: Record<string, (value: number) => string> = {
  returns: pct,
  profitFactor: (v) => (Number.isFinite(v) ? `${v.toFixed(2)}×` : "∞"),
  hitRate: signedPp,
  lossBurn: pct,
  breadth: pct,
};

/**
 * The five weighted components behind one wallet's score.
 *
 * The server already computes this on every row; showing it is what turns a bare "Weak" from an
 * accusation into a diagnosis. Each row reports the raw ratio, the 0-100 sub-score it maps to, and
 * the points it actually contributed — so a trader can see which component cost them.
 *
 * The points sum to the weighted mean, which is not the score: a confidence shrink scales the
 * distance from 50 by `n / (n + 10)` afterwards. Leaving that out would make the table look like it
 * had an arithmetic error on every thin book, so it gets its own footer row.
 */
function ScoreBreakdownPanel({
  score,
  tier,
  breakdown,
}: { score: number; tier: TraderTier; breakdown: TraderScoreBreakdown }) {
  return (
    <div className="w-[290px] text-[12px] text-black-primary">
      <p className="font-semibold text-[13px]">
        Trader Score {score.toFixed(1)} <span className="text-black-secondary font-normal">· {tier}</span>
      </p>
      <table className="w-full mt-2">
        <thead>
          <tr className="text-black-secondary text-[10px] uppercase tracking-wide">
            <th className="text-left font-medium pb-1">Component</th>
            <th className="text-right font-medium pb-1">Value</th>
            <th className="text-right font-medium pb-1">Points</th>
          </tr>
        </thead>
        <tbody>
          {TRADER_SCORE_COMPONENTS.map(({ key, label, weight }) => {
            const sub = breakdown.components[key] ?? 0;
            const raw = breakdown.inputs[INPUT_KEY[key] ?? key];
            const points = (sub * weight) / 100;
            return (
              <tr key={key}>
                <td className="py-1 pr-2">
                  <span>{label}</span>
                  <span className="block h-1 mt-1 bg-black-medium rounded-[1px]" aria-hidden>
                    <span
                      className="block h-1 bg-purple-primary rounded-[1px]"
                      style={{ width: `${Math.max(0, Math.min(100, sub))}%` }}
                    />
                  </span>
                </td>
                <td className="py-1 text-right align-top tabular-nums text-black-secondary">
                  {raw == null ? "—" : (FORMAT_INPUT[key] ?? ((v: number) => v.toFixed(2)))(raw)}
                </td>
                <td className="py-1 text-right align-top tabular-nums font-medium">
                  {points.toFixed(1)}
                  <span className="text-black-secondary font-normal"> / {weight}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {breakdown.sampleShrink && breakdown.sampleShrink.factor < 0.995 ? (
        <p className="mt-2 pt-2 border-t border-black-medium text-[11px] text-black-secondary">
          Weighted <span className="tabular-nums text-black-primary">{breakdown.sampleShrink.rawScore.toFixed(1)}</span>
          , held{" "}
          <span className="tabular-nums text-black-primary">{Math.round(breakdown.sampleShrink.factor * 100)}%</span> of
          the way from 50 on {breakdown.sampleShrink.scoredMarketCount}{" "}
          {breakdown.sampleShrink.scoredMarketCount === 1 ? "scored market" : "scored markets"} →{" "}
          <span className="tabular-nums text-black-primary">{score.toFixed(1)}</span>. Thin books read undecided rather
          than excellent.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Score as a tier-coloured pill.
 *
 * Geometry is fixed rather than content-sized: the number and the tier word each get a constant
 * slot, so every pill is the same width and the digits form a column the way `Profit/Loss` and
 * `ROI` do. Sizing the pill to its label made `48.1` sit left of `79.2` and defeated `tabular-nums`.
 *
 * The tier is always spelled — abbreviated below `lg`, in full above it. It used to disappear under
 * `lg`, leaving colour as the sole carrier of the tier on the one breakpoint where `Score` is one of
 * only three columns that fit on screen.
 *
 * A null score renders as N/A carrying its own reason, deliberately not a 0, which would read as
 * "judged and bad".
 */
export function TraderScoreBadge({ score, tier, marketCount, scoreUnavailable, breakdown }: TraderScoreBadgeProps) {
  if (score == null || !Number.isFinite(score) || !isTraderTier(tier)) {
    const reason = scoreUnavailableReason(scoreUnavailable, marketCount);
    return (
      <span
        className="inline-block text-[oklch(var(--tier-none-fg))] text-[11px] font-medium uppercase tracking-wide"
        title={reason}
        aria-label={`Trader score not available. ${reason}`}
      >
        {SCORE_UNAVAILABLE}
      </span>
    );
  }

  const label = `Trader score ${score.toFixed(1)} of 100, ${tier}`;
  const pill = (
    <span
      className={clsx(
        "inline-grid grid-cols-[4.5ch_3ch] lg:grid-cols-[4.5ch_7ch] items-center gap-1.5",
        "rounded-[1px] px-2 py-1 font-semibold tabular-nums",
        TRADER_TIER_CLASS[tier],
      )}
    >
      <span className="text-right">{score.toFixed(1)}</span>
      <span className="text-left text-[11px] font-medium uppercase tracking-wide">
        <span className="lg:hidden">{TRADER_TIER_ABBR[tier]}</span>
        <span className="hidden lg:inline">{tier}</span>
      </span>
    </span>
  );

  if (!breakdown) {
    return (
      <span className="inline-block" aria-label={label} title={label}>
        {pill}
      </span>
    );
  }

  return (
    <Popover
      label={`${label}. Show score breakdown.`}
      trigger={pill}
      content={<ScoreBreakdownPanel score={score} tier={tier} breakdown={breakdown} />}
    />
  );
}

export default TraderScoreBadge;

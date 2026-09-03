import Popover from "@/components/Popover";
import { QuestionIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import {
  SCORE_ELIGIBILITY_HINT,
  TRADER_SCORE_COMPONENTS,
  TRADER_TIER_BANDS,
  TRADER_TIER_CLASS,
  tierBandLabel,
} from "@/lib/traderScore";
import clsx from "clsx";

/**
 * What the tiers mean and how the score is computed.
 *
 * This lives in the `Score` column header rather than as a legend row above the table: the bands are
 * a fact a reader needs once, and a permanent row would spend above-the-fold height on every load
 * and sit between a returning trader and row 1. Anchoring it here also means it behaves identically
 * at 1440px and at 390px — unlike the `title` tooltip it replaces, which did not exist on touch, on
 * the exact breakpoint where the tier word is abbreviated.
 */
function LegendContent() {
  return (
    <div className="w-[320px] text-[12px] text-black-primary space-y-3">
      <div>
        <p className="font-semibold text-[13px]">Trader Score</p>
        <p className="text-black-secondary mt-0.5">
          A 0–100 rating of how a wallet traded the markets in this period, from its per-market profit and loss.
        </p>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wide text-black-secondary font-medium mb-1.5">Tiers</p>
        <ul className="space-y-1.5">
          {TRADER_TIER_BANDS.map((band) => (
            <li key={band.tier} className="flex gap-2">
              <span
                className={clsx(
                  "shrink-0 w-[4.75rem] text-center rounded-[1px] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  TRADER_TIER_CLASS[band.tier],
                )}
              >
                {band.tier}
              </span>
              <span className="min-w-0">
                <span className="font-medium tabular-nums">{tierBandLabel(band)}</span>
                <span className="text-black-secondary"> — {band.gloss}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wide text-black-secondary font-medium mb-1.5">
          How it is calculated
        </p>
        <table className="w-full">
          <tbody>
            {TRADER_SCORE_COMPONENTS.map(({ key, label, weight, description }) => (
              <tr key={key}>
                <td className="align-top py-0.5 pr-2 whitespace-nowrap font-medium tabular-nums">{weight}%</td>
                <td className="align-top py-0.5">
                  <span className="font-medium">{label}</span>
                  <span className="text-black-secondary"> — {description}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-black-secondary mt-1.5">
          The weighted mean is then pulled toward 50 by <span className="tabular-nums">n ÷ (n + 10)</span>, where{" "}
          <span className="tabular-nums">n</span> is the number of markets counted, so a wallet with few of them reads
          undecided rather than excellent. Click a score to see both numbers.
        </p>
      </div>

      <p className="text-black-secondary border-t border-separator-100 pt-2">{SCORE_ELIGIBILITY_HINT}</p>

      <a
        className="inline-block text-purple-primary font-medium hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-primary"
        href={paths.leaderboardGuide()}
        target="_blank"
        rel="noopener noreferrer"
      >
        Full method →
      </a>
    </div>
  );
}

export function TraderScoreLegend() {
  return (
    <Popover
      label="What the Trader Score means and how it is calculated"
      trigger={
        <span
          className="inline-flex size-4 items-center justify-center text-black-secondary [&>svg]:size-4"
          aria-hidden
        >
          <QuestionIcon fill="currentColor" />
        </span>
      }
      content={<LegendContent />}
    />
  );
}

export default TraderScoreLegend;

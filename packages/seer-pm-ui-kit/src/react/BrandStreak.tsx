import { convergencePaths } from "../motifs";

const STREAK_PATHS = convergencePaths({ pitch: 43, wedge: 28, focus: [600, 150] });

/** Decorative convergence motif in the current text colour, converging on the right edge. */
export function BrandStreak({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 600 300" fill="currentColor" aria-hidden="true" focusable="false">
      {STREAK_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

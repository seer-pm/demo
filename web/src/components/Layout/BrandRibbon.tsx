import { convergencePaths } from "@seer-pm/ui-kit";

const RIBBON_PATHS = convergencePaths({ start: 15, pitch: 145, wedge: 90, focus: [1740, 500] });

/** Seven tapered wedges echo the supplied identity, converging just beyond the right edge. */
export function BrandRibbon() {
  return (
    <div className="event-brand-ribbon" aria-hidden="true">
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="none" fill="currentColor" focusable="false">
        {RIBBON_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </div>
  );
}

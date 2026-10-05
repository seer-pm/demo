/** Decorative convergence motif, drawn from the supplied Seer brand reference. */
export function BrandStreak({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 600 300" fill="currentColor" aria-hidden="true" focusable="false">
      {[0, 43, 86, 129, 172, 215, 258].map((y) => (
        <path key={y} d={`M0 ${y} L600 150 L0 ${y + 28} Z`} />
      ))}
    </svg>
  );
}

/** Seven tapered wedges echo the supplied identity, converging just beyond the right edge. */
export function BrandRibbon() {
  return (
    <div className="event-brand-ribbon" aria-hidden="true">
      <svg viewBox="0 0 1600 160" preserveAspectRatio="none" fill="currentColor" focusable="false">
        {[0, 1, 2, 3, 4, 5, 6].map((line) => (
          <path key={line} d={`M0 ${7 + line * 22} L1740 80 L0 ${21 + line * 22} Z`} />
        ))}
      </svg>
    </div>
  );
}

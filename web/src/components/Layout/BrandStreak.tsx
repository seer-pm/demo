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

/** Thin vector ribbons span the page without losing definition at any screen size. */
export function BrandRibbon() {
  return (
    <div className="event-brand-ribbon" aria-hidden="true">
      <svg viewBox="0 0 1600 40" preserveAspectRatio="none" fill="none" focusable="false">
        {[0, 1, 2, 3, 4].map((line) => (
          <path
            key={line}
            d={`M-20 ${5 + line * 7} C450 ${5 + line * 7}, 1050 ${2 + line * 4}, 1620 ${2 + line * 4}`}
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
}

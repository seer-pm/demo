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

/** Broad vector strokes preserve the identity motif at every viewport width. */
export function BrandRibbon() {
  return (
    <div className="event-brand-ribbon" aria-hidden="true">
      <svg viewBox="0 0 1600 56" preserveAspectRatio="none" fill="none" focusable="false">
        {[0, 1, 2, 3].map((line) => (
          <path
            key={line}
            d={`M-20 ${10 + line * 12} C450 ${10 + line * 12}, 1050 ${5 + line * 9}, 1620 ${5 + line * 9}`}
            stroke="currentColor"
            strokeWidth="4"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
}

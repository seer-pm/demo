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

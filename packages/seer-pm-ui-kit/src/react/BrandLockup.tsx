/** Bird and wordmark, drawn as masks in the surrounding text colour. Needs components.css. */
export function BrandLockup() {
  return (
    <span className="seer-brand-lockup" role="img" aria-label="Seer">
      <span className="seer-brand-bird" aria-hidden="true" />
      <span className="seer-brand-wordmark" aria-hidden="true" />
    </span>
  );
}

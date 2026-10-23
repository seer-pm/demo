export type BrandLockupProps = {
  /** An application's name, set after the wordmark behind a hairline ("Futarchy", "Deep"). */
  appName?: string;
};

/** Bird and wordmark, drawn as masks in the surrounding text colour. Needs components.css. */
export function BrandLockup({ appName }: BrandLockupProps = {}) {
  return (
    <span className="seer-brand-lockup" role="img" aria-label={appName ? `Seer ${appName}` : "Seer"}>
      <span className="seer-brand-bird" aria-hidden="true" />
      <span className="seer-brand-wordmark" aria-hidden="true" />
      {appName && (
        <span className="seer-brand-app" aria-hidden="true">
          {appName}
        </span>
      )}
    </span>
  );
}

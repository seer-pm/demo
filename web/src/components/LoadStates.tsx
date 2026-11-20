import { Alert } from "@/components/Alert";
import { PRIMARY_BUTTON_CLASS, QUIET_BUTTON_CLASS } from "@/lib/buttonClasses";

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="shimmer-container w-full h-[200px]" aria-hidden />
    </div>
  );
}

/** A list that never loaded: what failed, a reassurance about funds, the raw cause, and a retry. */
export function LoadError({
  title,
  description,
  error,
  onRetry,
  isRetrying,
}: {
  title: string;
  description: string;
  error: unknown;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const message = error instanceof Error ? error.message : undefined;
  return (
    <Alert type="error" title={title}>
      <div className="space-y-3">
        <p>{description}</p>
        {message && <p className="text-[13px] opacity-80 break-words">{message}</p>}
        <button type="button" className={PRIMARY_BUTTON_CLASS} disabled={isRetrying} onClick={onRetry}>
          {isRetrying ? "Retrying…" : "Try again"}
        </button>
      </div>
    </Alert>
  );
}

/**
 * Shown above a list that is still on screen after a background refresh failed, so one bad poll
 * doesn't replace what the user is reading with an error.
 */
export function RefreshError({
  subject,
  onRetry,
  isRetrying,
}: {
  subject: string;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <output className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border border-separator-100 bg-base-200/40 px-4 py-2 text-[14px]">
      <p>Couldn't refresh {subject}. Showing what loaded last.</p>
      <button type="button" className={QUIET_BUTTON_CLASS} disabled={isRetrying} onClick={onRetry}>
        {isRetrying ? "Retrying…" : "Try again"}
      </button>
    </output>
  );
}

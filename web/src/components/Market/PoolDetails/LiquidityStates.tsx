import { Alert } from "@/components/Alert";

const INLINE_ACTION_CLASSES = "font-semibold underline underline-offset-2 disabled:opacity-60";

export function LiquidityErrorState({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {
  return (
    <Alert type="error" className="mb-5">
      <span>Couldn't load this pool's liquidity.</span>{" "}
      <button type="button" onClick={onRetry} disabled={isRetrying} className={INLINE_ACTION_CLASSES}>
        {isRetrying ? "Retrying…" : "Try again"}
      </button>
    </Alert>
  );
}

export function LiquidityEmptyState({
  message = "This pool has no liquidity yet.",
  onAddLiquidity,
  className,
}: {
  message?: string;
  onAddLiquidity?: () => void;
  className?: string;
}) {
  return (
    <Alert type="warning" className={className}>
      <span>{message}</span>{" "}
      {onAddLiquidity && (
        <button type="button" onClick={onAddLiquidity} className={INLINE_ACTION_CLASSES}>
          Add liquidity
        </button>
      )}
    </Alert>
  );
}

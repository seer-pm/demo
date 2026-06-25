import Button from "@/components/Form/Button";
import type { MarketEventSuggestion, RecommendMarketEventsResponse } from "@/types/market-events";
import { formatInTimeZone } from "date-fns-tz";

function formatSuggestionDate(eventAt: string): string {
  const date = new Date(eventAt);
  if (Number.isNaN(date.getTime())) {
    return eventAt;
  }

  return `${formatInTimeZone(date, "UTC", "MMM d, yyyy · HH:mm")} UTC`;
}

function formatEmptyResultContent(content: string): string {
  try {
    const parsed = JSON.parse(content) as { suggestions?: unknown[] };
    if (Array.isArray(parsed.suggestions) && parsed.suggestions.length === 0) {
      return "No new relevant future dates identified.";
    }
  } catch {
    // fall through to raw content
  }

  return content;
}

export function MarketEventSuggestionsModalContent({
  isLoading,
  result,
  errorMessage,
  onClose,
  onAddSuggestion,
}: {
  isLoading: boolean;
  result: RecommendMarketEventsResponse | null;
  errorMessage?: string | null;
  onClose: () => void;
  onAddSuggestion: (suggestion: MarketEventSuggestion) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="shimmer-container h-32 rounded-lg" />
        <p className="text-[13px] text-base-content/60 text-center">Finding upcoming dates with AI…</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="space-y-4">
        <p className="text-[14px] text-error-primary">{errorMessage}</p>
        <div className="flex justify-end pt-2">
          <Button text="Close" type="button" variant="secondary" onClick={onClose} />
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const hasSuggestions = result.suggestions.length > 0;

  return (
    <div className="space-y-4">
      {!hasSuggestions && result.content && (
        <p className="text-[14px] text-base-content/80">{formatEmptyResultContent(result.content)}</p>
      )}

      {hasSuggestions && (
        <ul className="space-y-3 max-h-[360px] overflow-y-auto">
          {result.suggestions.map((suggestion) => (
            <li
              key={`${suggestion.eventAt}-${suggestion.title}`}
              className="flex items-start justify-between gap-3 rounded-lg border border-base-300 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-wide uppercase text-base-content/40 mb-1">
                  {formatSuggestionDate(suggestion.eventAt)}
                </p>
                <p className="text-[14px] leading-snug">{suggestion.title}</p>
                {suggestion.description && (
                  <p className="text-[13px] leading-snug text-base-content/60 mt-1">{suggestion.description}</p>
                )}
              </div>
              <button
                type="button"
                className="shrink-0 text-[12px] font-semibold text-purple-primary hover:underline"
                onClick={() => onAddSuggestion(suggestion)}
              >
                Add event
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end pt-2">
        <Button text="Close" type="button" variant="secondary" onClick={onClose} />
      </div>
    </div>
  );
}

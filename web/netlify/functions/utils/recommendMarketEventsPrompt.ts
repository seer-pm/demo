export type MarketEventSuggestion = {
  eventAt: string;
  title: string;
  description?: string;
};

type GrokSuggestionsPayload = {
  suggestions?: Array<{
    date?: string;
    title?: string;
    description?: string;
  }>;
};

export const MARKET_EVENT_SUGGESTIONS_SCHEMA = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Event date in YYYY-MM-DD HH:MM:SS UTC format. Use 00:00:00 UTC when the time is unknown.",
          },
          title: {
            type: "string",
            description:
              "Concise event name only. Do not include parenthetical details, confirmation status, or qualifiers.",
          },
          description: {
            type: "string",
            description:
              "Additional context: confirmation source, status, or uncertainty markers like (Expected) or (Likely). Use an empty string when there is no extra context.",
          },
        },
        required: ["date", "title", "description"],
        additionalProperties: false,
      },
    },
  },
  required: ["suggestions"],
  additionalProperties: false,
} as const;

function parseUtcDateToIso(dateText: string): string | null {
  const match = dateText.trim().match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+UTC$/);
  if (!match) {
    return null;
  }

  const isoCandidate = `${match[1]}T${match[2]}Z`;
  const parsed = new Date(isoCandidate);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

type KnownMarketEventDate = {
  date?: string;
  title?: string;
  description?: string;
};

export function formatKnownDatesForPrompt(knownDates: KnownMarketEventDate[]): string {
  const lines = knownDates
    .map((item) => {
      const date = item.date?.trim();
      const title = item.title?.trim();
      if (!date || !title) {
        return null;
      }
      const description = item.description?.trim();
      if (description) {
        return `${date} | Title: ${title} | Description: ${description}`;
      }
      return `${date} | Title: ${title}`;
    })
    .filter((line): line is string => line !== null);

  return lines.length > 0 ? lines.join("\n") : "None";
}

export function buildRecommendEventsPrompt(marketQuestion: string, knownDates: string, currentDate: string): string {
  return `You are an expert in prediction markets.

For the following prediction market question:

"${marketQuestion}"

Find ONLY new future important dates (from today onwards) that could significantly impact the market price or resolution.

Here are the dates I already know about this market (do NOT repeat them under any circumstances):

${knownDates}

If you need up-to-date information (after November 2024), use web_search or x_search tools to find confirmed dates.

Only include dates that are confirmed or strongly expected. If a date is not officially confirmed, note it clearly as "(Expected)" or "(Likely)" in the description field (not in the title).

For each suggestion, split the event into two fields:
- title: a concise event name (no parenthetical details or confirmation status)
- description: additional context such as confirmation source or uncertainty markers; use an empty string if there is no extra context

Example:
- title: Iceland's 2026 EU membership negotiations referendum
- description: Confirmed by parliament vote on 28 May 2026

Return an empty suggestions array if there are no new relevant future dates.

Current date: ${currentDate}`;
}

export function parseRecommendEventsContent(content: string): MarketEventSuggestion[] {
  if (!content.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(content) as GrokSuggestionsPayload;
    const suggestions: MarketEventSuggestion[] = [];

    for (const item of parsed.suggestions ?? []) {
      const date = item.date?.trim();
      const title = item.title?.trim();
      if (!date || !title) {
        continue;
      }

      const eventAt = parseUtcDateToIso(date);
      if (!eventAt) {
        continue;
      }

      const description = item.description?.trim();
      suggestions.push({
        eventAt,
        title,
        ...(description ? { description } : {}),
      });
    }

    return suggestions;
  } catch {
    return [];
  }
}

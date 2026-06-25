export type MarketEvent = {
  id: string;
  market_id: string;
  chain_id: number;
  title: string;
  description: string | null;
  event_at: string;
};

export type DisplayMarketEvent = {
  id: string;
  title: string;
  description: string | null;
  eventAt: Date;
  isResolution?: boolean;
};

export type MarketEventSuggestion = {
  eventAt: string;
  title: string;
  description?: string;
};

export type KnownMarketEventDate = {
  date: string;
  title: string;
  description?: string;
};

export type RecommendMarketEventsResponse = {
  content: string;
  suggestions: MarketEventSuggestion[];
};

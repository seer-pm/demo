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

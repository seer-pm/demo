import type { AdminMarketEvent } from "@/hooks/admin/useAdminMarketEvents";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { utcToPickerDate } from "@/lib/date";
import type { MarketEvent, MarketEventSuggestion } from "@/types/market-events";
import type { Market } from "@seer-pm/sdk";

export type EventFormState = {
  id?: string;
  marketId: string;
  chainId: number;
  title: string;
  description: string;
  eventAt: Date | null;
};

export const emptyEventForm = (): EventFormState => ({
  marketId: "",
  chainId: Number(Object.keys(SUPPORTED_CHAINS)[0]),
  title: "",
  description: "",
  eventAt: null,
});

export function createEventFormForMarket(market: Market): EventFormState {
  return {
    marketId: market.id,
    chainId: market.chainId,
    title: "",
    description: "",
    eventAt: null,
  };
}

export function adminEventToForm(event: AdminMarketEvent): EventFormState {
  return marketEventToForm(event);
}

export function marketEventToForm(event: MarketEvent): EventFormState {
  return {
    id: event.id,
    marketId: event.market_id,
    chainId: event.chain_id,
    title: event.title,
    description: event.description ?? "",
    eventAt: utcToPickerDate(event.event_at),
  };
}

export function createEventFormFromSuggestion(market: Market, suggestion: MarketEventSuggestion): EventFormState {
  return {
    marketId: market.id,
    chainId: market.chainId,
    title: suggestion.title.trim(),
    description: suggestion.description?.trim() ?? "",
    eventAt: utcToPickerDate(suggestion.eventAt),
  };
}

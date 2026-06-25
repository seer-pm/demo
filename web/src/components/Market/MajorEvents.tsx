import Button from "@/components/Form/Button";
import { MarketEventFormContent } from "@/components/admin/MarketEventForm";
import { MarketEventSuggestionsModalContent } from "@/components/admin/MarketEventSuggestionsModal";
import {
  type EventFormState,
  createEventFormForMarket,
  createEventFormFromSuggestion,
  marketEventToForm,
} from "@/components/admin/marketEventFormState";
import { useDeleteMarketEvent, useIsAdmin, useRecommendMarketEvents } from "@/hooks/admin/useAdminMarketEvents";
import { useIsConnectedAndSignedIn } from "@/hooks/useIsConnectedAndSignedIn";
import { useMarketEvents } from "@/hooks/useMarketEvents";
import { useModal } from "@/hooks/useModal";
import type {
  DisplayMarketEvent,
  KnownMarketEventDate,
  MarketEvent,
  MarketEventSuggestion,
  RecommendMarketEventsResponse,
} from "@/types/market-events";
import type { Market } from "@seer-pm/sdk";
import { MarketTypes, getMarketType } from "@seer-pm/sdk";
import clsx from "clsx";
import { formatInTimeZone } from "date-fns-tz";
import { useEffect, useMemo, useState } from "react";

const ACTIVE_EVENT_WINDOW_MS = 10 * 60 * 1000;

function isEventActive(eventAt: Date, nowMs: number): boolean {
  return Math.abs(eventAt.getTime() - nowMs) <= ACTIVE_EVENT_WINDOW_MS;
}

function getResolutionDescription(market: Market, questionIndex: number): string | null {
  const marketType = getMarketType(market);
  if (marketType === MarketTypes.MULTI_SCALAR || market.questions.length > 1) {
    return market.outcomes[questionIndex] ?? null;
  }
  return null;
}

function buildKnownDates(events: DisplayMarketEvent[]): KnownMarketEventDate[] {
  return events.map((event) => ({
    date: `${formatInTimeZone(event.eventAt, "UTC", "yyyy-MM-dd HH:mm:ss")} UTC`,
    title: event.title,
    ...(event.description ? { description: event.description } : {}),
  }));
}

function buildDisplayEvents(market: Market, dbEvents: MarketEvent[], nowMs: number): DisplayMarketEvent[] {
  const now = new Date(nowMs);
  const events: DisplayMarketEvent[] = dbEvents.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    eventAt: new Date(event.event_at),
    isResolution: event.title.trim().toLowerCase() === "reality.eth resolution" || undefined,
  }));

  market.questions.forEach((question, questionIndex) => {
    if (question.finalize_ts <= 0) {
      return;
    }

    const resolutionDate = new Date(question.finalize_ts * 1000);
    if (resolutionDate < now) {
      return;
    }

    events.push({
      id: `resolution-${question.id}`,
      title: "Reality.eth Resolution",
      description: getResolutionDescription(market, questionIndex),
      eventAt: resolutionDate,
      isResolution: true,
    });
  });

  return events.sort((a, b) => a.eventAt.getTime() - b.eventAt.getTime());
}

function formatEventDate(date: Date, isFirst = false): string {
  if (isFirst) {
    const datePart = formatInTimeZone(date, "UTC", "MMM d, yyyy");
    return `${datePart} · ${formatInTimeZone(date, "UTC", "HH:mm")} UTC`;
  }

  const datePart = formatInTimeZone(date, "UTC", "MMM d, yyyy").toUpperCase();
  const isMidnightUtc = date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0;

  if (isMidnightUtc) {
    return datePart;
  }

  return `${datePart} · ${formatInTimeZone(date, "UTC", "HH:mm")} UTC`;
}

function eventClassName(event: DisplayMarketEvent, index: number, active: boolean): string {
  return clsx(
    "event",
    index === 0 ? "is-next" : `is-future-${Math.min(index, 4)}`,
    event.isResolution && "is-resolution",
    active && "is-active",
  );
}

export default function MajorEvents({ market }: { market: Market }) {
  const { data: dbEvents = [], isLoading: isEventsLoading } = useMarketEvents(market);
  const isSignedIn = useIsConnectedAndSignedIn();
  const { data: isAdmin } = useIsAdmin();
  const showAdminActions = isSignedIn && isAdmin === true;
  const {
    Modal: CreateEventModal,
    openModal: openCreateEventModal,
    closeModal: closeCreateEventModal,
  } = useModal("market-page-create-event-modal");
  const {
    Modal: EditEventModal,
    openModal: openEditEventModal,
    closeModal: closeEditEventModal,
  } = useModal("market-page-edit-event-modal");
  const {
    Modal: DeleteEventModal,
    openModal: openDeleteEventModal,
    closeModal: closeDeleteEventModal,
  } = useModal("market-page-delete-event-modal");
  const {
    Modal: SuggestionsModal,
    openModal: openSuggestionsModal,
    closeModal: closeSuggestionsModal,
  } = useModal("market-page-suggest-events-modal");
  const deleteEvent = useDeleteMarketEvent(closeDeleteEventModal);
  const recommendEvents = useRecommendMarketEvents();
  const [createFormInitial, setCreateFormInitial] = useState<EventFormState | null>(null);
  const [editFormInitial, setEditFormInitial] = useState<EventFormState | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<MarketEvent | null>(null);
  const [suggestionResult, setSuggestionResult] = useState<RecommendMarketEventsResponse | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const events = useMemo(() => buildDisplayEvents(market, dbEvents, now), [market, dbEvents, now]);

  const openCreateEvent = () => {
    setCreateFormInitial(createEventFormForMarket(market));
    openCreateEventModal();
  };

  const openEditEvent = (eventId: string) => {
    const dbEvent = dbEvents.find((event) => event.id === eventId);
    if (!dbEvent) {
      return;
    }
    setEditFormInitial(marketEventToForm(dbEvent));
    openEditEventModal();
  };

  const openDeleteEvent = (eventId: string) => {
    const dbEvent = dbEvents.find((event) => event.id === eventId);
    if (!dbEvent) {
      return;
    }
    setDeletingEvent(dbEvent);
    openDeleteEventModal();
  };

  const closeSuggestions = () => {
    closeSuggestionsModal();
    setSuggestionResult(null);
    recommendEvents.reset();
  };

  const openSuggestEvents = () => {
    setSuggestionResult(null);
    recommendEvents.reset();
    openSuggestionsModal();
    recommendEvents.mutate(
      {
        marketQuestion: market.marketName,
        knownDates: buildKnownDates(events),
      },
      {
        onSuccess: (data) => setSuggestionResult(data),
      },
    );
  };

  const openCreateFromSuggestion = (suggestion: MarketEventSuggestion) => {
    closeSuggestions();
    setCreateFormInitial(createEventFormFromSuggestion(market, suggestion));
    openCreateEventModal();
  };

  if (isEventsLoading || (events.length === 0 && !showAdminActions)) {
    return null;
  }

  return (
    <>
      <CreateEventModal
        className="max-w-[560px]"
        title="Create Event"
        content={
          <MarketEventFormContent initial={createFormInitial} onClose={closeCreateEventModal} lockedMarket={market} />
        }
      />
      <EditEventModal
        className="max-w-[560px]"
        title="Edit Event"
        content={
          <MarketEventFormContent initial={editFormInitial} onClose={closeEditEventModal} lockedMarket={market} />
        }
      />
      <DeleteEventModal
        className="max-w-[440px]"
        title="Delete Event"
        content={
          deletingEvent && (
            <div className="space-y-4">
              <p>
                Delete <strong>{deletingEvent.title}</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <Button text="Cancel" type="button" variant="secondary" onClick={closeDeleteEventModal} />
                <Button
                  text="Delete"
                  type="button"
                  variant="secondary"
                  disabled={deleteEvent.isPending}
                  onClick={() => deleteEvent.mutate(deletingEvent.id)}
                />
              </div>
            </div>
          )
        }
      />
      <SuggestionsModal
        className="max-w-[640px]"
        title="AI event suggestions"
        content={
          <MarketEventSuggestionsModalContent
            isLoading={recommendEvents.isPending}
            result={suggestionResult}
            errorMessage={recommendEvents.error?.message}
            onClose={closeSuggestions}
            onAddSuggestion={openCreateFromSuggestion}
          />
        }
      />
      <section className="card-box events-card">
        <div className="section-h">
          <h3>
            Major Events
            {events.length > 0 && <span className="badge">{events.length} upcoming</span>}
          </h3>
          {showAdminActions && (
            <button type="button" className="events-admin-add" onClick={openCreateEvent}>
              Add event
            </button>
          )}
        </div>
        {events.length === 0 && showAdminActions && <p className="events-empty">No upcoming events yet.</p>}
        {events.length > 0 && (
          <div className="events-list">
            {events.map((event, index) => (
              <div key={event.id} className={eventClassName(event, index, isEventActive(event.eventAt, now))}>
                <div className="event-marker" />
                <div className="event-info">
                  <div className="event-date">{formatEventDate(event.eventAt, index === 0)}</div>
                  <div className="event-name">
                    {event.title}

                    {event.isResolution && <span className="resolution-tag">Resolution</span>}
                  </div>
                  {event.description && <div className="event-detail">{event.description}</div>}
                  {showAdminActions && !event.isResolution && (
                    <div className="event-actions">
                      <button type="button" className="event-edit" onClick={() => openEditEvent(event.id)}>
                        Edit
                      </button>
                      <button type="button" className="event-delete" onClick={() => openDeleteEvent(event.id)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {showAdminActions && (
          <div className="events-ai">
            <Button
              text="Get AI suggestions"
              type="button"
              size="small"
              variant="secondary"
              isLoading={recommendEvents.isPending}
              title="Use AI to find important future dates for this market"
              onClick={openSuggestEvents}
            />
          </div>
        )}
      </section>
    </>
  );
}

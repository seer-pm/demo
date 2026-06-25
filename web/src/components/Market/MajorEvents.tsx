import Button from "@/components/Form/Button";
import { MarketEventFormContent } from "@/components/admin/MarketEventForm";
import {
  type EventFormState,
  createEventFormForMarket,
  marketEventToForm,
} from "@/components/admin/marketEventFormState";
import { useDeleteMarketEvent, useIsAdmin } from "@/hooks/admin/useAdminMarketEvents";
import { useIsConnectedAndSignedIn } from "@/hooks/useIsConnectedAndSignedIn";
import { useMarketEvents } from "@/hooks/useMarketEvents";
import { useModal } from "@/hooks/useModal";
import type { DisplayMarketEvent, MarketEvent } from "@/types/market-events";
import type { Market } from "@seer-pm/sdk";
import clsx from "clsx";
import { formatInTimeZone } from "date-fns-tz";
import { useEffect, useMemo, useState } from "react";

function buildDisplayEvents(_market: Market, dbEvents: MarketEvent[], _nowMs: number): DisplayMarketEvent[] {
  const sorted = dbEvents
    .map(
      (event): DisplayMarketEvent => ({
        id: event.id,
        title: event.title,
        description: event.description,
        eventAt: new Date(event.event_at),
      }),
    )
    .sort((a, b) => a.eventAt.getTime() - b.eventAt.getTime());
  if (sorted.length > 0) {
    sorted[sorted.length - 1].isResolution = true;
  }
  return sorted;
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

function eventClassName(event: DisplayMarketEvent, index: number): string {
  return clsx(
    "event",
    index === 0 ? "is-next" : `is-future-${Math.min(index, 4)}`,
    event.isResolution && "is-resolution",
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
  const deleteEvent = useDeleteMarketEvent(closeDeleteEventModal);
  const [createFormInitial, setCreateFormInitial] = useState<EventFormState | null>(null);
  const [editFormInitial, setEditFormInitial] = useState<EventFormState | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<MarketEvent | null>(null);
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
              <div key={event.id} className={eventClassName(event, index)}>
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
      </section>
    </>
  );
}

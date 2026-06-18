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

function buildDisplayEvents(market: Market, dbEvents: MarketEvent[], nowMs: number): DisplayMarketEvent[] {
  const now = new Date(nowMs);
  const events: DisplayMarketEvent[] = dbEvents.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    eventAt: new Date(event.event_at),
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

function formatEventDate(date: Date): string {
  const datePart = formatInTimeZone(date, "UTC", "MMM d, yyyy").toUpperCase();
  const isMidnightUtc = date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0;

  if (isMidnightUtc) {
    return datePart;
  }

  return `${datePart} · ${formatInTimeZone(date, "UTC", "HH:mm")} UTC`;
}

function LiveEventIcon() {
  return (
    <span className="relative mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center">
      <span className="absolute h-3 w-3 animate-ping rounded-full bg-purple-primary/40" />
      <span className="relative h-2 w-2 rounded-full bg-purple-primary" />
    </span>
  );
}

function TimelineDot({ active }: { active: boolean }) {
  if (active) {
    return <LiveEventIcon />;
  }

  return <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-base-content/20" />;
}

function EventRow({
  event,
  active,
  canManage,
  onEdit,
  onDelete,
}: {
  event: DisplayMarketEvent;
  active: boolean;
  canManage?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <li className="flex gap-3 py-4 first:pt-0 last:pb-0">
      <TimelineDot active={active} />
      <div className="min-w-0 flex-1">
        <p
          className={clsx(
            "text-[11px] font-semibold tracking-wide uppercase mb-1",
            active ? "text-purple-primary" : "text-base-content/40",
          )}
        >
          {formatEventDate(event.eventAt)}
        </p>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="text-[15px] font-semibold leading-snug">{event.title}</h3>
          {event.isResolution && (
            <span className="rounded-full bg-purple-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
              Resolution
            </span>
          )}
        </div>
        {event.description && <p className="text-[13px] text-base-content/60 leading-relaxed">{event.description}</p>}
      </div>
      {canManage && (
        <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
          <button type="button" className="text-[12px] text-purple-primary hover:underline" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="text-[12px] text-error-primary hover:underline" onClick={onDelete}>
            Delete
          </button>
        </div>
      )}
    </li>
  );
}

export function MajorEvents({ market }: { market: Market }) {
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
      <div className="card p-[24px] shadow-md">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="text-[20px] font-semibold">Major Events</h2>
          <div className="flex items-center gap-3">
            {showAdminActions && (
              <button
                type="button"
                className="text-[13px] font-semibold text-purple-primary hover:underline"
                onClick={openCreateEvent}
              >
                Add event
              </button>
            )}
            {events.length > 0 && (
              <span className="rounded-full bg-base-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-base-content/50">
                {events.length} upcoming
              </span>
            )}
          </div>
        </div>
        {events.length === 0 && showAdminActions && (
          <p className="text-[13px] text-base-content/60">No upcoming events yet.</p>
        )}
        {events.length > 0 && (
          <ol className="list-none m-0 p-0 divide-y divide-base-content/10">
            {events.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                active={isEventActive(event.eventAt, now)}
                canManage={showAdminActions && !event.isResolution}
                onEdit={() => openEditEvent(event.id)}
                onDelete={() => openDeleteEvent(event.id)}
              />
            ))}
          </ol>
        )}
      </div>
    </>
  );
}

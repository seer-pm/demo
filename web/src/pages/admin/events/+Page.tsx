import Button from "@/components/Form/Button";
import { Link } from "@/components/Link";
import { MarketEventFormContent } from "@/components/admin/MarketEventForm";
import { type EventFormState, adminEventToForm } from "@/components/admin/marketEventFormState";
import { useAdminMarketEvents, useDeleteMarketEvent, useIsAdmin } from "@/hooks/admin/useAdminMarketEvents";
import type { AdminMarketEvent } from "@/hooks/admin/useAdminMarketEvents";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useIsConnectedAndSignedIn } from "@/hooks/useIsConnectedAndSignedIn";
import { useModal } from "@/hooks/useModal";
import { useSignIn } from "@/hooks/useSignIn";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { paths } from "@/lib/paths";
import { isAccessTokenExpired } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { useAccount } from "wagmi";

function AdminEventsPage() {
  const isSignedIn = useIsConnectedAndSignedIn();
  const { address, chainId } = useAccount();
  const accessToken = useGlobalState((state) => state.accessToken);
  const signIn = useSignIn();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: events = [], isLoading: isEventsLoading } = useAdminMarketEvents(isAdmin === true);
  const deleteEvent = useDeleteMarketEvent();

  const { Modal: EventModal, openModal: openEventModal, closeModal: closeEventModal } = useModal("admin-event-modal");
  const {
    Modal: DeleteModal,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModal("admin-delete-event-modal");

  const [editingEvent, setEditingEvent] = useState<EventFormState | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<AdminMarketEvent | null>(null);

  const openCreate = () => {
    setEditingEvent(null);
    openEventModal();
  };

  const openEdit = (event: AdminMarketEvent) => {
    setEditingEvent(adminEventToForm(event));
    openEventModal();
  };

  const openDelete = (event: AdminMarketEvent) => {
    setDeletingEvent(event);
    openDeleteModal();
  };

  if (!isSignedIn) {
    return (
      <div className="container-fluid py-12">
        <h1 className="text-2xl font-semibold mb-4">Major Events Admin</h1>
        <p className="text-base-content/70 mb-4">Connect your wallet and sign in to manage market events.</p>
        {!address && <p className="text-sm">Use the Connect Wallet button in the header.</p>}
        {address && isAccessTokenExpired(accessToken) && (
          <Button
            text="Sign in"
            type="button"
            disabled={signIn.isPending}
            onClick={() => signIn.mutate({ address, chainId: chainId! })}
          />
        )}
      </div>
    );
  }

  if (isAdminLoading) {
    return (
      <div className="container-fluid py-12">
        <div className="shimmer-container h-64 rounded-lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container-fluid py-12">
        <h1 className="text-2xl font-semibold mb-4">Major Events Admin</h1>
        <p className="text-base-content/70">Your wallet is not authorized to manage market events.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-12 space-y-6">
      <EventModal
        className="max-w-[560px]"
        title={editingEvent?.id ? "Edit Event" : "Create Event"}
        content={<MarketEventFormContent initial={editingEvent} onClose={closeEventModal} />}
      />
      <DeleteModal
        className="max-w-[440px]"
        title="Delete Event"
        content={
          deletingEvent && (
            <div className="space-y-4">
              <p>
                Delete <strong>{deletingEvent.title}</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <Button text="Cancel" type="button" variant="secondary" onClick={closeDeleteModal} />
                <Button
                  text="Delete"
                  type="button"
                  variant="secondary"
                  disabled={deleteEvent.isPending}
                  onClick={() =>
                    deleteEvent.mutate(deletingEvent.id, {
                      onSuccess: closeDeleteModal,
                    })
                  }
                />
              </div>
            </div>
          )
        }
      />

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Major Events Admin</h1>
        <Button text="Create Event" type="button" onClick={openCreate} />
      </div>

      <div className="card shadow-sm border border-separator-100 overflow-x-auto">
        <table className="simple-table w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Market</th>
              <th>Chain</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isEventsLoading && (
              <tr>
                <td colSpan={5}>
                  <div className="shimmer-container h-10 rounded" />
                </td>
              </tr>
            )}
            {!isEventsLoading && events.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-base-content/60 py-8">
                  No events yet.
                </td>
              </tr>
            )}
            {events.map((event) => (
              <tr key={event.id}>
                <td className="whitespace-nowrap">{format(new Date(event.event_at), "yyyy-MM-dd HH:mm")}</td>
                <td>{event.title}</td>
                <td>
                  <Link
                    to={paths.market(event.market_url ?? event.market_id, event.chain_id)}
                    className="text-purple-primary hover:underline"
                  >
                    {event.market_name}
                  </Link>
                </td>
                <td>{SUPPORTED_CHAINS[event.chain_id as keyof typeof SUPPORTED_CHAINS]?.name ?? event.chain_id}</td>
                <td className="whitespace-nowrap">
                  <button
                    type="button"
                    className="text-purple-primary hover:underline mr-3"
                    onClick={() => openEdit(event)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-error-primary hover:underline"
                    onClick={() => openDelete(event)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminEventsPage;

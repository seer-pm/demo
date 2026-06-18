import { queryClient } from "@/lib/query-client";
import { toastError } from "@/lib/toastify";
import { fetchAuth, getAppUrl, isAccessTokenExpired } from "@/lib/utils";
import type { MarketEvent } from "@/types/market-events";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useGlobalState } from "../useGlobalState";

const ADMIN_EVENTS_URL = `${getAppUrl()}/.netlify/functions/admin-market-events`;

export type AdminMarketEvent = MarketEvent & {
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  market_name: string;
  market_url: string | null;
};

export function useIsAdmin() {
  const accessToken = useGlobalState((state) => state.accessToken);

  return useQuery({
    queryKey: ["useIsAdmin", accessToken],
    enabled: !isAccessTokenExpired(accessToken),
    retry: false,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const response = await fetch(ADMIN_EVENTS_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.status === 403) {
        return false;
      }
      if (!response.ok) {
        throw new Error("Failed to verify admin access");
      }
      return true;
    },
  });
}

export function useAdminMarketEvents(enabled = false) {
  const accessToken = useGlobalState((state) => state.accessToken);

  return useQuery<AdminMarketEvent[]>({
    queryKey: ["useAdminMarketEvents"],
    enabled: enabled && !isAccessTokenExpired(accessToken),
    queryFn: async () => {
      const json = await fetchAuth(accessToken, ADMIN_EVENTS_URL, "GET");
      return json.data ?? [];
    },
  });
}

type EventPayload = {
  marketId: string;
  chainId: number;
  title: string;
  description?: string;
  eventAt: string;
};

type UpdateEventPayload = {
  id: string;
  title: string;
  description?: string;
  eventAt: string;
  marketId?: string;
  chainId?: number;
};

export function useCreateMarketEvent(onSuccess?: () => void) {
  const accessToken = useGlobalState((state) => state.accessToken);

  return useMutation({
    mutationKey: ["useCreateMarketEvent"],
    mutationFn: (payload: EventPayload) => fetchAuth(accessToken, ADMIN_EVENTS_URL, "POST", payload),
    onError: (error) => toastError({ title: error.message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["useAdminMarketEvents"] });
      queryClient.invalidateQueries({ queryKey: ["useMarketEvents"] });
      onSuccess?.();
    },
  });
}

export function useUpdateMarketEvent(onSuccess?: () => void) {
  const accessToken = useGlobalState((state) => state.accessToken);

  return useMutation({
    mutationKey: ["useUpdateMarketEvent"],
    mutationFn: (payload: UpdateEventPayload) => fetchAuth(accessToken, ADMIN_EVENTS_URL, "PATCH", payload),
    onError: (error) => toastError({ title: error.message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["useAdminMarketEvents"] });
      queryClient.invalidateQueries({ queryKey: ["useMarketEvents"] });
      onSuccess?.();
    },
  });
}

export function useDeleteMarketEvent(onSuccess?: () => void) {
  const accessToken = useGlobalState((state) => state.accessToken);

  return useMutation({
    mutationKey: ["useDeleteMarketEvent"],
    mutationFn: (id: string) => fetchAuth(accessToken, ADMIN_EVENTS_URL, "DELETE", { id }),
    onError: (error) => toastError({ title: error.message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["useAdminMarketEvents"] });
      queryClient.invalidateQueries({ queryKey: ["useMarketEvents"] });
      onSuccess?.();
    },
  });
}

import { queryClient } from "@/lib/query-client";
import { toastError, toastSuccess } from "@/lib/toastify";
import { fetchAuth, getAppUrl, isAccessTokenExpired } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useGlobalState } from "../useGlobalState";

const ADMIN_CREDIT_CAMPAIGNS_URL = `${getAppUrl()}/.netlify/functions/admin-credit-campaigns`;

export type CardStatus = "unclaimed" | "pending" | "sent" | "confirmed" | "failed";
export type DripStatus = "none" | "pending" | "sent" | "confirmed" | "failed" | "skipped";

export type AdminCreditCampaign = {
  id: string;
  name: string;
  active: boolean;
  card_count: number;
  min_usd: number;
  max_usd: number;
  total_usd: number;
  created_by: string;
  created_at: string;
  claimed_count: number;
  claimed_usd: number;
  confirmed_count: number;
  confirmed_credits: string;
  in_flight_count: number;
  failed_count: number;
  unclaimed_usd: number;
};

export type CreditsDistributor = {
  address: string | null;
  credits: string | null;
  xdai: string | null;
  owedCredits: string | null;
  error: string | null;
};

export type AdminCreditCard = {
  id: string;
  serial: string;
  url: string;
  amount_usd: number;
  status: CardStatus;
  claimed_by: string | null;
  claimed_at: string | null;
  credits: string | null;
  tx_hash: string | null;
  drip_status: DripStatus;
  drip_tx_hash: string | null;
  error: string | null;
};

export type CreditCampaignPayload = {
  name: string;
  cardCount: number;
  minUsd: number;
  maxUsd: number;
};

export const emptyCreditCampaignForm: CreditCampaignPayload = {
  name: "",
  cardCount: 100,
  minUsd: 5,
  maxUsd: 100,
};

function invalidateCampaigns() {
  queryClient.invalidateQueries({ queryKey: ["useAdminCreditCampaigns"] });
  queryClient.invalidateQueries({ queryKey: ["useAdminCreditCampaignCards"] });
}

export function useAdminCreditCampaigns(enabled = false) {
  const accessToken = useGlobalState((state) => state.accessToken);

  return useQuery<{ campaigns: AdminCreditCampaign[]; distributor: CreditsDistributor }>({
    queryKey: ["useAdminCreditCampaigns"],
    enabled: enabled && !isAccessTokenExpired(accessToken),
    refetchInterval: 30_000,
    queryFn: async () => {
      const json = await fetchAuth(accessToken, ADMIN_CREDIT_CAMPAIGNS_URL, "GET");
      return json.data;
    },
  });
}

export function fetchAdminCreditCampaignCards(accessToken: string, campaignId: string): Promise<AdminCreditCard[]> {
  return fetchAuth(
    accessToken,
    `${ADMIN_CREDIT_CAMPAIGNS_URL}?campaignId=${encodeURIComponent(campaignId)}`,
    "GET",
  ).then((json) => json.data ?? []);
}

export function useAdminCreditCampaignCards(campaignId: string | undefined) {
  const accessToken = useGlobalState((state) => state.accessToken);

  return useQuery<AdminCreditCard[]>({
    queryKey: ["useAdminCreditCampaignCards", campaignId],
    enabled: !!campaignId && !isAccessTokenExpired(accessToken),
    queryFn: () => fetchAdminCreditCampaignCards(accessToken, campaignId!),
  });
}

export function useCreateCreditCampaign(onSuccess?: () => void) {
  const accessToken = useGlobalState((state) => state.accessToken);

  return useMutation({
    mutationKey: ["useCreateCreditCampaign"],
    mutationFn: (payload: CreditCampaignPayload) => fetchAuth(accessToken, ADMIN_CREDIT_CAMPAIGNS_URL, "POST", payload),
    onError: (error) => toastError({ title: error.message }),
    onSuccess: (_, payload) => {
      toastSuccess({
        title: `Campaign "${payload.name}" created`,
        subtitle: `${payload.cardCount} cards, inactive until you activate it`,
      });
      invalidateCampaigns();
      onSuccess?.();
    },
  });
}

export function useSetCreditCampaignActive() {
  const accessToken = useGlobalState((state) => state.accessToken);

  return useMutation({
    mutationKey: ["useSetCreditCampaignActive"],
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      fetchAuth(accessToken, ADMIN_CREDIT_CAMPAIGNS_URL, "PATCH", { id, active } as unknown as Record<
        string,
        string | number
      >),
    onError: (error) => toastError({ title: error.message }),
    onSuccess: (_, { active }) => {
      toastSuccess({
        title: active ? "Campaign activated" : "Campaign deactivated",
        subtitle: active ? "Its cards can be claimed now" : "Its cards can no longer be claimed",
      });
      invalidateCampaigns();
    },
  });
}

export function useRetryCreditCard() {
  const accessToken = useGlobalState((state) => state.accessToken);

  return useMutation({
    mutationKey: ["useRetryCreditCard"],
    mutationFn: (cardId: string) =>
      fetchAuth(accessToken, ADMIN_CREDIT_CAMPAIGNS_URL, "POST", { action: "retry", cardId }),
    onError: (error) => toastError({ title: error.message }),
    onSuccess: () => {
      toastSuccess({ title: "Card queued for retry", subtitle: "It is resent within a minute" });
      invalidateCampaigns();
    },
  });
}

/** Queues several failed cards at once. Retrying only clears reverted legs, so it can never pay a card twice. */
export function useRetryCreditCards() {
  const accessToken = useGlobalState((state) => state.accessToken);

  return useMutation({
    mutationKey: ["useRetryCreditCards"],
    mutationFn: async (cardIds: string[]) => {
      let queued = 0;
      const errors: string[] = [];
      // One card failing must not leave the rest of the batch unsent.
      for (const cardId of cardIds) {
        try {
          await fetchAuth(accessToken, ADMIN_CREDIT_CAMPAIGNS_URL, "POST", { action: "retry", cardId });
          queued++;
        } catch (error) {
          errors.push(error instanceof Error ? error.message : String(error));
        }
      }
      return { queued, failed: errors.length, firstError: errors[0] ?? null };
    },
    onError: (error) => toastError({ title: error.message }),
    onSuccess: ({ queued, failed, firstError }) => {
      if (failed === 0) {
        toastSuccess({ title: `${queued} cards queued for retry`, subtitle: "They are resent within a minute" });
      } else {
        toastError({
          title: `${queued} cards queued for retry, ${failed} failed`,
          subtitle: firstError ?? undefined,
        });
      }
    },
    onSettled: () => invalidateCampaigns(),
  });
}

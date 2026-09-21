import { useGlobalState } from "@/hooks/useGlobalState";
import { queryClient } from "@/lib/query-client";
import { toastError } from "@/lib/toastify";
import { fetchAuth, isAccessTokenExpired } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";

export type PohLinksState = {
  /** Most recent first. A wallet's most recent link also applies to chains it did not link separately. */
  links: { chainId: number; pohAddress: string; createdAt: string }[];
  selfVerified: boolean;
  /** Estimated SEER if a profile were linked. Null when verified or already linked. */
  potential: { toDate: number; monthly: number } | null;
};

const ENDPOINT = "/.netlify/functions/poh-links";

/**
 * The chain a sign-in token was issued for, or undefined for tokens minted before sign-in recorded
 * it. poh-links only accepts a link for the token's chain, and rejects tokens without one.
 */
export function getAccessTokenChainId(accessToken: string | undefined): number | undefined {
  if (!accessToken) {
    return undefined;
  }
  try {
    const [, payload] = accessToken.split(".");
    const chainId = JSON.parse(atob(payload)).chainId;
    return typeof chainId === "number" ? chainId : undefined;
  } catch {
    return undefined;
  }
}

/** True when the stored token can call poh-links at all: unexpired and carrying a chain. */
export function canUsePohLinks(accessToken: string | undefined): accessToken is string {
  return !!accessToken && !isAccessTokenExpired(accessToken) && getAccessTokenChainId(accessToken) !== undefined;
}

export function usePohLinks() {
  const accessToken = useGlobalState((state) => state.accessToken);
  return useQuery<PohLinksState>({
    queryKey: ["usePohLinks", accessToken],
    enabled: canUsePohLinks(accessToken),
    queryFn: () => fetchAuth(accessToken, ENDPOINT, "GET"),
  });
}

function onLinksChanged(data: PohLinksState) {
  // The response is the new state; the airdrop figures themselves only move after the nightly
  // recompute, so there is nothing else to invalidate.
  queryClient.setQueriesData({ queryKey: ["usePohLinks"] }, data);
}

export function useLinkPoh(onSuccess?: () => void) {
  return useMutation({
    mutationKey: ["useLinkPoh"],
    mutationFn: ({ accessToken, chainId, pohAddress }: { accessToken: string; chainId: number; pohAddress: string }) =>
      fetchAuth(accessToken, ENDPOINT, "POST", { chainId, pohAddress }) as Promise<PohLinksState>,
    onError: (error) => {
      toastError({ title: error.message });
    },
    onSuccess: (data) => {
      onLinksChanged(data);
      onSuccess?.();
    },
  });
}

export function useUnlinkPoh() {
  return useMutation({
    mutationKey: ["useUnlinkPoh"],
    mutationFn: ({ accessToken, chainId }: { accessToken: string; chainId: number }) =>
      fetchAuth(accessToken, ENDPOINT, "DELETE", { chainId }) as Promise<PohLinksState>,
    onError: (error) => {
      toastError({ title: error.message });
    },
    onSuccess: onLinksChanged,
  });
}

import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";

export type PublicUser = {
  address: Address;
  username: string;
};

type UserLookup = { address: Address } | { username: string };

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}

/** Fetches a public username record. A missing user resolves to null. */
export async function getPublicUser(lookup: UserLookup): Promise<PublicUser | null> {
  const key = "address" in lookup ? "address" : "username";
  const value = "address" in lookup ? lookup.address : lookup.username;
  const response = await fetch(`/.netlify/functions/users?${key}=${encodeURIComponent(value)}`);
  if (response.status === 404) return null;
  const data = await readJson<{ user: PublicUser }>(response);
  return data.user;
}

/** Cached public username lookup by wallet or current username. */
export function usePublicUser(lookup: UserLookup | null) {
  const key =
    lookup && "address" in lookup ? ["address", lookup.address.toLowerCase()] : ["username", lookup?.username];
  return useQuery({
    queryKey: ["publicUser", ...key],
    queryFn: () => getPublicUser(lookup!),
    enabled: Boolean(lookup),
    staleTime: 60_000,
  });
}

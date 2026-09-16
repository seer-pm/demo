import { addressUsername } from "./addressUsername";

export type DisplayNameSource = "username" | "ens" | "generated";

export type ResolvedDisplayName = {
  label: string;
  source: DisplayNameSource;
};

/**
 * Picks the label for a wallet: a chosen Seer username, else a verified ENS primary name, else a
 * nickname generated from the address.
 *
 * The generated name is deliberately never stored. A stored fallback would be indistinguishable
 * from a name the user actually chose, and would therefore outrank their ENS name.
 *
 * Callers pass `ensName: undefined` while the reverse lookup is in flight, which yields the
 * generated name — always readable, and upgraded once ENS resolves.
 */
export function resolveDisplayName({
  address,
  username,
  ensName,
}: {
  address?: string | null;
  username?: string | null;
  ensName?: string | null;
}): ResolvedDisplayName {
  if (username) return { label: username, source: "username" };
  if (ensName) return { label: ensName, source: "ens" };
  return { label: address ? addressUsername(address) : "-", source: "generated" };
}

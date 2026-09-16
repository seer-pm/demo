import type { Address } from "viem";
import { isAddress } from "viem";
import { useEnsName } from "wagmi";
import { shortAddress as formatShortAddress } from "../utils/address";
import { type DisplayNameSource, resolveDisplayName } from "../utils/displayName";

export type UseDisplayNameResult = {
  label: string;
  source: DisplayNameSource;
  /** Reported even when a username wins, so callers can still badge a verified ENS name. */
  ensName: string | null;
  address: Address | null;
  shortAddress: string;
  isLoading: boolean;
};

/** Resolves a wallet's display label: Seer username > ENS primary name > generated nickname. */
export function useDisplayName({
  address,
  username,
  enabled = true,
}: {
  address?: string | null;
  username?: string | null;
  /** Skip the mainnet reverse lookup; the label then falls back to the generated name. */
  enabled?: boolean;
}): UseDisplayNameResult {
  const normalized = address && isAddress(address) ? (address.toLowerCase() as Address) : null;

  const { data: ensName, isLoading } = useEnsName({
    address: normalized ?? undefined,
    chainId: 1,
    query: { enabled: enabled && Boolean(normalized) },
  });

  return {
    ...resolveDisplayName({ address: normalized, username, ensName }),
    ensName: ensName ?? null,
    address: normalized,
    shortAddress: formatShortAddress(normalized),
    isLoading,
  };
}

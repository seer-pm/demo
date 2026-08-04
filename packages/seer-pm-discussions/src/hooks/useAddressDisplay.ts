import type { Address } from "viem";
import { isAddress } from "viem";
import { useEnsName } from "wagmi";
import { shortAddress } from "../utils/address";

/** Resolve ENS (mainnet) for display; falls back to a shortened address. */
export function useAddressDisplay(address?: string | null): {
  address: string | null;
  ensName: string | null;
  displayName: string | null;
} {
  const normalized = address && isAddress(address) ? (address.toLowerCase() as Address) : null;

  const { data: ensName } = useEnsName({
    address: normalized ?? undefined,
    chainId: 1,
    query: { enabled: Boolean(normalized) },
  });

  if (!normalized) {
    return { address: null, ensName: null, displayName: null };
  }

  return {
    address: normalized,
    ensName: ensName ?? null,
    displayName: ensName ?? shortAddress(normalized),
  };
}

export default useAddressDisplay;

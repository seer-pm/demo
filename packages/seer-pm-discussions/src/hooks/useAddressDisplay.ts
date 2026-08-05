import type { Address } from "viem";
import { isAddress } from "viem";
import { useEnsName } from "wagmi";
import { shortAddress as formatShortAddress } from "../utils/address";
import { addressUsername } from "../utils/addressUsername";

/** Resolve ENS (mainnet) for display; falls back to a generated nickname. */
export function useAddressDisplay(address?: string | null): {
  address: string | null;
  ensName: string | null;
  generatedName: string | null;
  shortAddress: string | null;
  displayName: string | null;
} {
  const normalized = address && isAddress(address) ? (address.toLowerCase() as Address) : null;

  const { data: ensName } = useEnsName({
    address: normalized ?? undefined,
    chainId: 1,
    query: { enabled: Boolean(normalized) },
  });

  if (!normalized) {
    return {
      address: null,
      ensName: null,
      generatedName: null,
      shortAddress: null,
      displayName: null,
    };
  }

  const generatedName = addressUsername(normalized);
  const short = formatShortAddress(normalized);

  return {
    address: normalized,
    ensName: ensName ?? null,
    generatedName,
    shortAddress: short,
    displayName: ensName ?? generatedName,
  };
}

export default useAddressDisplay;

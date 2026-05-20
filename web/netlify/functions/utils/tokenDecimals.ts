import type { SupportedChain } from "@seer-pm/sdk";
import { getAllPrimaryCollaterals } from "@seer-pm/sdk";
import type { Address } from "viem";

function buildPrimaryDecimalsByAddress(chainId: SupportedChain): Map<string, number> {
  const byAddress = new Map<string, number>();
  for (const primary of getAllPrimaryCollaterals(chainId)) {
    byAddress.set(primary.address.toLowerCase(), primary.decimals);
  }
  return byAddress;
}

/** Primary collaterals use SDK decimals per profile; outcome / wrapped tokens use 18 (CTF convention). */
export function getTokenDecimals(chainId: SupportedChain, tokenAddresses: Address[]): Record<string, number> {
  const primaryDecimals = buildPrimaryDecimalsByAddress(chainId);
  return tokenAddresses.reduce(
    (acc, addr) => {
      const lc = addr.toLowerCase();
      acc[lc] = primaryDecimals.get(lc) ?? 18;
      return acc;
    },
    {} as Record<string, number>,
  );
}

export function getTokenDecimalsList(chainId: SupportedChain, tokenAddresses: Address[]): number[] {
  const byToken = getTokenDecimals(chainId, tokenAddresses);
  return tokenAddresses.map((t) => byToken[t.toLowerCase()] ?? 18);
}

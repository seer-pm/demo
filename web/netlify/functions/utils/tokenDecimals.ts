import type { SupportedChain } from "@seer-pm/sdk";
import { COLLATERAL_TOKENS } from "@seer-pm/sdk";
import type { Address } from "viem";

/** Primary collateral uses SDK decimals; outcome / wrapped tokens use 18 (CTF convention). */
export function getTokenDecimals(chainId: SupportedChain, tokenAddresses: Address[]): Record<string, number> {
  const primary = COLLATERAL_TOKENS[chainId].primary.address.toLowerCase();
  const primaryDecimals = COLLATERAL_TOKENS[chainId].primary.decimals;
  return tokenAddresses.reduce(
    (acc, addr) => {
      acc[addr.toLowerCase()] = addr.toLowerCase() === primary ? primaryDecimals : 18;
      return acc;
    },
    {} as Record<string, number>,
  );
}

export function getTokenDecimalsList(chainId: SupportedChain, tokenAddresses: Address[]): number[] {
  const byToken = getTokenDecimals(chainId, tokenAddresses);
  return tokenAddresses.map((t) => byToken[t.toLowerCase()] ?? 18);
}

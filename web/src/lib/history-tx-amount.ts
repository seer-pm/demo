import { displayBalance } from "@/lib/utils";
import { type SupportedChain, getCollateralProfiles } from "@seer-pm/sdk";
import { parseUnits } from "viem";

/** Primary / secondary / swap collateral decimals from the SDK registry; outcome tokens default to 18. */
export function tokenDecimals(chainId: SupportedChain, tokenAddress?: string): number {
  if (!tokenAddress) return 18;
  const lc = tokenAddress.toLowerCase();
  for (const profile of getCollateralProfiles(chainId)) {
    const tokens = [profile.primary, profile.secondary, profile.secondary?.wrapped, ...(profile.swap ?? [])];
    for (const token of tokens) {
      if (token && token.address.toLowerCase() === lc) return token.decimals;
    }
  }
  return 18;
}

/**
 * Format a get-transactions amount: prefer raw wei integers, fall back to parseUnits for dotted decimals.
 * `"0n"` is treated as zero (`BigInt("0n")` throws).
 */
export function formatRawTxAmount(value: string | undefined, decimals: number): string {
  return displayBalance(parseRawTxAmount(value, decimals), decimals);
}

function parseRawTxAmount(value: string | undefined, decimals: number): bigint {
  if (value == null || value === "" || value === "0n") return 0n;
  try {
    if (value.includes(".")) {
      return parseUnits(value as `${string}`, decimals);
    }
    return BigInt(value);
  } catch {
    return 0n;
  }
}

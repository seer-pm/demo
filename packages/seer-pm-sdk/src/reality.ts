import { formatEther } from "viem";

export function escapeJson(txt: string): string {
  return JSON.stringify(txt).replace(/^"|"$/g, "");
}

export function isScalarBoundInWei(bound: bigint): boolean {
  // NOTE: This is a backwards compatibility check.
  // Going forward, all scalar bounds will be in wei (1e18) format.
  // However, some older markets used basic units (regular integers).
  // We detect the format based on the size of the number.
  // We use 1e10 as a threshold to distinguish between regular numbers and numbers in wei (1e18) format.
  return bound > BigInt(1e10);
}

export function displayScalarBound(bound: bigint): number {
  if (isScalarBoundInWei(bound)) {
    return Number(formatEther(bound));
  }
  return Number(bound);
}

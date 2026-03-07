import { formatEther } from "viem";

/** Reality.eth template id for uint (scalar) questions. */
export const REALITY_TEMPLATE_UINT = 1;
/** Reality.eth template id for single-select (categorical) questions. */
export const REALITY_TEMPLATE_SINGLE_SELECT = 2;
/** Reality.eth template id for multiple-select questions. */
export const REALITY_TEMPLATE_MULTIPLE_SELECT = 3;

/** Hex value for invalid result outcome in Reality.eth. */
export const INVALID_RESULT = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
/** Hex value for "answered too soon" in Reality.eth. */
export const ANSWERED_TOO_SOON = "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe";

export function unescapeJson(txt: string): string {
  return txt.replace(/\\"/g, '"');
}

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

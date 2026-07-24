// Lens SDK — Core constants, ABIs, types, token list (zero dependencies)

// ---- Chain config ----

/** Unified AMM enum (same ordinals on every chain). */
export enum AMM {
  UNI_V3 = 0,
  UNI_V4 = 1,
  UNI_V4_HOOKED = 2,
  SWAPR_V3 = 3,
}

export const AMM_NAMES: Record<AMM, string> = {
  [AMM.UNI_V3]: "Uniswap V3",
  [AMM.UNI_V4]: "Uniswap V4",
  [AMM.UNI_V4_HOOKED]: "Uniswap V4 Hooked",
  [AMM.SWAPR_V3]: "Swapr V3",
};

/** Shared LensQuoter ABI for the unified contract on all chains. */
export const LENS_QUOTER_ABI = [
  "function buildBestSwapViaETHMulticall(address to, address refundTo, bool exactOut, address tokenIn, address tokenOut, uint256 swapAmount, uint256 slippageBps, uint256 deadline, uint24 hookPoolFee, int24 hookTickSpacing, address hookAddress) returns (tuple(uint8 source, uint256 feeBps, uint256 amountIn, uint256 amountOut) a, tuple(uint8 source, uint256 feeBps, uint256 amountIn, uint256 amountOut) b, bytes[] calls, bytes multicall, uint256 msgValue)",
  "function buildBestSwapViaTokenMulticall(address to, address refundTo, bool exactOut, address tokenIn, address tokenOut, uint256 swapAmount, uint256 slippageBps, uint256 deadline, uint24 hookPoolFee, int24 hookTickSpacing, address hookAddress, address mid) returns (tuple(uint8 source, uint256 feeBps, uint256 amountIn, uint256 amountOut) a, tuple(uint8 source, uint256 feeBps, uint256 amountIn, uint256 amountOut) b, bytes[] calls, bytes multicall, uint256 msgValue)",
  "function getQuotes(bool exactOut, address tokenIn, address tokenOut, uint256 swapAmount) returns (tuple(uint8 source, uint256 feeBps, uint256 amountIn, uint256 amountOut) best, tuple(uint8 source, uint256 feeBps, uint256 amountIn, uint256 amountOut)[] quotes)",
  "function buildBestSwap(address to, bool exactOut, address tokenIn, address tokenOut, uint256 swapAmount, uint256 slippageBps, uint256 deadline) returns (tuple(uint8 source, uint256 feeBps, uint256 amountIn, uint256 amountOut) best, bytes callData, uint256 amountLimit, uint256 msgValue)",
  "function V4_QUOTER() view returns (address)",
] as const;

/** Per-chain deployed addresses. */
export const CHAINS = {
  1: {
    lensRouter: "0x03d03464BF9Eb20059Ca6eF6391E9C5d79d5E012",
    lensQuoter: "0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791",
  },
  10: {
    lensRouter: "0xb89733665e63ecc1256E0729a9D950eF949450b8",
    lensQuoter: "0x25A3E57E3070EA5b43e14F7796Fa13806BC9DA05",
  },
  100: {
    lensRouter: "0xDD9Ec6DedC3B153E42d17C7F31cE6D6134A2ff1e",
    lensQuoter: "0x181C1312A3A77f5908AE76F781E025D88E1368eE",
  },
  8453: {
    lensRouter: "0xb89733665e63ecc1256E0729a9D950eF949450b8",
    lensQuoter: "0x25A3E57E3070EA5b43e14F7796Fa13806BC9DA05",
  },
} as const;

export type ChainId = keyof typeof CHAINS;

export const ETH = "0x0000000000000000000000000000000000000000" as const;

/** Gnosis sDAI — used as automatic ViaToken mid when direct/ViaETH fail. */
export const GNOSIS_sDAI = "0xaf204776c7245bF4147c2612BF6e5972Ee483701" as const;

// ---- ABIs (human-readable — works with viem parseAbi) ----

export const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
] as const;

// ---- Types ----

export interface Quote {
  source: AMM;
  sourceId: number;
  sourceName: string;
  feeBps: bigint;
  amountIn: bigint;
  amountOut: bigint;
}

export interface QuoteResult {
  amountIn: bigint;
  amountOut: bigint;
  multicall: string;
  msgValue: bigint;
  isTwoHop: boolean;
  sourceA: string;
  sourceB: string | null;
  allQuotes: Quote[] | null;
}

export interface SwapTx {
  to: string;
  data: string;
  value: bigint;
}

export interface BaseQuoteParams {
  tokenIn: string;
  tokenOut: string;
  amount: bigint;
}

export interface QuoteParams extends BaseQuoteParams {
  recipient: string;
  /** Where excess ETH is refunded (defaults to recipient). Set to the tx sender if recipient differs. */
  refundTo?: string;
  slippageBps?: number;
  deadline?: bigint;
  /** false = exactIn (default); true = exactOut. `amount` is amountIn or desired amountOut accordingly. */
  exactOut?: boolean;
  /** Optional V4 hooked-pool candidate (ETH-in exactIn only). */
  hookPoolFee?: number;
  hookTickSpacing?: number;
  hookAddress?: string;
  /**
   * Intermediate token for two-hop routes (`buildBestSwapViaTokenMulticall`).
   * On Gnosis, when omitted and ViaETH/direct fail, the SDK retries via sDAI automatically.
   */
  intermediate?: string;
}

export interface SwapParams extends QuoteParams {}

// ---- Helpers ----

export function defaultDeadline(): bigint {
  return BigInt(Math.trunc(Date.now() / 1000) + 300);
}

/** `multicall(bytes[])` selector — matches ILensRouter.multicall. */
const MULTICALL_SELECTOR = "ac9650d8";

/**
 * Wrap a single LensRouter action into `multicall([callData])` calldata.
 * Matches the on-chain single-hop encoding in buildBestSwapViaETHMulticall.
 */
export function wrapMulticall(callData: string): string {
  const hex = callData.startsWith("0x") || callData.startsWith("0X") ? callData.slice(2) : callData;
  if (hex.length % 2 !== 0) {
    throw new Error("wrapMulticall: callData must be even-length hex");
  }
  const dataLen = hex.length / 2;
  const paddedLen = Math.ceil(dataLen / 32) * 32;
  const padHex = "0".repeat((paddedLen - dataLen) * 2);

  const u256 = (n: number) => n.toString(16).padStart(64, "0");
  return `0x${MULTICALL_SELECTOR}${u256(32)}${u256(1)}${u256(32)}${u256(dataLen)}${hex}${padHex}`;
}

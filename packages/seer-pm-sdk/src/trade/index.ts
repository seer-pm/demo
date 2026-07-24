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
  "function buildBestSwapViaETH(address to, bool exactOut, address tokenIn, address tokenOut, uint256 swapAmount, uint256 slippageBps, uint256 deadline, uint24 hookPoolFee, int24 hookTickSpacing, address hookAddress) returns (tuple(uint8 source, uint256 feeBps, uint256 amountIn, uint256 amountOut) a, tuple(uint8 source, uint256 feeBps, uint256 amountIn, uint256 amountOut) b, address target, bytes data, uint256 msgValue)",
  "function buildBestSwapViaToken(address to, bool exactOut, address tokenIn, address tokenOut, uint256 swapAmount, uint256 slippageBps, uint256 deadline, uint24 hookPoolFee, int24 hookTickSpacing, address hookAddress, address mid) returns (tuple(uint8 source, uint256 feeBps, uint256 amountIn, uint256 amountOut) a, tuple(uint8 source, uint256 feeBps, uint256 amountIn, uint256 amountOut) b, address target, bytes data, uint256 msgValue)",
  "function getQuotes(bool exactOut, address tokenIn, address tokenOut, uint256 swapAmount) returns (tuple(uint8 source, uint256 feeBps, uint256 amountIn, uint256 amountOut) best, tuple(uint8 source, uint256 feeBps, uint256 amountIn, uint256 amountOut)[] quotes)",
  "function buildBestSwap(address to, bool exactOut, address tokenIn, address tokenOut, uint256 swapAmount, uint256 slippageBps, uint256 deadline) returns (tuple(uint8 source, uint256 feeBps, uint256 amountIn, uint256 amountOut) best, address target, bytes callData, uint256 amountLimit, uint256 msgValue)",
  "function V3_SWAP_ROUTER() view returns (address)",
  "function V4_ROUTER() view returns (address)",
  "function SWAPR_SWAP_ROUTER() view returns (address)",
  "function V4_QUOTER() view returns (address)",
] as const;

/** Per-chain LensQuoter and official DEX router addresses. */
export const CHAINS = {
  1: {
    lensQuoter: "0xefa6CB3804303DECFa8677A373Cf9c944af0F485",
    v3SwapRouter: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    v4Router: "0x00000000000044a361Ae3cAc094c9D1b14Eece97",
    swaprSwapRouter: "0x0000000000000000000000000000000000000000",
  },
  10: {
    lensQuoter: "0x9D2166667f497B57d1cE356ed4C6E244b511f7c2",
    v3SwapRouter: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    v4Router: "0x00000000000044a361Ae3cAc094c9D1b14Eece97",
    swaprSwapRouter: "0x0000000000000000000000000000000000000000",
  },
  100: {
    lensQuoter: "0xF42Bfb8c5b00A75D8eac00919E04fC8dB552D0c5",
    v3SwapRouter: "0x0000000000000000000000000000000000000000",
    v4Router: "0x0000000000000000000000000000000000000000",
    swaprSwapRouter: "0xfFB643E73f280B97809A8b41f7232AB401a04ee1",
  },
  8453: {
    lensQuoter: "0x9D2166667f497B57d1cE356ed4C6E244b511f7c2",
    v3SwapRouter: "0x2626664c2603336E57B271c5C0b26F421741e481",
    v4Router: "0x00000000000044a361Ae3cAc094c9D1b14Eece97",
    swaprSwapRouter: "0x0000000000000000000000000000000000000000",
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
  /** Official DEX router to call. */
  target: string;
  /** Ready-to-send calldata for `target`. */
  data: string;
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
  slippageBps?: number;
  deadline?: bigint;
  /** false = exactIn (default); true = exactOut. `amount` is amountIn or desired amountOut accordingly. */
  exactOut?: boolean;
  /** Optional V4 hooked-pool candidate (ETH-in exactIn only). */
  hookPoolFee?: number;
  hookTickSpacing?: number;
  hookAddress?: string;
  /**
   * Intermediate token for two-hop routes (`buildBestSwapViaToken`).
   * On Gnosis, when omitted and ViaETH/direct fail, the SDK retries via sDAI automatically.
   */
  intermediate?: string;
}

export interface SwapParams extends QuoteParams {}

// ---- Helpers ----

export function defaultDeadline(): bigint {
  return BigInt(Math.trunc(Date.now() / 1000) + 300);
}

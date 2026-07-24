/**
 * Seer AMM trade adapter over Lens smart quoter.
 * Quotes via lensQuoter; swaps execute against the chosen DEX router (`target`).
 * Bigint-first API — no external DEX SDK trade types.
 */

import type { Address, Hex, PublicClient } from "viem";
import { parseUnits, zeroAddress } from "viem";
import { isTwoStringsEqual } from "./quote-utils";
import type { Token } from "./tokens";
import { NATIVE_TOKEN } from "./tokens";
import { TradeType } from "./trade-type";
import { CHAINS, type ChainId, ETH, defaultDeadline } from "./trade/index.js";
import { Lens } from "./trade/viem.js";

export interface QuoteAmmTradeParams {
  chainId: number;
  account: Address | undefined;
  amount: string;
  outcomeToken: Token;
  collateralToken: Token;
  swapType: "buy" | "sell";
  /** Slippage tolerance as a percentage string (e.g. `"1"` = 1%, `"0.01"` = 0.01% / 1 bps). */
  maxSlippage: string;
  tradeType: TradeType;
}

export interface PopulatedSwapTx {
  to: string;
  data: string;
  value: bigint | string;
}

function assertLensDeployed(chainId: number): asserts chainId is ChainId {
  if (!(chainId in CHAINS)) {
    throw new Error(`Lens is not configured for chain ${chainId}`);
  }
  const chain = CHAINS[chainId as ChainId];
  if (isTwoStringsEqual(chain.lensQuoter, zeroAddress)) {
    throw new Error(`Lens smart quoter is not deployed on chain ${chainId}`);
  }
}

/** Seer native (0xeee…) → Lens ETH (0x0). */
export function toLensTokenAddress(address: string): string {
  return isTwoStringsEqual(address, NATIVE_TOKEN) ? ETH : address;
}

/**
 * Convert a percentage slippage string to basis points.
 * `"1"` → 100 bps (1%), `"0.01"` → 1 bps (0.01%). Invalid or negative values default to 100 bps.
 */
export function maxSlippageToBps(maxSlippage: string): number {
  const pct = Number(maxSlippage);
  if (!Number.isFinite(pct) || pct < 0) {
    return 100; // 1%
  }
  return Math.round(pct * 100);
}

function applySlippageDown(amount: bigint, slippageBps: number): bigint {
  return (amount * BigInt(10_000 - slippageBps)) / 10_000n;
}

function applySlippageUp(amount: bigint, slippageBps: number): bigint {
  return (amount * BigInt(10_000 + slippageBps)) / 10_000n;
}

export class AmmTrade {
  readonly chainId: number;
  readonly tradeType: TradeType;
  /** DEX router to approve / call (from Lens quote `target`). */
  readonly approveAddress: Address;
  readonly tokenIn: Token;
  readonly tokenOut: Token;
  readonly amountIn: bigint;
  readonly amountOut: bigint;
  readonly slippageBps: number;

  private readonly client: PublicClient;
  private readonly tokenInLens: string;
  private readonly tokenOutLens: string;
  private readonly swapAmount: bigint;
  private swapTx: { to: string; data: string; value: bigint };
  private cachedRecipient: string;

  constructor(args: {
    client: PublicClient;
    chainId: number;
    tradeType: TradeType;
    approveAddress: Address;
    tokenIn: Token;
    tokenOut: Token;
    amountIn: bigint;
    amountOut: bigint;
    slippageBps: number;
    tokenInLens: string;
    tokenOutLens: string;
    swapAmount: bigint;
    swapTx: { to: string; data: string; value: bigint };
    recipient: string;
  }) {
    this.client = args.client;
    this.chainId = args.chainId;
    this.tradeType = args.tradeType;
    this.approveAddress = args.approveAddress;
    this.tokenIn = args.tokenIn;
    this.tokenOut = args.tokenOut;
    this.amountIn = args.amountIn;
    this.amountOut = args.amountOut;
    this.slippageBps = args.slippageBps;
    this.tokenInLens = args.tokenInLens;
    this.tokenOutLens = args.tokenOutLens;
    this.swapAmount = args.swapAmount;
    this.swapTx = args.swapTx;
    this.cachedRecipient = args.recipient;
  }

  maximumAmountIn(): bigint {
    if (this.tradeType === TradeType.EXACT_INPUT) {
      return this.amountIn;
    }
    return applySlippageUp(this.amountIn, this.slippageBps);
  }

  minimumAmountOut(): bigint {
    if (this.tradeType === TradeType.EXACT_OUTPUT) {
      return this.amountOut;
    }
    return applySlippageDown(this.amountOut, this.slippageBps);
  }

  async swapTransaction(options: { recipient: string }): Promise<PopulatedSwapTx> {
    const recipient = options.recipient;
    if (recipient.toLowerCase() !== this.cachedRecipient.toLowerCase()) {
      await this.rebuildSwap(recipient);
    }
    return {
      to: this.swapTx.to,
      data: this.swapTx.data,
      value: this.swapTx.value,
    };
  }

  private async rebuildSwap(recipient: string): Promise<void> {
    assertLensDeployed(this.chainId);
    const lens = new Lens(this.client, this.chainId);
    this.swapTx = await lens.buildSwap({
      tokenIn: this.tokenInLens,
      tokenOut: this.tokenOutLens,
      amount: this.swapAmount,
      recipient,
      slippageBps: this.slippageBps,
      deadline: defaultDeadline(),
      exactOut: this.tradeType === TradeType.EXACT_OUTPUT,
    });
    this.cachedRecipient = recipient;
  }
}

export async function quoteAmmTrade(client: PublicClient, params: QuoteAmmTradeParams): Promise<AmmTrade> {
  const { chainId, account, amount, outcomeToken, collateralToken, swapType, maxSlippage, tradeType } = params;
  assertLensDeployed(chainId);

  const [buyToken, sellToken] =
    swapType === "buy" ? [outcomeToken, collateralToken] : ([collateralToken, outcomeToken] as [Token, Token]);

  const tokenInLens = toLensTokenAddress(sellToken.address);
  const tokenOutLens = toLensTokenAddress(buyToken.address);
  const slippageBps = maxSlippageToBps(maxSlippage);
  const recipient = account || zeroAddress;

  const exactOut = tradeType === TradeType.EXACT_OUTPUT;
  const swapAmount = exactOut
    ? parseUnits(String(amount), buyToken.decimals)
    : parseUnits(String(amount), sellToken.decimals);

  if (swapAmount <= 0n) {
    throw new Error("No route found");
  }

  const lens = new Lens(client, chainId);
  const result = await lens.quote({
    tokenIn: tokenInLens,
    tokenOut: tokenOutLens,
    amount: swapAmount,
    recipient,
    slippageBps,
    deadline: defaultDeadline(),
    exactOut,
  });

  if (result.amountIn <= 0n || result.amountOut <= 0n) {
    throw new Error("No route found");
  }

  const dexRouter = result.target as Address;

  return new AmmTrade({
    client,
    chainId,
    tradeType,
    approveAddress: dexRouter,
    tokenIn: sellToken,
    tokenOut: buyToken,
    amountIn: result.amountIn,
    amountOut: result.amountOut,
    slippageBps,
    tokenInLens,
    tokenOutLens,
    swapAmount,
    swapTx: { to: dexRouter, data: result.data as Hex, value: result.msgValue },
    recipient,
  });
}

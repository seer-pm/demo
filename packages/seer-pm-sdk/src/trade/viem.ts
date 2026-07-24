// Lens smart quoter — Viem adapter

import { encodeFunctionData, maxUint256, parseAbi, zeroAddress } from "viem";
import type { Abi, Address, PublicClient } from "viem";
import {
  AMM,
  AMM_NAMES,
  type BaseQuoteParams,
  CHAINS,
  type ChainId,
  ERC20_ABI,
  GNOSIS_sDAI,
  LENS_QUOTER_ABI,
  type Quote,
  type QuoteParams,
  type QuoteResult,
  type SwapParams,
  type SwapTx,
  defaultDeadline,
} from "./index.js";

const toAbi = (lines: readonly string[]): Abi => parseAbi(lines);

// viem's parseAbi (abitype) doesn't support inline `tuple(...)` syntax,
// so rewrite the shared quoter ABI strings to use a named struct.
const QUOTE_TUPLE = "tuple(uint8 source, uint256 feeBps, uint256 amountIn, uint256 amountOut)";
const QUOTE_STRUCT = "struct Quote { uint8 source; uint256 feeBps; uint256 amountIn; uint256 amountOut; }";
const toQuoterAbi = (lines: readonly string[]): Abi =>
  parseAbi([QUOTE_STRUCT, ...lines.map((l) => l.split(QUOTE_TUPLE).join("Quote"))]);

const quoterAbi = toQuoterAbi(LENS_QUOTER_ABI);
const erc20Abi = toAbi(ERC20_ABI);

export {
  ETH,
  GNOSIS_sDAI,
  AMM,
  AMM_NAMES,
  CHAINS,
  LENS_QUOTER_ABI,
  ERC20_ABI,
  defaultDeadline,
} from "./index.js";
export type { Quote, QuoteResult, SwapTx, BaseQuoteParams, QuoteParams, SwapParams, ChainId } from "./index.js";

const DEFAULT_SLIPPAGE = 50; // 0.5%

type QuoteStruct = { source: number; feeBps: bigint; amountIn: bigint; amountOut: bigint };
type BestSwapResult = readonly [QuoteStruct, QuoteStruct, Address, `0x${string}`, bigint];
type BuildBestSwapResult = readonly [QuoteStruct, Address, `0x${string}`, bigint, bigint];
type GetQuotesResult = readonly [QuoteStruct, readonly QuoteStruct[]];

function ammName(source: number): string {
  return (AMM_NAMES as Record<number, string>)[source] || `AMM #${source}`;
}

function mapAllQuotes(quotesResult: PromiseSettledResult<unknown>): Quote[] | null {
  if (quotesResult.status !== "fulfilled") return null;
  const [_best, quotes] = quotesResult.value as GetQuotesResult;
  return quotes
    .filter((qt) => qt.amountOut > 0n)
    .map((qt) => ({
      source: qt.source as AMM,
      sourceId: Number(qt.source),
      sourceName: ammName(qt.source),
      feeBps: qt.feeBps,
      amountIn: qt.amountIn,
      amountOut: qt.amountOut,
    }));
}

function mapViaResult(value: BestSwapResult): QuoteResult {
  const [a, b, target, data, msgValue] = value;
  const isTwoHop = b.amountOut > 0n;
  return {
    amountIn: a.amountIn,
    amountOut: isTwoHop ? b.amountOut : a.amountOut,
    target: target as string,
    data: data as string,
    msgValue: msgValue ?? 0n,
    isTwoHop,
    sourceA: ammName(a.source),
    sourceB: isTwoHop ? ammName(b.source) : null,
    allQuotes: null,
  };
}

function sameAddr(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export class Lens {
  private client: PublicClient;
  private chainId: ChainId;
  private lensQuoter: Address;
  private quoterAbi: Abi;

  constructor(client: PublicClient, chainId: ChainId) {
    this.client = client;
    this.chainId = chainId;
    const chain = CHAINS[chainId];
    this.lensQuoter = chain.lensQuoter as Address;
    this.quoterAbi = quoterAbi;
  }

  private async viaToken(params: {
    recipient: string;
    exactOut: boolean;
    tokenIn: string;
    tokenOut: string;
    amount: bigint;
    slippageBps: number;
    deadline: bigint;
    hookPoolFee: number;
    hookTickSpacing: number;
    hookAddress: string;
    mid: string;
  }): Promise<BestSwapResult> {
    return this.client.readContract({
      address: this.lensQuoter,
      abi: this.quoterAbi,
      functionName: "buildBestSwapViaToken",
      args: [
        params.recipient as Address,
        params.exactOut,
        params.tokenIn as Address,
        params.tokenOut as Address,
        params.amount,
        BigInt(params.slippageBps),
        params.deadline,
        params.hookPoolFee,
        params.hookTickSpacing,
        params.hookAddress as Address,
        params.mid as Address,
      ],
    }) as Promise<BestSwapResult>;
  }

  async quote(params: QuoteParams): Promise<QuoteResult> {
    const {
      tokenIn,
      tokenOut,
      amount,
      recipient,
      slippageBps = DEFAULT_SLIPPAGE,
      deadline = defaultDeadline(),
      exactOut = false,
      hookPoolFee = 0,
      hookTickSpacing = 0,
      hookAddress = zeroAddress,
      intermediate,
    } = params;

    const routeArgs = {
      recipient,
      exactOut,
      tokenIn,
      tokenOut,
      amount,
      slippageBps,
      deadline,
      hookPoolFee,
      hookTickSpacing,
      hookAddress,
    };

    const quotesPromise = this.client.readContract({
      address: this.lensQuoter,
      abi: this.quoterAbi,
      functionName: "getQuotes",
      args: [exactOut, tokenIn as Address, tokenOut as Address, amount],
    });

    let result: QuoteResult;
    let primaryError: unknown;

    if (intermediate) {
      const [bestResult, quotesResult] = await Promise.allSettled([
        this.viaToken({ ...routeArgs, mid: intermediate }),
        quotesPromise,
      ]);
      if (bestResult.status === "fulfilled") {
        result = mapViaResult(bestResult.value);
        result.allQuotes = mapAllQuotes(quotesResult);
        return result;
      }
      throw bestResult.reason;
    }

    const bestPromise = this.client.readContract({
      address: this.lensQuoter,
      abi: this.quoterAbi,
      functionName: "buildBestSwapViaETH",
      args: [
        recipient as Address,
        exactOut,
        tokenIn as Address,
        tokenOut as Address,
        amount,
        BigInt(slippageBps),
        deadline,
        hookPoolFee,
        hookTickSpacing,
        hookAddress as Address,
      ],
    });

    const [bestResult, quotesResult] = await Promise.allSettled([bestPromise, quotesPromise]);

    if (bestResult.status === "fulfilled") {
      result = mapViaResult(bestResult.value as BestSwapResult);
    } else {
      primaryError = bestResult.reason;
      try {
        const [best, target, callData, _amountLimit, msgValue] = (await this.client.readContract({
          address: this.lensQuoter,
          abi: this.quoterAbi,
          functionName: "buildBestSwap",
          args: [
            recipient as Address,
            exactOut,
            tokenIn as Address,
            tokenOut as Address,
            amount,
            BigInt(slippageBps),
            deadline,
          ],
        })) as BuildBestSwapResult;

        result = {
          amountIn: best.amountIn,
          amountOut: best.amountOut,
          target: target as string,
          data: callData as string,
          msgValue: msgValue ?? 0n,
          isTwoHop: false,
          sourceA: ammName(best.source),
          sourceB: null,
          allQuotes: null,
        };
      } catch {
        if (this.chainId === 100 && !sameAddr(tokenIn, GNOSIS_sDAI) && !sameAddr(tokenOut, GNOSIS_sDAI)) {
          try {
            const viaSdai = await this.viaToken({ ...routeArgs, mid: GNOSIS_sDAI });
            result = mapViaResult(viaSdai);
          } catch {
            throw primaryError;
          }
        } else {
          throw primaryError;
        }
      }
    }

    result.allQuotes = mapAllQuotes(quotesResult);
    return result;
  }

  async buildSwap(params: SwapParams): Promise<SwapTx> {
    const result = await this.quote(params);
    return {
      to: result.target,
      data: result.data,
      value: result.msgValue,
    };
  }

  async getAllQuotes(params: BaseQuoteParams): Promise<Quote[]> {
    const { tokenIn, tokenOut, amount } = params;

    const [_best, rawQuotes] = (await this.client.readContract({
      address: this.lensQuoter,
      abi: this.quoterAbi,
      functionName: "getQuotes",
      args: [false, tokenIn as Address, tokenOut as Address, amount],
    })) as GetQuotesResult;

    const quotes: Quote[] = [];
    for (const qt of rawQuotes) {
      if (qt.amountOut > 0n) {
        quotes.push({
          source: qt.source as AMM,
          sourceId: Number(qt.source),
          sourceName: ammName(qt.source),
          feeBps: qt.feeBps,
          amountIn: qt.amountIn,
          amountOut: qt.amountOut,
        });
      }
    }
    return quotes;
  }

  /** Allowance of `token` for an official DEX router (`spender`). */
  async getAllowance(token: string, owner: string, spender: string): Promise<bigint> {
    return this.client.readContract({
      address: token as Address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [owner as Address, spender as Address],
    }) as Promise<bigint>;
  }

  /** Approve `spender` (typically the `target` from `quote` / `buildSwap`). */
  buildApprove(token: string, spender: string): { to: string; data: string } {
    return {
      to: token,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [spender as Address, maxUint256],
      }),
    };
  }
}

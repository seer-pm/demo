/**
 * Composite quotes: PSM3 (USDC/USDS ↔ sUSDS) + Uniswap (sUSDS ↔ outcome).
 */

import { TradeType, type UniswapTrade } from "@swapr/sdk";
import type { Address, PublicClient } from "viem";
import { formatUnits, parseUnits } from "viem";
import { getActivePrimaryCollateral } from "./collateral";
import {
  applySlippageToleranceDown,
  applySlippageToleranceUp,
  isPsm3SwapToken,
  previewPsm3SwapExactIn,
  previewPsm3SwapExactOut,
} from "./psm3";
import type { Psm3Leg, QuoteTradeResult } from "./quote";
import { fetchUniswapQuote } from "./quote";
import type { Token } from "./tokens";

function buildPsm3LegExactIn(
  assetIn: Address,
  assetOut: Address,
  amountIn: bigint,
  previewAmountOut: bigint,
  maxSlippage: string,
): Psm3Leg {
  return {
    tradeType: "exactIn",
    assetIn,
    assetOut,
    amountIn,
    amountOut: previewAmountOut,
    limitAmount: applySlippageToleranceDown(previewAmountOut, maxSlippage),
  };
}

function buildPsm3LegExactOut(
  assetIn: Address,
  assetOut: Address,
  amountOut: bigint,
  previewAmountIn: bigint,
  maxSlippage: string,
): Psm3Leg {
  return {
    tradeType: "exactOut",
    assetIn,
    assetOut,
    amountIn: previewAmountIn,
    amountOut,
    limitAmount: applySlippageToleranceUp(previewAmountIn, maxSlippage),
  };
}

async function quoteBuyExactIn(
  client: PublicClient,
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  maxSlippage: string,
): Promise<QuoteTradeResult> {
  const primary = getActivePrimaryCollateral(chainId);
  const amountIn = parseUnits(amount, collateralToken.decimals);
  const sUsdsOut = await previewPsm3SwapExactIn(client, chainId, collateralToken.address, primary.address, amountIn);
  const psm3Leg = buildPsm3LegExactIn(collateralToken.address, primary.address, amountIn, sUsdsOut, maxSlippage);
  const uniswapQuote = await fetchUniswapQuote(
    TradeType.EXACT_INPUT,
    chainId,
    account,
    formatUnits(psm3Leg.limitAmount, primary.decimals),
    outcomeToken,
    primary,
    "buy",
    maxSlippage,
  );
  return {
    ...uniswapQuote,
    value: uniswapQuote.value,
    decimals: outcomeToken.decimals,
    sellAmount: amountIn.toString(),
    psm3Leg,
  };
}

async function quoteBuyExactOut(
  client: PublicClient,
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  maxSlippage: string,
): Promise<QuoteTradeResult> {
  const primary = getActivePrimaryCollateral(chainId);
  const uniswapQuote = await fetchUniswapQuote(
    TradeType.EXACT_OUTPUT,
    chainId,
    account,
    amount,
    outcomeToken,
    primary,
    "buy",
    maxSlippage,
  );
  const sUsdsNeeded = BigInt((uniswapQuote.trade as UniswapTrade).maximumAmountIn().raw.toString());
  const usdcIn = await previewPsm3SwapExactOut(client, chainId, collateralToken.address, primary.address, sUsdsNeeded);
  const psm3Leg = buildPsm3LegExactOut(collateralToken.address, primary.address, sUsdsNeeded, usdcIn, maxSlippage);
  return {
    ...uniswapQuote,
    value: usdcIn,
    decimals: collateralToken.decimals,
    sellAmount: usdcIn.toString(),
    psm3Leg,
  };
}

async function quoteSellExactIn(
  client: PublicClient,
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  maxSlippage: string,
): Promise<QuoteTradeResult> {
  const primary = getActivePrimaryCollateral(chainId);
  const uniswapQuote = await fetchUniswapQuote(
    TradeType.EXACT_INPUT,
    chainId,
    account,
    amount,
    outcomeToken,
    primary,
    "sell",
    maxSlippage,
  );
  const sUsdsOut = uniswapQuote.value;
  const collateralOut = await previewPsm3SwapExactIn(
    client,
    chainId,
    primary.address,
    collateralToken.address,
    sUsdsOut,
  );
  const psm3Leg = buildPsm3LegExactIn(primary.address, collateralToken.address, sUsdsOut, collateralOut, maxSlippage);
  return {
    ...uniswapQuote,
    value: collateralOut,
    decimals: collateralToken.decimals,
    psm3Leg,
  };
}

async function quoteSellExactOut(
  client: PublicClient,
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  maxSlippage: string,
): Promise<QuoteTradeResult> {
  const primary = getActivePrimaryCollateral(chainId);
  const collateralOut = parseUnits(amount, collateralToken.decimals);
  const sUsdsNeeded = await previewPsm3SwapExactOut(
    client,
    chainId,
    primary.address,
    collateralToken.address,
    collateralOut,
  );
  const psm3Leg = buildPsm3LegExactOut(
    primary.address,
    collateralToken.address,
    collateralOut,
    sUsdsNeeded,
    maxSlippage,
  );
  const uniswapQuote = await fetchUniswapQuote(
    TradeType.EXACT_OUTPUT,
    chainId,
    account,
    formatUnits(sUsdsNeeded, primary.decimals),
    outcomeToken,
    primary,
    "sell",
    maxSlippage,
  );
  return {
    ...uniswapQuote,
    value: collateralOut,
    decimals: collateralToken.decimals,
    sellAmount: uniswapQuote.sellAmount,
    psm3Leg,
  };
}

export async function fetchPsm3UniswapQuote(
  client: PublicClient,
  tradeType: TradeType,
  chainId: number,
  account: Address | undefined,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
  maxSlippage: string,
): Promise<QuoteTradeResult> {
  if (!isPsm3SwapToken(chainId, collateralToken.address)) {
    throw new Error("Collateral is not a PSM3 swap token");
  }

  if (swapType === "buy") {
    return tradeType === TradeType.EXACT_INPUT
      ? quoteBuyExactIn(client, chainId, account, amount, outcomeToken, collateralToken, maxSlippage)
      : quoteBuyExactOut(client, chainId, account, amount, outcomeToken, collateralToken, maxSlippage);
  }

  return tradeType === TradeType.EXACT_INPUT
    ? quoteSellExactIn(client, chainId, account, amount, outcomeToken, collateralToken, maxSlippage)
    : quoteSellExactOut(client, chainId, account, amount, outcomeToken, collateralToken, maxSlippage);
}

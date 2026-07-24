import type { AmmTrade, CoWTrade } from "@seer-pm/sdk";
import {
  getMaximumAmountIn,
  getMinimumAmountOut,
  getTradeAmountIn,
  getTradeAmountOut,
  getTradeTokenIn,
  getTradeTokenOut,
  isAmmTrade,
} from "@seer-pm/sdk";
import { formatUnits } from "viem";

type AnyTrade = CoWTrade | AmmTrade;

function formatAmount(amount: bigint, decimals: number, displayDecimals = 2): string {
  const value = Number(formatUnits(amount, decimals));
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(displayDecimals);
}

export function useGetTradeInfo(trade: AnyTrade | undefined) {
  if (!trade) {
    return undefined;
  }

  const tokenIn = getTradeTokenIn(trade);
  const tokenOut = getTradeTokenOut(trade);
  const amountIn = getTradeAmountIn(trade);
  const amountOut = getTradeAmountOut(trade);
  const maxIn = getMaximumAmountIn(trade);
  const minOut = getMinimumAmountOut(trade);

  const inHuman = Number(formatUnits(amountIn, tokenIn.decimals));
  const outHuman = Number(formatUnits(amountOut, tokenOut.decimals));
  const price = inHuman > 0 ? outHuman / inHuman : 0;
  const invertedPrice = outHuman > 0 ? inHuman / outHuman : 0;

  const slippagePct = isAmmTrade(trade) ? trade.slippageBps / 100 : Number(trade.maximumSlippage.toFixed(2));

  return {
    inputToken: tokenIn.symbol,
    outputToken: tokenOut.symbol,
    inputAmount: formatAmount(amountIn, tokenIn.decimals),
    inputAddress: tokenIn.address,
    outputAddress: tokenOut.address,
    outputAmount: formatAmount(amountOut, tokenOut.decimals),
    price: price.toFixed(2),
    invertedPrice: invertedPrice === 0 ? 0 : invertedPrice.toFixed(2),
    minimumReceive: formatAmount(minOut, tokenOut.decimals),
    maximumSent: formatAmount(maxIn, tokenIn.decimals),
    maximumSlippage: slippagePct.toFixed(2),
  };
}

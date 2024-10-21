import { Trade } from "@swapr/sdk";

export interface TradeInfo {
  inputToken: string | undefined;
  outputToken: string | undefined;
  inputAmount: string;
  inputAddress: string | undefined;
  outputAddress: string | undefined;
  outputAmount: string;
  price: string;
  invertedPrice: string;
  minimumReceive: string;
  maximumSlippage: string;
  fee: string;
  priceImpact: string;
}

export function useGetTradeInfo(trade: Trade | undefined) {
  if (!trade) {
    return undefined;
  }
  return {
    inputToken: trade.inputAmount.currency.symbol,
    outputToken: trade.outputAmount.currency.symbol,
    inputAmount: trade.inputAmount.toFixed(6),
    inputAddress: trade.inputAmount.currency.address,
    outputAddress: trade.outputAmount.currency.address,
    outputAmount: trade.outputAmount.toFixed(6),
    price: trade.executionPrice.toFixed(6),
    invertedPrice: trade.executionPrice.invert().toFixed(6),
    minimumReceive: trade.minimumAmountOut().toFixed(6),
    maximumSlippage: trade.maximumSlippage.toFixed(2),
    fee: trade.fee.toFixed(2),
    priceImpact: trade.priceImpact.toFixed(2),
  };
}

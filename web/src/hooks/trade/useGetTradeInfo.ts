import { Trade } from "@swapr/sdk";

export function useGetTradeInfo(trade: Trade | undefined) {
  if (!trade) {
    return undefined;
  }
  return {
    inputToken: trade.inputAmount.currency.symbol,
    outputToken: trade.outputAmount.currency.symbol,
    inputAmount: trade.inputAmount.toFixed(2),
    inputAddress: trade.inputAmount.currency.address,
    outputAddress: trade.outputAmount.currency.address,
    outputAmount: trade.outputAmount.toFixed(2),
    price: trade.executionPrice.toFixed(2),
    invertedPrice:
      trade.executionPrice.invert().denominator.toString() === "0" ? 0 : trade.executionPrice.invert().toFixed(2),
    minimumReceive: trade.minimumAmountOut().toFixed(2),
    maximumSlippage: trade.maximumSlippage.toFixed(2),
    fee: trade.fee.toFixed(2),
    priceImpact: trade.priceImpact.toFixed(2),
  };
}

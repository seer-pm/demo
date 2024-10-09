import { SEER_OUTCOME } from "@/lib/utils";
import { Trade } from "@swapr/sdk";
import { Address } from "viem";
import { useTokensInfo } from "../useTokenInfo";

export function useGetTradeInfo(trade: Trade | undefined) {
  const tokenAddresses = [trade?.inputAmount?.currency, trade?.outputAmount?.currency]
    .filter((x) => x?.address && x.symbol === SEER_OUTCOME)
    .map((x) => x!.address) as Address[];

  const { data } = useTokensInfo(tokenAddresses);
  if (!trade) {
    return undefined;
  }
  return {
    inputToken:
      trade.inputAmount.currency.symbol === SEER_OUTCOME && data?.[0]
        ? data[0].symbol
        : trade.inputAmount.currency.symbol,
    outputToken:
      trade.outputAmount.currency.symbol === SEER_OUTCOME && data?.[1]
        ? data[1].symbol
        : trade.outputAmount.currency.symbol,
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

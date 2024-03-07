import { Token } from "@/lib/tokens";
import {
  BuyTokenDestination,
  OrderBookApi,
  OrderParameters,
  OrderQuoteSideKindSell,
  PriceQuality,
  SellTokenSource,
} from "@cowprotocol/cow-sdk";
import { useQuery } from "@tanstack/react-query";
import { Address, parseUnits } from "viem";

export const useCalculateSwap = (
  chainId: number,
  account: Address | undefined,
  amount: number,
  outcomeToken: Token,
  collateralToken: Token,
  swapType: "buy" | "sell",
) => {
  return useQuery<{ value: bigint; decimals: number; quote: OrderParameters } | undefined, Error>({
    queryKey: ["useCalculateSwap", chainId, account, amount.toString(), outcomeToken, collateralToken, swapType],
    enabled: amount > 0,
    retry: false,
    queryFn: async () => {
      const [buyToken, sellToken] =
        swapType === "buy" ? [outcomeToken, collateralToken] : ([collateralToken, outcomeToken] as [Token, Token]);

      const orderBookApi = new OrderBookApi({ chainId });

      const quoteRequest = {
        buyToken: buyToken.address,
        sellToken: sellToken.address,
        validTo: Math.round(Date.now() / 1000) + 60 * 10,
        partiallyFillable: false,
        from: account as string,
        receiver: account as string,
        priceQuality: PriceQuality.OPTIMAL,
        kind: OrderQuoteSideKindSell.SELL,
        sellTokenBalance: SellTokenSource.ERC20,
        buyTokenBalance: BuyTokenDestination.ERC20,
        sellAmountBeforeFee: parseUnits(String(amount), sellToken.decimals).toString(),
      };

      const { quote } = await orderBookApi.getQuote(quoteRequest);

      return {
        value: BigInt(quote.buyAmount),
        decimals: sellToken.decimals,
        quote,
      };
    },
  });
};

import { COLLATERAL_TOKENS } from "@/lib/config";
import {
  BuyTokenDestination,
  OrderBookApi,
  OrderQuoteSideKindSell,
  PriceQuality,
  SellTokenSource,
} from "@cowprotocol/cow-sdk";
import { useQuery } from "@tanstack/react-query";
import { Address, formatUnits, parseUnits } from "viem";
import { useWrappedAddresses } from "./useWrappedAddresses";

function normalizeOdds(prices: number[]) {
  const sum = prices.reduce((acc, curr) => {
    return acc + curr;
  }, 0);

  return prices.map((price) => Math.round((price / sum) * 100));
}

export const useMarketOdds = (
  chainId: number,
  router: Address,
  conditionId?: `0x${string}`,
  outcomeSlotCount?: number,
) => {
  const { data: wrappedAddresses } = useWrappedAddresses(chainId, router, conditionId, outcomeSlotCount);
  return useQuery<number[] | undefined, Error>({
    enabled: !!wrappedAddresses,
    queryKey: ["useMarketOdds", chainId, router, conditionId, outcomeSlotCount],
    queryFn: async () => {
      const orderBookApi = new OrderBookApi({ chainId });

      const BUY_AMOUNT = 1000;

      const prices = await Promise.all(
        wrappedAddresses!.map(async (wrappedAddress) => {
          try {
            const quoteRequest = {
              buyToken: wrappedAddress,
              sellToken: COLLATERAL_TOKENS[chainId].primary.address,
              validTo: Math.round(Date.now() / 1000) + 60 * 10,
              partiallyFillable: false,
              from: "0x0000000000000000000000000000000000000000",
              receiver: "0x0000000000000000000000000000000000000000",
              priceQuality: PriceQuality.OPTIMAL,
              kind: OrderQuoteSideKindSell.SELL,
              sellTokenBalance: SellTokenSource.ERC20,
              buyTokenBalance: BuyTokenDestination.ERC20,
              sellAmountBeforeFee: parseUnits(String(BUY_AMOUNT), 18).toString(),
            };

            const { quote } = await orderBookApi.getQuote(quoteRequest);

            return BUY_AMOUNT / Number(formatUnits(BigInt(quote.buyAmount), 18));
          } catch {
            return 0;
          }
        }),
      );

      return normalizeOdds(prices);
    },
  });
};

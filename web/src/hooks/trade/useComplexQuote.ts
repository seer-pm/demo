import { isTwoStringsEqual } from "@/lib/utils";
import { Address, formatUnits } from "viem";

import { Market } from "@/lib/market";
import { Token } from "@/lib/tokens";
import { QuoteTradeResult, getSwaprTrade, getTradeArgs, getUniswapTrade } from "@/lib/trade";
import { useQuery } from "@tanstack/react-query";
import { gnosis } from "viem/chains";
import { QUOTE_REFETCH_INTERVAL } from ".";
import { useGlobalState } from "../useGlobalState";

const getComplexQuote = async (
  account: Address | undefined,
  market: Market,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
): Promise<QuoteTradeResult[]> => {
  const { chainId } = market;
  const getTradeFn = chainId === gnosis.id ? getSwaprTrade : getUniswapTrade;
  const sellQuotes = await Promise.all(
    market.wrappedTokens.map(async (token) => {
      if (!isTwoStringsEqual(token, outcomeToken.address)) {
        const args = await getTradeArgs(
          chainId,
          amount,
          { address: token, symbol: "SEER_OUTCOME", decimals: 18 },
          collateralToken,
          "sell",
        );

        const trade = await getTradeFn(
          args.currencyIn,
          args.currencyOut,
          args.currencyAmountIn,
          args.maximumSlippage,
          account,
          chainId,
        );

        if (trade) {
          return {
            value: BigInt(trade.outputAmount.raw.toString()),
            decimals: args.sellToken.decimals,
            trade,
            buyToken: args.buyToken.address,
            sellToken: args.sellToken.address,
            sellAmount: args.sellAmount.toString(),
            swapType: "sell",
          };
        }
      }
    }),
  );
  const filteredSellQuotes = sellQuotes.filter((x) => x) as QuoteTradeResult[];
  const rebuyAmount = formatUnits(
    filteredSellQuotes.reduce((acc, curr) => acc + BigInt(curr!.value), 0n),
    18,
  );
  const args = await getTradeArgs(chainId, rebuyAmount, outcomeToken, collateralToken, "buy");

  const trade = await getTradeFn(
    args.currencyIn,
    args.currencyOut,
    args.currencyAmountIn,
    args.maximumSlippage,
    account,
    chainId,
  );

  if (!trade) {
    throw new Error("No route found");
  }
  return [
    ...filteredSellQuotes,
    {
      value: BigInt(trade.outputAmount.raw.toString()),
      decimals: args.sellToken.decimals,
      trade,
      buyToken: args.buyToken.address,
      sellToken: args.sellToken.address,
      sellAmount: args.sellAmount.toString(),
      swapType: "buy",
    },
  ];
};

export function useComplexQuote(
  account: Address | undefined,
  market: Market,
  amount: string,
  outcomeToken: Token,
  collateralToken: Token,
  enabled = true,
) {
  const maxSlippage = useGlobalState((state) => state.maxSlippage);
  return useQuery<QuoteTradeResult[] | undefined, Error>({
    queryKey: [
      "useComplexQuote",
      market.chainId,
      market.id,
      account,
      amount,
      outcomeToken,
      collateralToken,
      maxSlippage,
    ],
    enabled: Number(amount) > 0 && enabled,
    retry: false,
    queryFn: async () => getComplexQuote(account, market, amount, outcomeToken, collateralToken),
    refetchInterval: QUOTE_REFETCH_INTERVAL,
  });
}

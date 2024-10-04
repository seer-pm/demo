import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { useQuery } from "@tanstack/react-query";
import { Address, formatUnits } from "viem";
import { getCowQuote, getSwaprQuote, getUniswapQuote } from "./trade";
import { Market } from "./useMarket";
import useMarketHasLiquidity from "./useMarketHasLiquidity";

function normalizeOdds(prices: number[]) {
  const sum = prices.reduce((acc, curr) => {
    return acc + curr;
  }, 0);

  return prices.map((price) => Math.round((price / sum) * 100));
}

export async function getTokenPrice(
  wrappedAddress: Address,
  chainId: SupportedChain,
  amount: string,
  swapType?: "buy" | "sell",
): Promise<bigint> {
  const outcomeToken = { address: wrappedAddress, symbol: "SEER_OUTCOME", decimals: 18 };
  const [uniswapQuote, swaprQuote, cowQuote] = await Promise.allSettled([
    getUniswapQuote(chainId, undefined, amount, outcomeToken, COLLATERAL_TOKENS[chainId].primary, swapType ?? "buy"),
    getSwaprQuote(chainId, undefined, amount, outcomeToken, COLLATERAL_TOKENS[chainId].primary, swapType ?? "buy"),
    getCowQuote(chainId, undefined, amount, outcomeToken, COLLATERAL_TOKENS[chainId].primary, swapType ?? "buy"),
  ]);

  if (uniswapQuote.status === "fulfilled" && uniswapQuote?.value?.value && uniswapQuote.value.value > 0n) {
    return uniswapQuote.value.value;
  }

  if (cowQuote.status === "fulfilled" && cowQuote?.value?.value && cowQuote.value.value > 0n) {
    return cowQuote.value.value;
  }

  if (swaprQuote.status === "fulfilled" && swaprQuote?.value?.value && swaprQuote.value.value > 0n) {
    return swaprQuote.value.value;
  }

  return 0n;
}

export const useMarketOdds = (market: Market, chainId: SupportedChain, enabled: boolean) => {
  const hasLiquidity = useMarketHasLiquidity(chainId, market.wrappedTokens);
  return useQuery<number[] | undefined, Error>({
    enabled: hasLiquidity && enabled,
    queryKey: ["useMarketOdds", market.id, chainId, hasLiquidity],
    queryFn: async () => {
      const BUY_AMOUNT = 1000;

      const prices = await Promise.all(
        market.wrappedTokens.map(async (wrappedAddress) => {
          try {
            const price = await getTokenPrice(wrappedAddress, chainId, String(BUY_AMOUNT));

            if (price === 0n) {
              return 0;
            }

            return BUY_AMOUNT / Number(formatUnits(price, 18));
          } catch {
            return 0;
          }
        }),
      );

      return normalizeOdds(prices);
    },
  });
};

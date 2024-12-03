import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Token } from "@/lib/tokens";
import { createClient } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { Address, formatUnits } from "viem";
import { getCowQuote, getSwaprQuote, getUniswapQuote } from "./trade";
import { Market, useMarket } from "./useMarket";
import useMarketHasLiquidity from "./useMarketHasLiquidity";
import { useTokenInfo } from "./useTokenInfo";

export function normalizeOdds(prices: number[]): number[] {
  const sumArray = (data: number[]) =>
    data.reduce((acc, curr) => {
      return acc + curr;
    }, 0);

  const pricesSum = sumArray(prices);

  const odds = prices.map((price) => Number(((price / pricesSum) * 100).toFixed(1)));

  const oddsSum = sumArray(odds);

  if (oddsSum > 100) {
    const maxIndex = odds.indexOf(Math.max(...odds));
    odds[maxIndex] = Number((odds[maxIndex] - (oddsSum - 100)).toFixed(1));
  }

  return odds;
}

async function getTokenPrice(
  wrappedAddress: Address,
  collateralToken: Token,
  chainId: SupportedChain,
  amount: string,
  swapType?: "buy" | "sell",
): Promise<bigint> {
  const outcomeToken = { address: wrappedAddress, symbol: "SEER_OUTCOME", decimals: 18 };
  const [uniswapQuote, swaprQuote, cowQuote] = await Promise.allSettled([
    getUniswapQuote(chainId, undefined, amount, outcomeToken, collateralToken, swapType ?? "buy"),
    getSwaprQuote(chainId, undefined, amount, outcomeToken, collateralToken, swapType ?? "buy"),
    getCowQuote(chainId, undefined, amount, outcomeToken, collateralToken, swapType ?? "buy"),
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

export const useMarketOdds = (market: Market, enabled: boolean, isOgImage?: boolean) => {
  const { data: parentMarket } = useMarket(market.parentMarket, market.chainId);
  const { data: parentCollateral } = useTokenInfo(
    parentMarket?.wrappedTokens?.[Number(market.parentOutcome)],
    market.chainId,
  );
  const collateralToken = parentCollateral || COLLATERAL_TOKENS[market.chainId].primary;

  const hasLiquidity = useMarketHasLiquidity(market.chainId, market.wrappedTokens, collateralToken);
  return useQuery<number[] | undefined, Error>({
    enabled,
    queryKey: ["useMarketOdds", market.id, market.chainId, hasLiquidity, isOgImage],
    gcTime: 1000 * 60 * 60 * 24, //24 hours
    staleTime: 0,
    queryFn: async () => {
      if (!hasLiquidity) {
        return Array(market.wrappedTokens.length).fill(Number.NaN);
      }

      if (isOgImage) {
        try {
          const supabase = createClient(
            import.meta.env.VITE_SUPABASE_PROJECT_URL,
            import.meta.env.VITE_SUPABASE_API_KEY,
          );
          const {
            data: { odds },
          } = await supabase.from("markets").select().eq("id", market.id).limit(1).single();
          return odds;
        } catch (e) {}
      }
      const BUY_AMOUNT = 3; //collateral token

      const prices = await Promise.all(
        market.wrappedTokens.map(async (wrappedAddress) => {
          try {
            const price = await getTokenPrice(wrappedAddress, collateralToken, market.chainId, String(BUY_AMOUNT));

            if (price === 0n) {
              return 0;
            }

            return BUY_AMOUNT / Number(formatUnits(price, 18));
          } catch {
            return 0;
          }
        }),
      );
      if (prices.some((price) => price > 1)) {
        return Array(market.wrappedTokens.length).fill(Number.NaN);
      }
      return normalizeOdds(prices);
    },
  });
};

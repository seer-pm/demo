import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { Token } from "@/lib/tokens";
import { useQuery } from "@tanstack/react-query";
import { Address, formatUnits } from "viem";
import { getCowQuote, getSwaprQuote, getUniswapQuote } from "./trade";
import { Market, useMarket } from "./useMarket";
import useMarketHasLiquidity from "./useMarketHasLiquidity";

function normalizeOdds(prices: number[]): number[] {
  const sum = prices.reduce((acc, curr) => {
    return acc + curr;
  }, 0);

  return prices.map((price) => Number(((price / sum) * 100).toFixed(1)));
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

export const useMarketOdds = (market: Market, chainId: SupportedChain, enabled: boolean) => {
  const { data: conditionalMarket } = useMarket(market.parentMarket, chainId);
  const collateralToken = conditionalMarket
    ? {
        address: conditionalMarket.wrappedTokens[Number(market.parentOutcome)],
        decimals: 18,
        symbol: "SEER_OUTCOME",
      }
    : COLLATERAL_TOKENS[chainId].primary;
  const hasLiquidity = useMarketHasLiquidity(chainId, market.wrappedTokens, collateralToken);

  return useQuery<number[] | undefined, Error>({
    enabled: hasLiquidity && enabled,
    queryKey: ["useMarketOdds", market.id, chainId, hasLiquidity],
    queryFn: async () => {
      const BUY_AMOUNT = 1000;

      const prices = await Promise.all(
        market.wrappedTokens.map(async (wrappedAddress) => {
          try {
            const price = await getTokenPrice(wrappedAddress, collateralToken, chainId, String(BUY_AMOUNT));

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

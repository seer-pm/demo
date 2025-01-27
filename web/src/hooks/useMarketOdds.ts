import { SupportedChain } from "@/lib/chains";
import { MarketTypes, getMarketType } from "@/lib/market";
import { Token } from "@/lib/tokens";
import { isUndefined } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Address, formatUnits } from "viem";
import { getCowQuote, getSwaprQuote, getUniswapQuote } from "./trade";
import { Market } from "./useMarket";
import useMarketHasLiquidity from "./useMarketHasLiquidity";

function formatOdds(prices: number[]): number[] {
  return prices.map((price) => (Number.isNaN(price) ? Number.NaN : Number((price * 100).toFixed(1))));
}

export function normalizeOdds(prices: number[]): number[] {
  const sumArray = (data: number[]) =>
    data.reduce((acc, curr) => {
      if (Number.isNaN(curr)) {
        return acc;
      }
      return acc + curr;
    }, 0);

  if (prices.some((price) => Number.isNaN(price))) {
    // When a price is significantly above 1, it indicates extremely thin liquidity or out-of-range prices
    // Rather than normalizing these unrealistic prices, we display them as NA while keeping valid prices as-is
    // For example: with prices [200, 0.4, 0.3], we show [NA, 0.4, 0.3] instead of trying to normalize 200
    return formatOdds(prices);
  }

  const pricesSum = sumArray(prices);

  const odds = formatOdds(prices.map((price) => price / pricesSum));

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

export const useMarketOdds = (market: Market, enabled: boolean) => {
  const hasLiquidity = useMarketHasLiquidity(market);
  return useQuery<number[] | undefined, Error>({
    // hasLiquidity is undefined while loading market liquidity data
    enabled: enabled && !isUndefined(hasLiquidity),
    queryKey: ["useMarketOdds", market.id, market.chainId, hasLiquidity, market.odds],
    gcTime: 1000 * 60 * 60 * 24, //24 hours
    staleTime: 0,
    ...(market.odds.length > 0 && market.odds.every((x) => x !== null) && { initialData: market.odds as number[] }),
    queryFn: async () => {
      if (!hasLiquidity) {
        return Array(market.wrappedTokens.length).fill(Number.NaN);
      }

      const BUY_AMOUNT = 3; //collateral token

      const collateralToken = {
        address: market.collateralToken,
        decimals: 18,
        name: "",
        symbol: "",
      };

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

      // We filter out odds greater than 1.1 (an arbitrary threshold) by converting them to NaN
      // This handles cases where there is liquidity, but it's too thin or out of price range,
      // resulting in extremely high share prices that would display misleading odds
      // NaN values indicate to the UI that these odds should not be shown
      const tmpPrices = prices.map((p) => (p > 1.1 ? Number.NaN : p));

      if (getMarketType(market) === MarketTypes.MULTI_CATEGORICAL) {
        return formatOdds(tmpPrices);
      }

      return normalizeOdds(tmpPrices);
    },
  });
};

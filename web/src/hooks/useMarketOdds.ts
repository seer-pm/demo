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
const CEIL_PRICE = 1.1;
async function getTokenPrice(
  wrappedAddress: Address,
  collateralToken: Token,
  chainId: SupportedChain,
  amount: string,
  swapType: "buy" | "sell" = "buy",
): Promise<bigint> {
  const outcomeToken = { address: wrappedAddress, symbol: "SEER_OUTCOME", decimals: 18 };
  // call cowQuote first, if not possible then we call using rpc
  try {
    const cowQuote = await getCowQuote(chainId, undefined, amount, outcomeToken, collateralToken, swapType);
    if (cowQuote?.value && cowQuote.value > 0n) {
      const pricePerShare =
        swapType === "buy"
          ? Number(amount) / Number(formatUnits(cowQuote.value, 18))
          : Number(formatUnits(cowQuote.value, 18)) / Number(amount);
      if (pricePerShare <= CEIL_PRICE) {
        return cowQuote.value;
      }
    }
  } catch (e) {}
  const [uniswapQuote, swaprQuote] = await Promise.allSettled([
    getUniswapQuote(chainId, undefined, amount, outcomeToken, collateralToken, swapType),
    getSwaprQuote(chainId, undefined, amount, outcomeToken, collateralToken, swapType),
  ]);

  if (uniswapQuote.status === "fulfilled" && uniswapQuote?.value?.value && uniswapQuote.value.value > 0n) {
    return uniswapQuote.value.value;
  }

  if (swaprQuote.status === "fulfilled" && swaprQuote?.value?.value && swaprQuote.value.value > 0n) {
    return swaprQuote.value.value;
  }

  return 0n;
}

export async function getMarketOdds(market: Market, hasLiquidity: boolean) {
  if (!hasLiquidity) {
    return Array(market.wrappedTokens.length).fill(Number.NaN);
  }

  const BUY_AMOUNT = 3; //collateral token
  const SELL_AMOUNT = 3; //outcome token

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
        const pricePerShare = BUY_AMOUNT / Number(formatUnits(price, 18));
        if (price === 0n || pricePerShare > CEIL_PRICE) {
          // try to get sell price instead
          const sellPrice = await getTokenPrice(
            wrappedAddress,
            collateralToken,
            market.chainId,
            String(SELL_AMOUNT),
            "sell",
          );
          if (sellPrice === 0n) {
            return 0;
          }
          const sellPricePerShare = Number(formatUnits(sellPrice, 18)) / SELL_AMOUNT;
          return Math.min(pricePerShare, sellPricePerShare);
        }

        return pricePerShare;
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
}

export const useMarketOdds = (market: Market, enabled: boolean) => {
  const hasLiquidity = useMarketHasLiquidity(market);

  const getInitialData = () => {
    if (market.odds.length > 0) {
      if (market.odds.every((x) => x !== null)) {
        // all outcomes have valid odds
        return market.odds as number[];
      }

      if (!enabled) {
        // If some odds are null but the query is disabled, we're likely in prerendered mode (e.g., homepage)
        // Return the existing odds data even if incomplete to avoid unnecessary loading states
        // Since the query is disabled, it won't run to fetch updated data, so we use what we have
        // This is especially important for components like market previews on the homepage
        return market.odds;
      }
    }

    return undefined;
  };

  return useQuery<number[] | undefined, Error>({
    // hasLiquidity is undefined while loading market liquidity data
    enabled: enabled && !isUndefined(hasLiquidity),
    queryKey: ["useMarketOdds", market.id, market.chainId, hasLiquidity, market.odds],
    gcTime: 1000 * 60 * 60 * 24, //24 hours
    staleTime: 0,
    initialData: getInitialData(),
    queryFn: async () => {
      return getMarketOdds(market, hasLiquidity!);
    },
  });
};

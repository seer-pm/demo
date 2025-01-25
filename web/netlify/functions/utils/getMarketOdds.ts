import { Address, formatUnits } from "viem";
import { LiquidityToMarketMapping } from "./getMarketsLiquidity.ts";
import { getCowQuote, getSwaprQuote, getUniswapQuote } from "./getQuotes.ts";
import { Token } from "../../../src/lib/tokens.ts";
import { SupportedChain } from "../../../src/lib/chains.ts";
import { Market } from "../../../src/hooks/useMarket.ts";
import { getLiquidityPairForToken } from "../../../src/lib/market.ts";

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

export async function getMarketOdds(market: Market, liquidityToMarketMapping: LiquidityToMarketMapping) {
  const hasLiquidity = (liquidityToMarketMapping[market.id].totalLiquidity || 0) > 0;
  if (!hasLiquidity) {
    return Array(market.wrappedTokens.length).fill(Number.NaN);
  }
  const BUY_AMOUNT = 3; //collateral token

  const prices = await Promise.all(
    market.wrappedTokens.map(async (wrappedAddress, i) => {
      try {
        // const collateralToken = await getTokenInfo(getLiquidityPairForToken(market, i), market.chainId);
        const collateralToken = {
          address: getLiquidityPairForToken(market, i),
          decimals: 18,
          name: "",
          symbol: "",
        };
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
}

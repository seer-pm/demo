import { SupportedChain, gnosis } from "@/lib/chains";
import { Market, getMarketUnit, isOdd } from "@/lib/market";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import type { Token } from "@seer-pm/sdk";
import { getTokenPriceFromSwap } from "@seer-pm/sdk";
import { getTokenPriceFromSubgraph } from "@seer-pm/subgraph";
import { Address } from "viem";
import { displayScalarBound } from "./reality";

const CEIL_PRICE = 1;

function formatOdds(prices: number[]): number[] {
  return prices.map((price) => (Number.isNaN(price) ? Number.NaN : Number((price * 100).toFixed(1))));
}

export function rescaleOdds(odds: (number | null)[]): number[] {
  if (!odds.length) {
    return [];
  }

  const numericOdds = odds.map((odd) => (odd === null ? 0 : odd));

  const oddsSum = numericOdds.reduce((acc, curr) => {
    if (Number.isNaN(curr)) {
      return Number(acc);
    }
    return Number(acc) + Number(curr);
  }, 0);

  if (oddsSum > 100) {
    return numericOdds.map((odd) => Number(((odd / oddsSum) * 100).toFixed(1)));
  }

  return numericOdds;
}

export function normalizeOdds(prices: number[]): number[] {
  // Filter out unrealistic prices by converting them to NaN
  // This handles cases where there is liquidity, but it's too thin or out of price range
  // Rather than normalizing these unrealistic prices, we display them as NA while keeping valid prices as-is
  // For example: with prices [200, 0.4, 0.3], we show [NA, 0.4, 0.3] instead of trying to normalize 200
  const filteredPrices = prices.map((price) => (price > CEIL_PRICE ? Number.NaN : price));
  return formatOdds(filteredPrices);
}

async function getTokenPriceFromSubgraphWithClient(
  wrappedAddress: Address,
  collateralToken: Token,
  chainId: SupportedChain,
) {
  const subgraphClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);
  if (!subgraphClient) {
    return Number.NaN;
  }
  return getTokenPriceFromSubgraph(wrappedAddress, collateralToken, chainId, subgraphClient);
}

export async function getTokenPrice(wrappedAddress: Address, collateralToken: Token, chainId: SupportedChain) {
  if (chainId === gnosis.id) {
    return await getTokenPriceFromSubgraphWithClient(wrappedAddress, collateralToken, chainId);
  }
  return await getTokenPriceFromSwap(wrappedAddress, collateralToken, chainId);
}

export async function getMarketOdds(market: Market, hasLiquidity: boolean): Promise<number[]> {
  if (!hasLiquidity || market.type === "Futarchy") {
    return Array(market.wrappedTokens.length).fill(Number.NaN);
  }

  const collateralToken = {
    address: market.collateralToken,
    chainId: market.chainId,
    decimals: 18,
    name: "",
    symbol: "",
  };

  const prices = await Promise.all(
    market.wrappedTokens.map((wrappedAddress) =>
      market.chainId === gnosis.id
        ? getTokenPriceFromSubgraphWithClient(wrappedAddress, collateralToken, market.chainId)
        : getTokenPriceFromSwap(wrappedAddress, collateralToken, market.chainId),
    ),
  );

  return normalizeOdds(prices);
}

export function getMarketEstimate(odds: (number | null)[], market: Market, convertToString?: boolean) {
  const { lowerBound, upperBound } = market;
  if (!isOdd(odds[0]) || !isOdd(odds[1])) {
    return "NA";
  }
  const scaledOdds = rescaleOdds(odds);

  const estimate =
    (scaledOdds[0] * displayScalarBound(lowerBound) + scaledOdds[1] * displayScalarBound(upperBound)) / 100;

  if (!convertToString) {
    return estimate;
  }
  const marketUnit = getMarketUnit(market);
  if (marketUnit) {
    return `${Number(estimate).toLocaleString()} ${marketUnit}`;
  }
  return Number(estimate).toLocaleString();
}

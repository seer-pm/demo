import { tickToPrice } from "@/hooks/liquidity/getLiquidityChartData";
import { OrderDirection, Pool_OrderBy, getSdk } from "@/hooks/queries/gql-generated-swapr";
import { SupportedChain, gnosis, mainnet } from "@/lib/chains";
import { Market, getToken0Token1 } from "@/lib/market";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@/lib/subgraph";
import { Token } from "@/lib/tokens";
import { Address, formatUnits } from "viem";
import { getCowQuote, getSwaprQuote, getUniswapQuote } from "./trade";
import { isTwoStringsEqual } from "./utils";

const CEIL_PRICE = 1;

function formatOdds(prices: number[]): number[] {
  return prices.map((price) => (Number.isNaN(price) ? Number.NaN : Number((price * 100).toFixed(1))));
}

export function rescaleOdds(odds: number[]): number[] {
  if (!odds?.length) {
    return odds;
  }
  if (odds.some((odd) => Number.isNaN(odd))) {
    // When a price is significantly above 1, it indicates extremely thin liquidity or out-of-range prices
    // Rather than normalizing these unrealistic prices, we display them as NA while keeping valid prices as-is
    // For example: with prices [200, 0.4, 0.3], we show [NA, 0.4, 0.3] instead of trying to normalize 200
    return odds;
  }
  const oddsSum = odds.reduce((acc, curr) => {
    if (Number.isNaN(curr)) {
      return acc;
    }
    return acc + curr;
  }, 0);

  if (oddsSum > 100) {
    return odds.map((odd) => Number(((odd / oddsSum) * 100).toFixed(1)));
  }

  return odds;
}

export function normalizeOdds(prices: number[]): number[] {
  // Filter out unrealistic prices by converting them to NaN
  // This handles cases where there is liquidity, but it's too thin or out of price range
  const filteredPrices = prices.map((price) => (price > CEIL_PRICE ? Number.NaN : price));
  return formatOdds(filteredPrices);
}

async function getTokenSwapResult(
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
  // we either call uniswap or swapr quote based on chainId
  if (chainId === gnosis.id) {
    try {
      const swaprQuote = await getSwaprQuote(chainId, undefined, amount, outcomeToken, collateralToken, swapType);
      return swaprQuote.value;
    } catch (e) {
      return 0n;
    }
  }

  if (chainId === mainnet.id) {
    try {
      const uniswapQuote = await getUniswapQuote(chainId, undefined, amount, outcomeToken, collateralToken, swapType);
      return uniswapQuote.value;
    } catch (e) {
      return 0n;
    }
  }

  return 0n;
}

async function getTokenPriceFromSwap(wrappedAddress: Address, collateralToken: Token, chainId: SupportedChain) {
  const BUY_AMOUNT = 3; //collateral token
  const SELL_AMOUNT = 3; //outcome token

  try {
    const price = await getTokenSwapResult(wrappedAddress, collateralToken, chainId, String(BUY_AMOUNT));
    const pricePerShare = BUY_AMOUNT / Number(formatUnits(price, 18));
    if (pricePerShare > CEIL_PRICE) {
      // low buy liquidity, try to get sell price instead
      const sellPrice = await getTokenSwapResult(wrappedAddress, collateralToken, chainId, String(SELL_AMOUNT), "sell");
      const sellPricePerShare = Number(formatUnits(sellPrice, 18)) / SELL_AMOUNT;
      if (sellPricePerShare === 0 || sellPricePerShare > CEIL_PRICE) {
        return Number.NaN;
      }
      return sellPricePerShare;
    }

    return pricePerShare;
  } catch {
    return Number.NaN;
  }
}

async function getTokenPriceFromSubgraph(wrappedAddress: Address, collateralToken: Token, chainId: SupportedChain) {
  const subgraphClient = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);
  if (!subgraphClient) {
    return Number.NaN;
  }
  try {
    const { pools } = await getSdk(subgraphClient).GetPools({
      where: {
        ...getToken0Token1(wrappedAddress, collateralToken.address),
      },
      orderBy: Pool_OrderBy.Liquidity,
      orderDirection: OrderDirection.Desc,
      first: 1,
    });
    const { token0 } = getToken0Token1(wrappedAddress, collateralToken.address);
    const pool = pools[0];
    if (!pool) {
      return Number.NaN;
    }
    const [price0, price1] = tickToPrice(Number(pool.tick));
    return isTwoStringsEqual(wrappedAddress, token0) ? Number(price0) : Number(price1);
  } catch {
    return Number.NaN;
  }
}

export async function getTokenPrice(wrappedAddress: Address, collateralToken: Token, chainId: SupportedChain) {
  if (chainId === gnosis.id) {
    return await getTokenPriceFromSubgraph(wrappedAddress, collateralToken, chainId);
  }
  return await getTokenPriceFromSwap(wrappedAddress, collateralToken, chainId);
}

export async function getMarketOdds(market: Market, hasLiquidity: boolean) {
  if (!hasLiquidity) {
    return Array(market.wrappedTokens.length).fill(Number.NaN);
  }

  const collateralToken = {
    address: market.collateralToken,
    decimals: 18,
    name: "",
    symbol: "",
  };

  const prices = await Promise.all(
    market.wrappedTokens.map((wrappedAddress) => getTokenPrice(wrappedAddress, collateralToken, market.chainId)),
  );

  return normalizeOdds(prices);
}

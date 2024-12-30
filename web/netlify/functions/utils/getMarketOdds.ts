import { formatUnits } from "viem";
import { bigIntMax, isTwoStringsEqual } from "./common.ts";
import { COLLATERAL_TOKENS, SupportedChain } from "./config.ts";
import { POOL_SUBGRAPH_URLS } from "./constants.ts";
import { fetchMarket } from "./fetchMarkets.ts";
import { getCowQuote, getSwaprQuote, getUniswapQuote } from "./getQuotes.ts";
import { getTokenInfo } from "./getTokenInfo.ts";
import { Address, Market, Token } from "./types.ts";

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

export async function fetchPools(chainId: string, collateralToken: Token) {
  const query = `{
    pools(first: 1000, where: {
          or: [
            { token0: "${collateralToken.address.toLocaleLowerCase()}" },
            { token1: "${collateralToken.address.toLocaleLowerCase()}" },
          ],
        }) {
      id
      liquidity
      token0 {
        id
      }
      token1 {
        id
      }
    }
  }`;
  const results = await fetch(POOL_SUBGRAPH_URLS[chainId]!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
    }),
  });
  const json = await results.json();

  return json?.data?.pools ?? [];
}

async function checkMarketHasLiquidity(
  chainId: SupportedChain,
  wrappedAddresses: `0x${string}`[],
  collateralToken: Token,
) {
  const outcomePools = await fetchPools(chainId.toString(), collateralToken);
  const outcomeLiquidityMapping = outcomePools.reduce(
    (obj, item) => {
      const outcomeTokenId = isTwoStringsEqual(item.token0.id, collateralToken.address)
        ? item.token1.id
        : item.token0.id;
      obj[outcomeTokenId.toLowerCase()] =
        obj[outcomeTokenId.toLowerCase()] > BigInt(item.liquidity)
          ? obj[outcomeTokenId.toLowerCase()]
          : BigInt(item.liquidity);
      return obj;
    },
    {} as { [key: string]: bigint },
  );
  return bigIntMax(...(wrappedAddresses?.map((address) => outcomeLiquidityMapping[address.toLowerCase()]) ?? [])) > 0n;
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

export async function getMarketOdds(market: Market) {
  const parentMarket = await fetchMarket(market.parentMarket.id, market.chainId.toString());
  const parentCollateral =
    parentMarket?.wrappedTokens?.[Number(market.parentOutcome)] &&
    (await getTokenInfo(parentMarket.wrappedTokens[Number(market.parentOutcome)], market.chainId));
  const collateralToken = parentCollateral || COLLATERAL_TOKENS[market.chainId].primary;

  const hasLiquidity = await checkMarketHasLiquidity(market.chainId, market.wrappedTokens, collateralToken);
  if (!hasLiquidity) {
    return Array(market.wrappedTokens.length).fill(Number.NaN);
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
}

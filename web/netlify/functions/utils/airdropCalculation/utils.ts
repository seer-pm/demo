import { TickMath } from "@uniswap/v3-sdk";
import type { Address } from "viem";
import type { SubgraphMarket } from "./getAllMarkets";

export function getTokensByTimestamp(markets: SubgraphMarket[], timestamp: number) {
  return markets.reduce(
    (acum, market) => {
      if (Number(market.finalizeTs) > timestamp) {
        for (let i = 0; i < market.wrappedTokens.length; i++) {
          const tokenId = market.wrappedTokens[i] as Address;
          acum[tokenId] = true;
        }
      }
      return acum;
    },
    {} as { [key: Address]: boolean },
  );
}

export function getRandomNextDayTimestamp(timestampInSeconds: number, lastDayInSeconds: number) {
  // Get start of next UTC day
  const date = new Date(timestampInSeconds * 1000);
  date.setUTCDate(date.getUTCDate() + 1);
  date.setUTCHours(0, 0, 0, 0);

  const nextDayStartSeconds = Math.floor(date.getTime() / 1000);
  const nextDayEndSeconds = nextDayStartSeconds + 86400;
  // we need to wait a whole day to get a true random snapshot
  if (nextDayEndSeconds >= lastDayInSeconds) return;

  const randomOffset = Math.floor(Math.random() * 86400);

  return nextDayStartSeconds + randomOffset;
}

const Q96 = 2n ** 96n;

function getSqrtPriceAtTick(tick: number): bigint {
  return BigInt(TickMath.getSqrtRatioAtTick(tick).toString());
}

// Calculate amount0 and amount1 for burning X LP tokens
export function calculateBurnAmounts(
  X: bigint,
  totalSupply: bigint,
  liquidity: bigint,
  tickCurrent: number,
  tickLower: number,
  tickUpper: number,
): { amount0: bigint; amount1: bigint } {
  const deltaL = (liquidity * X) / totalSupply;

  const sqrtLower = getSqrtPriceAtTick(tickLower);
  const sqrtUpper = getSqrtPriceAtTick(tickUpper);
  const sqrtCurrent = getSqrtPriceAtTick(tickCurrent);
  let amount0: bigint;
  let amount1: bigint;

  if (tickCurrent < tickLower) {
    // Below range: only token1
    amount0 = 0n;
    amount1 = (deltaL * (sqrtUpper - sqrtLower)) / Q96;
  } else if (tickCurrent >= tickUpper) {
    // Above range: only token0
    amount0 = (deltaL * (sqrtUpper - sqrtLower) * Q96) / (sqrtLower * sqrtUpper);
    amount1 = 0n;
  } else {
    // In range: both token0 and token1
    const invSqrtCurrent = (Q96 * Q96) / sqrtCurrent;
    const invSqrtUpper = (Q96 * Q96) / sqrtUpper;

    amount0 = (deltaL * (invSqrtCurrent - invSqrtUpper)) / Q96;
    amount1 = (deltaL * (sqrtCurrent - sqrtLower)) / Q96;
  }

  return { amount0, amount1 };
}

export function mergeTokenBalances(
  map1: { [key: string]: { [key: string]: number } },
  map2: { [key: string]: { [key: string]: number } },
) {
  const result: { [key: string]: { [key: string]: number } } = {};

  // Merge map1 first
  for (const [address, tokens] of Object.entries(map1)) {
    result[address] = result[address] || {};
    for (const [token, amount] of Object.entries(tokens)) {
      result[address][token] = (result[address][token] || 0) + amount;
    }
  }

  // Merge map2
  for (const [address, tokens] of Object.entries(map2)) {
    result[address] = result[address] || {};
    for (const [token, amount] of Object.entries(tokens)) {
      result[address][token] = (result[address][token] || 0) + amount;
    }
  }

  // Optionally: filter out zero balances
  for (const address in result) {
    for (const token in result[address]) {
      if (result[address][token] === 0) {
        delete result[address][token];
      }
    }
    if (Object.keys(result[address]).length === 0) {
      delete result[address];
    }
  }

  return result;
}

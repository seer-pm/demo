import { TickMath } from "@uniswap/v3-sdk";
import { BigNumber } from "ethers";
import { Address } from "viem";
import { SubgraphMarket } from "./getAllMarkets";

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
  // No valid range if nextDayStart >= lastDay
  if (nextDayStartSeconds >= lastDayInSeconds) return;

  const maxExclusive = Math.min(nextDayEndSeconds, lastDayInSeconds);

  const range = maxExclusive - nextDayStartSeconds;
  const randomOffset = Math.floor(Math.random() * range);

  return nextDayStartSeconds + randomOffset;
}

const Q96 = BigNumber.from(2).pow(96);

function getSqrtPriceAtTick(tick: number) {
  return BigNumber.from(TickMath.getSqrtRatioAtTick(tick).toString());
}

// Calculate amount0 and amount1 for burning X LP tokens
export function calculateBurnAmounts(
  X: BigNumber,
  totalSupply: BigNumber,
  liquidity: BigNumber,
  tickCurrent: number,
  tickLower: number,
  tickUpper: number,
) {
  const deltaL = liquidity.mul(X).div(totalSupply);

  const sqrtLower = getSqrtPriceAtTick(tickLower);
  const sqrtUpper = getSqrtPriceAtTick(tickUpper);
  const sqrtCurrent = getSqrtPriceAtTick(tickCurrent);
  let amount0: BigNumber;
  let amount1: BigNumber;

  if (tickCurrent < tickLower) {
    // Below range: only token1
    amount0 = BigNumber.from(0);
    amount1 = deltaL.mul(sqrtUpper.sub(sqrtLower)).div(Q96);
  } else if (tickCurrent >= tickUpper) {
    // Above range: only token0
    amount0 = deltaL.mul(sqrtUpper.sub(sqrtLower)).mul(Q96).div(sqrtLower.mul(sqrtUpper));
    amount1 = BigNumber.from(0);
  } else {
    // In range: both token0 and token1
    const invSqrtCurrent = Q96.mul(Q96).div(sqrtCurrent);
    const invSqrtUpper = Q96.mul(Q96).div(sqrtUpper);

    amount0 = deltaL.mul(invSqrtCurrent.sub(invSqrtUpper)).div(Q96);
    amount1 = deltaL.mul(sqrtCurrent.sub(sqrtLower)).div(Q96);
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

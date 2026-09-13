import { displayBalance, displayNumber } from "@/lib/utils";
import {
  type LimitOrderWithdrawAmounts,
  OUTCOME_TOKEN_DECIMALS,
  type OrderBookPoolKey,
  createV4PoolInstance,
} from "@seer-pm/order-book/v4";
import { type Market, getActivePrimaryCollateral } from "@seer-pm/sdk";
import { getSqrtRatioAtTick } from "@seer-pm/sdk/tick-math";
import { Position } from "@uniswap/v4-sdk";
import type { Address } from "viem";

export type UiUserOrder = {
  id: string;
  orderId: string;
  owner: Address;
  poolId: Address;
  outcomeIndex: number;
  outcomeIsToken0: boolean;
  tickLower: number;
  zeroForOne: boolean;
  status: string;
  liquidity: string;
  placedAtBlock: string;
  updatedAtBlock: string;
};

export type PoolMeta = {
  outcomeIndex: number;
  outcomeIsToken0: boolean;
  poolKey: OrderBookPoolKey;
  market?: Market;
};

export function getOrderSideLabel(zeroForOne: boolean, outcomeIsToken0: boolean): "Buy" | "Sell" {
  return zeroForOne === !outcomeIsToken0 ? "Buy" : "Sell";
}

function formatLiquidityCompact(liquidity: bigint): string {
  const s = liquidity.toString();
  if (s.length <= 6) return s;

  if (liquidity <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return displayNumber(Number(liquidity), 2, true);
  }

  return `${s[0]}.${s.slice(1, 3)}e${s.length - 1}`;
}

export type OrderPayAmount = { amount: bigint; decimals: number; symbol: string };

/**
 * Token the order pays (collateral for buys, outcome for sells) and how much of it the given
 * liquidity represents at the order's tick range. `null` when the liquidity does not convert.
 */
export function getOrderPayAmount(
  liquidity: bigint,
  tickLower: number,
  zeroForOne: boolean,
  pool: PoolMeta,
  market: Market,
): OrderPayAmount | null {
  const collateral = getActivePrimaryCollateral(market.chainId);
  const paysToken0 = zeroForOne;
  const token0IsOutcome = pool.outcomeIsToken0;
  const paysOutcome = paysToken0 === token0IsOutcome;
  const decimals = paysOutcome ? OUTCOME_TOKEN_DECIMALS : collateral.decimals;
  const symbol = paysOutcome ? (market.outcomes[pool.outcomeIndex] ?? "Outcome") : collateral.symbol;

  try {
    const tickUpper = tickLower + pool.poolKey.tickSpacing;
    const depositTick = zeroForOne ? tickLower - pool.poolKey.tickSpacing : tickUpper;
    const sqrtPriceX96 = getSqrtRatioAtTick(depositTick);
    const poolInstance = createV4PoolInstance(market.chainId, pool.poolKey, sqrtPriceX96, 0n, depositTick);
    const position = new Position({
      pool: poolInstance,
      liquidity: liquidity.toString(),
      tickLower,
      tickUpper,
    });
    const amount = zeroForOne
      ? BigInt(position.mintAmounts.amount0.toString())
      : BigInt(position.mintAmounts.amount1.toString());
    return amount > 0n ? { amount, decimals, symbol } : null;
  } catch {
    return null;
  }
}

function formatOpenOrderSize(order: UiUserOrder, pool: PoolMeta, market: Market): string {
  const liquidity = BigInt(order.liquidity);
  if (liquidity === 0n) return "0";

  const pay = getOrderPayAmount(liquidity, order.tickLower, order.zeroForOne, pool, market);
  if (pay) {
    return `${displayBalance(pay.amount, pay.decimals)} ${pay.symbol}`;
  }

  return formatLiquidityCompact(liquidity);
}

function formatWithdrawAmounts(amounts: LimitOrderWithdrawAmounts, pool: PoolMeta, market: Market): string {
  const collateral = getActivePrimaryCollateral(market.chainId);
  const outcomeLabel = market.outcomes[pool.outcomeIndex] ?? "Outcome";
  const parts: string[] = [];

  if (amounts.amount0 > 0n) {
    const decimals = pool.outcomeIsToken0 ? OUTCOME_TOKEN_DECIMALS : collateral.decimals;
    const symbol = pool.outcomeIsToken0 ? outcomeLabel : collateral.symbol;
    parts.push(`${displayBalance(amounts.amount0, decimals)} ${symbol}`);
  }

  if (amounts.amount1 > 0n) {
    const decimals = pool.outcomeIsToken0 ? collateral.decimals : OUTCOME_TOKEN_DECIMALS;
    const symbol = pool.outcomeIsToken0 ? collateral.symbol : outcomeLabel;
    parts.push(`${displayBalance(amounts.amount1, decimals)} ${symbol}`);
  }

  return parts.join(" + ") || "0";
}

export function formatOrderSize(
  order: UiUserOrder,
  pool: PoolMeta,
  market: Market,
  withdrawAmounts?: LimitOrderWithdrawAmounts,
): string {
  if (withdrawAmounts) {
    return formatWithdrawAmounts(withdrawAmounts, pool, market);
  }

  return formatOpenOrderSize(order, pool, market);
}

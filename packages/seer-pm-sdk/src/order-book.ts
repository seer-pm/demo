import { Percent, Token } from "@uniswap/sdk-core";
import { Pool, Position, V4PositionManager } from "@uniswap/v4-sdk";
import type { Config } from "@wagmi/core";
import { readContract, simulateContract, writeContract } from "@wagmi/core";
import type { Address, Hex } from "viem";
import { erc20Abi, formatUnits, maxUint256 } from "viem";
import { base } from "viem/chains";
import {
  limitOrderHookAddress,
  readLimitOrderHookGetOrderInfo,
  readLimitOrderHookGetOrderLiquidity,
  simulateLimitOrderHookWithdraw,
  writeLimitOrderHookPlaceOrder,
  writeSeerUniV4PoolInitializerInitializePool,
} from "../generated/contracts/order-book";
import type { Market } from "./market-types";
import {
  type OrderBookPoolKey,
  PERMIT2_ADDRESS,
  V4_POSITION_MANAGER_ADDRESS,
  chainSupportsOrderBook,
  clampProbability,
  getOrderBookPoolParams,
  permit2Abi,
  positionManagerAbi,
} from "./order-book-config";
import { tickToPrice } from "./tick-math";
import { getSqrtRatioAtTick, getTickAtSqrtRatio, nearestUsableTick } from "./tick-math";

export * from "./order-book-config";

const TICK_SEARCH_MIN = -69077;
const TICK_SEARCH_MAX = 69077;

export function probabilityToTick(probability: number, outcomeIsToken0: boolean, tickSpacing = 60): number {
  const target = clampProbability(probability);
  const tickMin = outcomeIsToken0 ? TICK_SEARCH_MIN : 0;
  const tickMax = outcomeIsToken0 ? 0 : TICK_SEARCH_MAX;

  let lo = tickMin;
  let hi = tickMax;

  while (lo < hi) {
    const mid = outcomeIsToken0 ? Math.floor((lo + hi) / 2) : Math.ceil((lo + hi) / 2);
    const [price0, price1] = tickToPrice(mid, 18, true);
    const price = Number(outcomeIsToken0 ? price0 : price1);

    if (outcomeIsToken0) {
      // price0 increases as tick increases
      if (price < target) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    } else {
      // price1 decreases as tick increases — find the highest tick still at/above target
      if (price >= target) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
  }

  return nearestUsableTick(lo, tickSpacing);
}

export function probabilityRangeToTicks(
  minPrice: number,
  maxPrice: number,
  outcomeIsToken0: boolean,
  tickSpacing = 60,
): { tickLower: number; tickUpper: number } {
  const min = clampProbability(Math.min(minPrice, maxPrice));
  const max = clampProbability(Math.max(minPrice, maxPrice));

  const tickA = probabilityToTick(min, outcomeIsToken0, tickSpacing);
  const tickB = probabilityToTick(max, outcomeIsToken0, tickSpacing);

  const tickLower = Math.min(tickA, tickB);
  const tickUpper = Math.max(tickA, tickB);

  if (tickLower === tickUpper) {
    return outcomeIsToken0
      ? { tickLower: tickLower - tickSpacing, tickUpper }
      : { tickLower, tickUpper: tickUpper + tickSpacing };
  }

  return { tickLower, tickUpper };
}

export function createV4PoolInstance(
  chainId: number,
  poolKey: OrderBookPoolKey,
  sqrtPriceX96: bigint,
  liquidity = 0n,
  tickCurrent?: number,
  token0Decimals = 18,
  token1Decimals = 18,
): Pool {
  const token0 = new Token(chainId, poolKey.currency0, token0Decimals);
  const token1 = new Token(chainId, poolKey.currency1, token1Decimals);

  let resolvedTick = tickCurrent;
  if (resolvedTick === undefined) {
    try {
      resolvedTick = getTickAtSqrtRatio(sqrtPriceX96);
    } catch {
      resolvedTick = 0;
    }
  }

  return new Pool(
    token0,
    token1,
    poolKey.fee,
    poolKey.tickSpacing,
    poolKey.hooks,
    sqrtPriceX96.toString(),
    liquidity.toString(),
    resolvedTick,
  );
}

/** Price for UI amount linking: pool price when known, else initialPrice for new pools. */
export function resolveLiquiditySqrtPriceX96({
  chainId,
  poolKey,
  outcomeIsToken0,
  minPrice,
  maxPrice,
  initialPrice,
  poolSqrtPriceX96,
}: {
  chainId: number;
  poolKey: OrderBookPoolKey;
  outcomeIsToken0: boolean;
  minPrice: number;
  maxPrice: number;
  initialPrice?: number;
  poolSqrtPriceX96?: bigint;
}): bigint {
  if (poolSqrtPriceX96) {
    return poolSqrtPriceX96;
  }

  if (initialPrice === undefined) {
    throw new Error("initialPrice is required when pool is not initialized");
  }

  return getSqrtRatioAtTick(probabilityToTick(initialPrice, outcomeIsToken0, poolKey.tickSpacing));
}

export function computePositionAmounts({
  chainId,
  poolKey,
  sqrtPriceX96,
  tickLower,
  tickUpper,
  amount0,
  amount1,
  token0Decimals = 18,
  token1Decimals = 18,
}: {
  chainId: number;
  poolKey: OrderBookPoolKey;
  sqrtPriceX96: bigint;
  tickLower: number;
  tickUpper: number;
  amount0?: bigint;
  amount1?: bigint;
  token0Decimals?: number;
  token1Decimals?: number;
}): { amount0: bigint; amount1: bigint } {
  const pool = createV4PoolInstance(chainId, poolKey, sqrtPriceX96, 0n, undefined, token0Decimals, token1Decimals);

  if (amount0 !== undefined && amount0 > 0n) {
    const position = Position.fromAmount0({
      pool,
      tickLower,
      tickUpper,
      amount0: amount0.toString(),
      useFullPrecision: true,
    });
    return {
      amount0: BigInt(position.mintAmounts.amount0.toString()),
      amount1: BigInt(position.mintAmounts.amount1.toString()),
    };
  }

  if (amount1 !== undefined && amount1 > 0n) {
    const position = Position.fromAmount1({
      pool,
      tickLower,
      tickUpper,
      amount1: amount1.toString(),
    });
    return {
      amount0: BigInt(position.mintAmounts.amount0.toString()),
      amount1: BigInt(position.mintAmounts.amount1.toString()),
    };
  }

  throw new Error("At least one token amount must be greater than zero");
}

export function buildV4Position({
  chainId,
  poolKey,
  sqrtPriceX96,
  tickLower,
  tickUpper,
  amount0,
  amount1,
  token0Decimals = 18,
  token1Decimals = 18,
}: {
  chainId: number;
  poolKey: OrderBookPoolKey;
  sqrtPriceX96: bigint;
  tickLower: number;
  tickUpper: number;
  amount0: bigint;
  amount1: bigint;
  token0Decimals?: number;
  token1Decimals?: number;
}) {
  const pool = createV4PoolInstance(chainId, poolKey, sqrtPriceX96, 0n, undefined, token0Decimals, token1Decimals);

  if (amount0 > 0n && amount1 > 0n) {
    return Position.fromAmounts({
      pool,
      tickLower,
      tickUpper,
      amount0: amount0.toString(),
      amount1: amount1.toString(),
      useFullPrecision: true,
    });
  }

  const { amount0: resolvedAmount0, amount1: resolvedAmount1 } = computePositionAmounts({
    chainId,
    poolKey,
    sqrtPriceX96,
    tickLower,
    tickUpper,
    amount0: amount0 > 0n ? amount0 : undefined,
    amount1: amount1 > 0n ? amount1 : undefined,
    token0Decimals,
    token1Decimals,
  });

  return Position.fromAmounts({
    pool,
    tickLower,
    tickUpper,
    amount0: resolvedAmount0.toString(),
    amount1: resolvedAmount1.toString(),
    useFullPrecision: true,
  });
}

export function buildMintV4PositionCalldata({
  chainId,
  poolKey,
  sqrtPriceX96,
  tickLower,
  tickUpper,
  amount0,
  amount1,
  recipient,
  slippageBps = 50,
}: {
  chainId: number;
  poolKey: OrderBookPoolKey;
  sqrtPriceX96: bigint;
  tickLower: number;
  tickUpper: number;
  amount0: bigint;
  amount1: bigint;
  recipient: Address;
  slippageBps?: number;
}): { calldata: Hex; value: bigint } {
  const position = buildV4Position({
    chainId,
    poolKey,
    sqrtPriceX96,
    tickLower,
    tickUpper,
    amount0,
    amount1,
  });

  const deadline = Math.floor(Date.now() / 1000) + 1200;
  const { calldata, value } = V4PositionManager.addCallParameters(position, {
    slippageTolerance: new Percent(slippageBps, 10_000),
    deadline: deadline.toString(),
    recipient,
    hookData: "0x",
    createPool: false,
  });

  return { calldata: calldata as Hex, value: BigInt(value) };
}

export async function ensurePermit2Allowance(
  config: Config,
  {
    token,
    owner,
    amount,
    chainId,
  }: {
    token: Address;
    owner: Address;
    amount: bigint;
    chainId: number;
  },
): Promise<void> {
  const positionManager = V4_POSITION_MANAGER_ADDRESS[chainId as keyof typeof V4_POSITION_MANAGER_ADDRESS];
  if (!positionManager) {
    throw new Error("V4 PositionManager not configured for chain");
  }

  const expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;

  const allowance = await readContract(config, {
    address: PERMIT2_ADDRESS,
    abi: permit2Abi,
    functionName: "allowance",
    args: [owner, token, positionManager as Address],
    chainId,
  });

  if (allowance[0] >= amount && Number(allowance[1]) > Date.now() / 1000) {
    return;
  }

  await writeContract(config, {
    address: PERMIT2_ADDRESS,
    abi: permit2Abi,
    functionName: "approve",
    args: [token, positionManager as Address, amount > maxUint256 / 2n ? maxUint256 / 2n : amount, expiration],
    chainId,
  });
}

export async function initializeOrderBookPool(
  config: Config,
  {
    market,
    outcomeIndex,
    sqrtPriceX96,
  }: {
    market: Market;
    outcomeIndex: number;
    sqrtPriceX96: bigint;
  },
): Promise<Hex> {
  const { poolKey, token0, token1 } = getOrderBookPoolParams(market, outcomeIndex);

  return writeSeerUniV4PoolInitializerInitializePool(config, {
    args: [token0, token1, poolKey.hooks, poolKey.fee, poolKey.tickSpacing, sqrtPriceX96],
    chainId: base.id,
  });
}

export async function mintV4Position(
  config: Config,
  {
    chainId,
    poolKey,
    sqrtPriceX96,
    tickLower,
    tickUpper,
    amount0,
    amount1,
    recipient,
  }: {
    chainId: number;
    poolKey: OrderBookPoolKey;
    sqrtPriceX96: bigint;
    tickLower: number;
    tickUpper: number;
    amount0: bigint;
    amount1: bigint;
    recipient: Address;
  },
): Promise<Hex> {
  const positionManager = V4_POSITION_MANAGER_ADDRESS[chainId as keyof typeof V4_POSITION_MANAGER_ADDRESS];
  if (!positionManager) {
    throw new Error("V4 PositionManager not configured for chain");
  }

  const { calldata, value } = buildMintV4PositionCalldata({
    chainId,
    poolKey,
    sqrtPriceX96,
    tickLower,
    tickUpper,
    amount0,
    amount1,
    recipient,
  });

  return writeContract(config, {
    address: positionManager,
    abi: positionManagerAbi,
    functionName: "multicall",
    args: [[calldata]],
    value,
    chainId,
  });
}

export function getNearestLimitOrderPrice(
  limitPrice: number,
  outcomeIsToken0: boolean,
  tickSpacing = 60,
): { tick: number; nearestPrice: number } {
  const tick = probabilityToTick(limitPrice, outcomeIsToken0, tickSpacing);
  const [price0, price1] = tickToPrice(tick, 18, true);
  const nearestPrice = Number(outcomeIsToken0 ? price0 : price1);
  return { tick, nearestPrice };
}

export function getOutcomePriceAtTick(tick: number, outcomeIsToken0: boolean): number {
  const [price0, price1] = tickToPrice(tick, 18, true);
  return Number(outcomeIsToken0 ? price0 : price1);
}

export function getLimitOrderPriceRule(
  swapType: "buy" | "sell",
  outcomeIsToken0: boolean,
): { direction: "at_or_below" | "above"; side: "buy" | "sell" } {
  const zeroForOne = resolveLimitOrderZeroForOne(swapType, outcomeIsToken0);
  return {
    direction: zeroForOne ? "above" : "at_or_below",
    side: swapType,
  };
}

export function formatLimitOrderPriceError(
  swapType: "buy" | "sell",
  outcomeIsToken0: boolean,
  currentPrice: number,
): string {
  const price = currentPrice.toFixed(3);
  const { direction } = getLimitOrderPriceRule(swapType, outcomeIsToken0);

  if (direction === "at_or_below") {
    return `For a ${swapType} order, set a limit price at or below the current market price (${price}).`;
  }

  return `For a ${swapType} order, set a limit price above the current market price (${price}).`;
}

export function formatLimitOrderPriceHint(
  swapType: "buy" | "sell",
  outcomeIsToken0: boolean,
  currentPrice: number,
): string {
  const price = currentPrice.toFixed(3);
  const { direction, side } = getLimitOrderPriceRule(swapType, outcomeIsToken0);
  const action = side === "buy" ? "Buy" : "Sell";

  if (direction === "at_or_below") {
    return `${action} when the price drops — set a limit at or below ${price}.`;
  }

  return `${action} when the price rises — set a limit above ${price}.`;
}

export function resolveLimitOrderZeroForOne(swapType: "buy" | "sell", outcomeIsToken0: boolean): boolean {
  return swapType === "buy" ? !outcomeIsToken0 : outcomeIsToken0;
}

function validateLimitOrderTickPlacement(
  zeroForOne: boolean,
  tickLower: number,
  currentTick: number,
  tickSpacing: number,
  swapType: "buy" | "sell",
  outcomeIsToken0: boolean,
): void {
  const currentPrice = getOutcomePriceAtTick(currentTick, outcomeIsToken0);

  if (zeroForOne) {
    if (tickLower <= currentTick) {
      throw new Error(formatLimitOrderPriceError(swapType, outcomeIsToken0, currentPrice));
    }
    return;
  }

  if (tickLower + tickSpacing > currentTick) {
    throw new Error(formatLimitOrderPriceError(swapType, outcomeIsToken0, currentPrice));
  }
}

function computeMinReceiveAmount(
  payAmount: bigint,
  nearestPrice: number,
  swapType: "buy" | "sell",
  payDecimals: number,
  receiveDecimals: number,
): bigint {
  const pay = Number(formatUnits(payAmount, payDecimals));
  if (pay <= 0 || nearestPrice <= 0) {
    return 0n;
  }

  const receive = swapType === "buy" ? pay / nearestPrice : pay * nearestPrice;
  const factor = 10 ** receiveDecimals;
  const scaled = Math.floor(receive * factor);
  return BigInt(scaled);
}

export type LimitOrderParams = {
  tick: number;
  tickLower: number;
  tickUpper: number;
  zeroForOne: boolean;
  liquidity: bigint;
  nearestPrice: number;
  totalPay: { amount0: bigint; amount1: bigint };
  minReceive: { amount0: bigint; amount1: bigint };
  payToken: "token0" | "token1";
  receiveToken: "token0" | "token1";
};

export function computeLimitOrderParams({
  chainId,
  poolKey,
  outcomeIsToken0,
  swapType,
  limitPrice,
  payAmount,
  currentTick,
  sqrtPriceX96: _sqrtPriceX96,
  payDecimals,
  receiveDecimals,
}: {
  chainId: number;
  poolKey: OrderBookPoolKey;
  outcomeIsToken0: boolean;
  swapType: "buy" | "sell";
  limitPrice: number;
  payAmount: bigint;
  currentTick: number;
  sqrtPriceX96: bigint;
  payDecimals: number;
  receiveDecimals: number;
}): LimitOrderParams {
  if (payAmount <= 0n) {
    throw new Error("Amount must be greater than zero.");
  }

  const { tick, nearestPrice } = getNearestLimitOrderPrice(limitPrice, outcomeIsToken0, poolKey.tickSpacing);
  const tickLower = tick;
  const tickUpper = tick + poolKey.tickSpacing;
  const zeroForOne = resolveLimitOrderZeroForOne(swapType, outcomeIsToken0);

  validateLimitOrderTickPlacement(zeroForOne, tickLower, currentTick, poolKey.tickSpacing, swapType, outcomeIsToken0);

  const poolSqrtPriceX96 = getSqrtRatioAtTick(currentTick);
  const pool = createV4PoolInstance(chainId, poolKey, poolSqrtPriceX96, 0n, currentTick);

  const position = zeroForOne
    ? Position.fromAmount0({
        pool,
        tickLower,
        tickUpper,
        amount0: payAmount.toString(),
        useFullPrecision: true,
      })
    : Position.fromAmount1({
        pool,
        tickLower,
        tickUpper,
        amount1: payAmount.toString(),
      });

  const liquidity = BigInt(position.liquidity.toString());
  if (liquidity === 0n) {
    throw new Error("Order liquidity is zero. Try a larger amount.");
  }

  const totalPay = {
    amount0: BigInt(position.mintAmounts.amount0.toString()),
    amount1: BigInt(position.mintAmounts.amount1.toString()),
  };

  const payToken = zeroForOne ? "token0" : "token1";
  const receiveToken = zeroForOne ? "token1" : "token0";
  const actualPayAmount = payToken === "token0" ? totalPay.amount0 : totalPay.amount1;
  const minReceiveAmount = computeMinReceiveAmount(
    actualPayAmount,
    nearestPrice,
    swapType,
    payDecimals,
    receiveDecimals,
  );

  const minReceive = {
    amount0: receiveToken === "token0" ? minReceiveAmount : 0n,
    amount1: receiveToken === "token1" ? minReceiveAmount : 0n,
  };

  return {
    tick,
    tickLower,
    tickUpper,
    zeroForOne,
    liquidity,
    nearestPrice,
    totalPay,
    minReceive,
    payToken,
    receiveToken,
  };
}

export function getLimitOrderHookAddress(chainId: number): Address | undefined {
  return limitOrderHookAddress[chainId as keyof typeof limitOrderHookAddress] as Address | undefined;
}

export type LimitOrderWithdrawAmounts = {
  amount0: bigint;
  amount1: bigint;
  currency0: Address;
  currency1: Address;
};

/**
 * Returns the token amounts a user would receive from `withdraw(orderId, owner)`.
 * Uses on-chain simulation so checkpoint/fee accounting matches the hook exactly.
 */
export async function getLimitOrderWithdrawAmounts(
  config: Config,
  {
    chainId,
    orderId,
    owner,
  }: {
    chainId: number;
    orderId: bigint;
    owner: Address;
  },
): Promise<LimitOrderWithdrawAmounts | null> {
  if (!chainSupportsOrderBook(chainId)) {
    return null;
  }

  const [filled, currency0, currency1, , , liquidityTotal] = await readLimitOrderHookGetOrderInfo(config, {
    args: [orderId],
    chainId: base.id,
  });

  if (!filled || liquidityTotal === 0n) {
    return null;
  }

  const userLiquidity = await readLimitOrderHookGetOrderLiquidity(config, {
    args: [orderId, owner],
    chainId: base.id,
  });

  if (userLiquidity === 0n) {
    return null;
  }

  const { result } = await simulateLimitOrderHookWithdraw(config, {
    args: [orderId, owner],
    account: owner,
    chainId: base.id,
  });

  return {
    amount0: result[0],
    amount1: result[1],
    currency0,
    currency1,
  };
}

export async function ensureLimitOrderAllowance(
  config: Config,
  {
    token,
    owner,
    amount,
    chainId,
  }: {
    token: Address;
    owner: Address;
    amount: bigint;
    chainId: number;
  },
): Promise<void> {
  const hookAddress = getLimitOrderHookAddress(chainId);
  if (!hookAddress) {
    throw new Error("LimitOrderHook not configured for chain");
  }

  const allowance = await readContract(config, {
    address: token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, hookAddress],
    chainId,
  });

  if (allowance >= amount) {
    return;
  }

  await writeContract(config, {
    address: token,
    abi: erc20Abi,
    functionName: "approve",
    args: [hookAddress, maxUint256],
    chainId,
  });
}

export async function placeLimitOrder(
  config: Config,
  {
    chainId,
    poolKey,
    tick,
    zeroForOne,
    liquidity,
  }: {
    chainId: number;
    poolKey: OrderBookPoolKey;
    tick: number;
    zeroForOne: boolean;
    liquidity: bigint;
  },
): Promise<Hex> {
  const hookAddress = getLimitOrderHookAddress(chainId);
  if (!hookAddress) {
    throw new Error("LimitOrderHook not configured for chain");
  }

  if (!chainSupportsOrderBook(chainId)) {
    throw new Error("Limit orders are not supported on this chain");
  }

  return writeLimitOrderHookPlaceOrder(config, {
    args: [
      {
        currency0: poolKey.currency0,
        currency1: poolKey.currency1,
        fee: poolKey.fee,
        tickSpacing: poolKey.tickSpacing,
        hooks: poolKey.hooks,
      },
      tick,
      zeroForOne,
      liquidity,
    ],
    chainId: base.id,
  });
}

export async function simulateMintV4Position(
  config: Config,
  params: Parameters<typeof mintV4Position>[1],
): Promise<void> {
  const positionManager = V4_POSITION_MANAGER_ADDRESS[params.chainId as keyof typeof V4_POSITION_MANAGER_ADDRESS];
  if (!positionManager) {
    throw new Error("V4 PositionManager not configured for chain");
  }

  const { calldata, value } = buildMintV4PositionCalldata({
    chainId: params.chainId,
    poolKey: params.poolKey,
    sqrtPriceX96: params.sqrtPriceX96,
    tickLower: params.tickLower,
    tickUpper: params.tickUpper,
    amount0: params.amount0,
    amount1: params.amount1,
    recipient: params.recipient,
  });

  await simulateContract(config, {
    address: positionManager,
    abi: positionManagerAbi,
    functionName: "multicall",
    args: [[calldata]],
    value,
    chainId: params.chainId,
  });
}

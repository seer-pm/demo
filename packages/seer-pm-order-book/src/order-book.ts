import {
  limitOrderHookAddress,
  readLimitOrderHookGetOrderLiquidity,
  readLimitOrderHookOrderInfos,
  simulateLimitOrderHookWithdraw,
  writeLimitOrderHookPlaceOrder,
} from "@seer-pm/contracts-ts/order-book";
import type { Execution, Market } from "@seer-pm/sdk";
import { getSqrtRatioAtTick, tickToPrice } from "@seer-pm/sdk/tick-math";
import { Percent, Token } from "@uniswap/sdk-core";
import { Pool, Position, V4PositionManager } from "@uniswap/v4-sdk";
import type { Config } from "@wagmi/core";
import { readContract, sendTransaction, simulateContract, waitForTransactionReceipt } from "@wagmi/core";
import type { Address, Hex } from "viem";
import { encodeFunctionData, erc20Abi } from "viem";
import {
  type OrderBookPoolKey,
  PERMIT2_ADDRESS,
  V4_POSITION_MANAGER_ADDRESS,
  chainSupportsOrderBook,
  clampProbability,
  getOrderBookPoolParams,
  getV4PoolManagerAddress,
  permit2Abi,
  poolManagerAbi,
  positionManagerAbi,
} from "./order-book-config";
import { getTickAtSqrtRatio, nearestUsableTick } from "./tick-helpers";

export * from "./order-book-config";

/** Permit2 allowances are uint160. */
export const MAX_UINT160 = (1n << 160n) - 1n;

/** Default slippage applied to mint/remove calldata (50 bps). */
export const V4_LIQUIDITY_SLIPPAGE_BPS = 50;

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
  poolKey,
  outcomeIsToken0,
  initialPrice,
  poolSqrtPriceX96,
}: {
  poolKey: OrderBookPoolKey;
  outcomeIsToken0: boolean;
  initialPrice?: number;
  poolSqrtPriceX96?: bigint;
}): bigint {
  if (poolSqrtPriceX96) {
    return poolSqrtPriceX96;
  }

  if (initialPrice === undefined) {
    throw new Error("initialPrice is required when pool is not initialized");
  }

  return getStartingPoolState(initialPrice, outcomeIsToken0, poolKey.tickSpacing).sqrtPriceX96;
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

/**
 * Maximum token amounts the PositionManager may pull for a mint, i.e. the quoted amounts
 * plus the slippage tolerance baked into `buildMintV4PositionCalldata`. Approve these.
 */
export function getMintV4PositionMaxAmounts(params: Parameters<typeof buildV4Position>[0] & { slippageBps?: number }): {
  amount0: bigint;
  amount1: bigint;
} {
  const { slippageBps = V4_LIQUIDITY_SLIPPAGE_BPS, ...positionParams } = params;
  const position = buildV4Position(positionParams);
  const { amount0, amount1 } = position.mintAmountsWithSlippage(new Percent(slippageBps, 10_000));
  return { amount0: BigInt(amount0.toString()), amount1: BigInt(amount1.toString()) };
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
  slippageBps = V4_LIQUIDITY_SLIPPAGE_BPS,
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

type Permit2AllowanceParams = {
  token: Address;
  owner: Address;
  amount: bigint;
  chainId: number;
};

function requirePositionManager(chainId: number): Address {
  const positionManager = V4_POSITION_MANAGER_ADDRESS[chainId as keyof typeof V4_POSITION_MANAGER_ADDRESS];
  if (!positionManager) {
    throw new Error("V4 PositionManager not configured for chain");
  }
  return positionManager as Address;
}

/** Permit2 approvals granted by the app expire after 30 days. */
const PERMIT2_EXPIRATION_SECONDS = 60 * 60 * 24 * 30;

export async function hasPermit2Allowance(
  config: Config,
  { token, owner, amount, chainId }: Permit2AllowanceParams,
): Promise<boolean> {
  const positionManager = requirePositionManager(chainId);

  const allowance = await readContract(config, {
    address: PERMIT2_ADDRESS,
    abi: permit2Abi,
    functionName: "allowance",
    args: [owner, token, positionManager],
    chainId,
  });

  return allowance[0] >= amount && Number(allowance[1]) > Date.now() / 1000;
}

/** ERC-20 approval of `amount` to Permit2 (the PositionManager pulls funds through it). */
export function getApproveErc20ToPermit2Execution({
  token,
  amount,
  chainId,
}: Omit<Permit2AllowanceParams, "owner">): Execution {
  return {
    to: token,
    value: 0n,
    data: encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [PERMIT2_ADDRESS, amount] }),
    chainId,
  };
}

/** Permit2 allowance of `amount` (clamped to uint160) for the PositionManager. */
export function getApprovePermit2AllowanceExecution({
  token,
  amount,
  chainId,
}: Omit<Permit2AllowanceParams, "owner">): Execution {
  const positionManager = requirePositionManager(chainId);
  const expiration = Math.floor(Date.now() / 1000) + PERMIT2_EXPIRATION_SECONDS;

  return {
    to: PERMIT2_ADDRESS,
    value: 0n,
    data: encodeFunctionData({
      abi: permit2Abi,
      functionName: "approve",
      args: [token, positionManager, amount > MAX_UINT160 ? MAX_UINT160 : amount, expiration],
    }),
    chainId,
  };
}

export async function approvePermit2Allowance(config: Config, params: Permit2AllowanceParams): Promise<Hex> {
  return sendTransaction(config, getApprovePermit2AllowanceExecution(params));
}

export async function ensurePermit2Allowance(config: Config, params: Permit2AllowanceParams): Promise<void> {
  if (await hasPermit2Allowance(config, params)) {
    return;
  }

  const hash = await approvePermit2Allowance(config, params);
  await waitForTransactionReceipt(config, { hash });
}

export function getInitializeV4PoolExecution({
  chainId,
  poolKey,
  sqrtPriceX96,
}: {
  chainId: number;
  poolKey: OrderBookPoolKey;
  sqrtPriceX96: bigint;
}): Execution {
  const poolManager = getV4PoolManagerAddress(chainId);
  if (!poolManager) {
    throw new Error("V4 PoolManager not configured for chain");
  }

  return {
    to: poolManager,
    value: 0n,
    data: encodeFunctionData({ abi: poolManagerAbi, functionName: "initialize", args: [poolKey, sqrtPriceX96] }),
    chainId,
  };
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
  const { poolKey } = getOrderBookPoolParams(market, outcomeIndex);
  return sendTransaction(config, getInitializeV4PoolExecution({ chainId: market.chainId, poolKey, sqrtPriceX96 }));
}

type MintV4PositionParams = {
  chainId: number;
  poolKey: OrderBookPoolKey;
  sqrtPriceX96: bigint;
  tickLower: number;
  tickUpper: number;
  amount0: bigint;
  amount1: bigint;
  recipient: Address;
};

/** PositionManager `multicall([mint])` for a new position. */
export function getMintV4PositionExecution(params: MintV4PositionParams): Execution {
  const positionManager = requirePositionManager(params.chainId);
  const { calldata, value } = buildMintV4PositionCalldata(params);

  return {
    to: positionManager,
    value,
    data: encodeFunctionData({ abi: positionManagerAbi, functionName: "multicall", args: [[calldata]] }),
    chainId: params.chainId,
  };
}

export async function mintV4Position(config: Config, params: MintV4PositionParams): Promise<Hex> {
  return sendTransaction(config, getMintV4PositionExecution(params));
}

export type AddV4LiquidityApproval = {
  token: Address;
  /** Maximum the PositionManager may pull for this token (quote + slippage). */
  amount: bigint;
  /** ERC-20 allowance to Permit2 is short. */
  needsErc20Approval: boolean;
  /** Permit2 allowance for the PositionManager is short or expired. */
  needsPermit2Approval: boolean;
};

export type AddV4LiquidityStep = { execution: Execution; title: string };

/**
 * Every call needed to add liquidity, in order: missing approvals, pool initialization when the
 * pool does not exist yet, and the mint. Send them as one EIP-7702 batch or one by one.
 */
export function buildAddV4LiquiditySteps({
  approvals,
  initializePool,
  mint,
}: {
  approvals: AddV4LiquidityApproval[];
  initializePool: boolean;
  mint: MintV4PositionParams;
}): AddV4LiquidityStep[] {
  const steps: AddV4LiquidityStep[] = [];
  const { chainId } = mint;

  for (const { token, amount, needsErc20Approval, needsPermit2Approval } of approvals) {
    if (amount === 0n) continue;
    if (needsErc20Approval) {
      steps.push({
        execution: getApproveErc20ToPermit2Execution({ token, amount, chainId }),
        title: "Approving token for Permit2...",
      });
    }
    if (needsPermit2Approval) {
      steps.push({
        execution: getApprovePermit2AllowanceExecution({ token, amount, chainId }),
        title: "Approving Permit2...",
      });
    }
  }

  if (initializePool) {
    steps.push({
      execution: getInitializeV4PoolExecution({ chainId, poolKey: mint.poolKey, sqrtPriceX96: mint.sqrtPriceX96 }),
      title: "Initializing pool...",
    });
  }

  steps.push({ execution: getMintV4PositionExecution(mint), title: "Adding liquidity..." });
  return steps;
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

/** A price typed without a decimal point, like "80", means 0.80. */
export function toDecimalPrice(value: string): string | undefined {
  if (value && !value.includes(".") && !value.includes(",") && Number(value) >= 1) {
    return `0.${value}`;
  }
  return undefined;
}

/**
 * Rewrite a typed outcome price as the price of its nearest usable tick, so what the user sees is
 * what the pool will use. Values outside (0, 1) are left alone for the field's own validation.
 */
export function snapToNearestTickPrice(value: string, outcomeIsToken0: boolean, tickSpacing = 60): string {
  if (!value) {
    return value;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed <= 0 || parsed >= 1) {
    return value;
  }

  const { tick } = getNearestLimitOrderPrice(parsed, outcomeIsToken0, tickSpacing);
  const [price0, price1] = tickToPrice(tick, 18, true);
  const price = outcomeIsToken0 ? price0 : price1;

  return Number(price).toFixed(8);
}

/**
 * The slot0 a pool would have right after `initialize` at `startingPrice`: the price is snapped to a
 * usable tick, so `getTickAtSqrtRatio(sqrtPriceX96)` is exactly `tick`.
 */
export function getStartingPoolState(
  startingPrice: number,
  outcomeIsToken0: boolean,
  tickSpacing = 60,
): { tick: number; sqrtPriceX96: bigint } {
  const tick = probabilityToTick(startingPrice, outcomeIsToken0, tickSpacing);
  return { tick, sqrtPriceX96: getSqrtRatioAtTick(tick) };
}

export function getOutcomePriceAtTick(tick: number, outcomeIsToken0: boolean): number {
  const [price0, price1] = tickToPrice(tick, 18, true);
  return Number(outcomeIsToken0 ? price0 : price1);
}

export function getValidLimitOrderBoundaryTick(
  swapType: "buy" | "sell",
  outcomeIsToken0: boolean,
  currentTick: number,
  tickSpacing = 60,
): number {
  const zeroForOne = resolveLimitOrderZeroForOne(swapType, outcomeIsToken0);

  if (zeroForOne) {
    // Need tickLower > currentTick — first usable tick strictly above current.
    const ceiled = Math.ceil(currentTick / tickSpacing) * tickSpacing;
    return ceiled === currentTick ? currentTick + tickSpacing : ceiled;
  }

  // Need tickLower + tickSpacing <= currentTick — last usable tick at or below that max.
  return Math.floor((currentTick - tickSpacing) / tickSpacing) * tickSpacing;
}

export function getValidLimitOrderBoundaryPrice(
  swapType: "buy" | "sell",
  outcomeIsToken0: boolean,
  currentTick: number,
  tickSpacing = 60,
): { tick: number; price: number } {
  const tick = getValidLimitOrderBoundaryTick(swapType, outcomeIsToken0, currentTick, tickSpacing);
  return { tick, price: getOutcomePriceAtTick(tick, outcomeIsToken0) };
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
  boundaryPrice: number,
  marketPrice?: number,
): string {
  const boundary = boundaryPrice.toFixed(3);
  const { direction } = getLimitOrderPriceRule(swapType, outcomeIsToken0);
  const marketSuffix = marketPrice !== undefined ? ` (market ${marketPrice.toFixed(3)})` : "";

  if (direction === "at_or_below") {
    return `For a ${swapType} order, set a limit price at or below ${boundary}${marketSuffix}.`;
  }

  return `For a ${swapType} order, set a limit price at or above ${boundary}${marketSuffix}.`;
}

export function formatLimitOrderPriceHint(
  swapType: "buy" | "sell",
  outcomeIsToken0: boolean,
  boundaryPrice: number,
): string {
  const price = boundaryPrice.toFixed(3);
  const { direction, side } = getLimitOrderPriceRule(swapType, outcomeIsToken0);
  const action = side === "buy" ? "Buy" : "Sell";

  if (direction === "at_or_below") {
    return `${action} when the price drops — set a limit at or below ${price}.`;
  }

  return `${action} when the price rises — set a limit at or above ${price}.`;
}

export function resolveLimitOrderZeroForOne(swapType: "buy" | "sell", outcomeIsToken0: boolean): boolean {
  return swapType === "buy" ? !outcomeIsToken0 : outcomeIsToken0;
}

/**
 * The hook only accepts out-of-range orders: a zeroForOne order must sit strictly above the current
 * tick and the other direction must end at or below it.
 */
export function isLimitOrderTickPlacementValid(
  zeroForOne: boolean,
  tickLower: number,
  currentTick: number,
  tickSpacing: number,
): boolean {
  return zeroForOne ? tickLower > currentTick : tickLower + tickSpacing <= currentTick;
}

function validateLimitOrderTickPlacement(
  zeroForOne: boolean,
  tickLower: number,
  currentTick: number,
  tickSpacing: number,
  swapType: "buy" | "sell",
  outcomeIsToken0: boolean,
): void {
  if (isLimitOrderTickPlacementValid(zeroForOne, tickLower, currentTick, tickSpacing)) {
    return;
  }

  const marketPrice = getOutcomePriceAtTick(currentTick, outcomeIsToken0);
  const { price: boundaryPrice } = getValidLimitOrderBoundaryPrice(swapType, outcomeIsToken0, currentTick, tickSpacing);
  throw new Error(formatLimitOrderPriceError(swapType, outcomeIsToken0, boundaryPrice, marketPrice));
}

/**
 * Validation for the starting price of a pool created together with its first order: the same
 * placement rule as above, but blamed on the starting price rather than the limit price.
 */
export function formatStartingPriceError(
  swapType: "buy" | "sell",
  outcomeIsToken0: boolean,
  startingTick: number,
  limitTick: number,
  tickSpacing = 60,
): string | undefined {
  const zeroForOne = resolveLimitOrderZeroForOne(swapType, outcomeIsToken0);
  if (isLimitOrderTickPlacementValid(zeroForOne, limitTick, startingTick, tickSpacing)) {
    return undefined;
  }
  return swapType === "buy"
    ? "Starting price must be above your buy price."
    : "Starting price must be below your sell price.";
}

const Q192 = 1n << 192n;

/**
 * Exact amount of the other token that `amountIn` converts to at the price encoded by `tick`
 * (no fee, no slippage). Works on raw units, so it holds for any token decimals.
 */
export function getAmountOutAtTick(amountIn: bigint, tick: number, zeroForOne: boolean): bigint {
  if (amountIn <= 0n) {
    return 0n;
  }
  const sqrtPriceX96 = getSqrtRatioAtTick(tick);
  const priceX192 = sqrtPriceX96 * sqrtPriceX96;
  return zeroForOne ? (amountIn * priceX192) / Q192 : (amountIn * Q192) / priceX192;
}

/**
 * Exact amount of the input token needed to receive `amountOut` at the price encoded by `tick`
 * (rounded up). Inverse of `getAmountOutAtTick`.
 */
export function getAmountInAtTick(amountOut: bigint, tick: number, zeroForOne: boolean): bigint {
  if (amountOut <= 0n) {
    return 0n;
  }
  const sqrtPriceX96 = getSqrtRatioAtTick(tick);
  const priceX192 = sqrtPriceX96 * sqrtPriceX96;
  const [numerator, denominator] = zeroForOne ? [amountOut * Q192, priceX192] : [amountOut * priceX192, Q192];
  return (numerator + denominator - 1n) / denominator;
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
}: {
  chainId: number;
  poolKey: OrderBookPoolKey;
  outcomeIsToken0: boolean;
  swapType: "buy" | "sell";
  limitPrice: number;
  payAmount: bigint;
  currentTick: number;
  sqrtPriceX96: bigint;
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
  const minReceiveAmount = getAmountOutAtTick(actualPayAmount, tick, zeroForOne);

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

  const [filled, currency0, currency1, , , liquidityTotal] = await readLimitOrderHookOrderInfos(config, {
    args: [orderId],
    chainId,
  });

  if (!filled || liquidityTotal === 0n) {
    return null;
  }

  const userLiquidity = await readLimitOrderHookGetOrderLiquidity(config, {
    args: [orderId, owner],
    chainId,
  });

  if (userLiquidity === 0n) {
    return null;
  }

  const { result } = await simulateLimitOrderHookWithdraw(config, {
    args: [orderId, owner],
    account: owner,
    chainId,
  });

  return {
    amount0: result[0],
    amount1: result[1],
    currency0,
    currency1,
  };
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
    chainId,
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

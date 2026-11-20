import { limitOrderHookAbi, limitOrderHookAddress } from "@seer-pm/contracts-ts/order-book";
import type { Execution } from "@seer-pm/sdk";
import type { Address } from "viem";
import { encodeFunctionData, erc20Abi } from "viem";
import { getInitializeV4PoolExecution } from "./order-book";
import { type OrderBookPoolKey, chainSupportsOrderBook } from "./order-book-config";

function requireHookAddress(chainId: number): Address {
  if (!chainSupportsOrderBook(chainId)) {
    throw new Error("Limit orders are not supported on this chain");
  }
  const hookAddress = limitOrderHookAddress[chainId as keyof typeof limitOrderHookAddress] as Address | undefined;
  if (!hookAddress) {
    throw new Error("LimitOrderHook not configured for chain");
  }
  return hookAddress;
}

function poolKeyTuple(poolKey: OrderBookPoolKey) {
  return {
    currency0: poolKey.currency0,
    currency1: poolKey.currency1,
    fee: poolKey.fee,
    tickSpacing: poolKey.tickSpacing,
    hooks: poolKey.hooks,
  } as const;
}

export function getApproveLimitOrderExecution({
  token,
  amount,
  chainId,
}: {
  token: Address;
  amount: bigint;
  chainId: number;
}): Execution {
  const hookAddress = requireHookAddress(chainId);
  return {
    to: token,
    value: 0n,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [hookAddress, amount],
    }),
    chainId,
  };
}

export function getPlaceLimitOrderExecution({
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
}): Execution {
  const hookAddress = requireHookAddress(chainId);
  return {
    to: hookAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: limitOrderHookAbi,
      functionName: "placeOrder",
      args: [poolKeyTuple(poolKey), tick, zeroForOne, liquidity],
    }),
    chainId,
  };
}

export type PlaceLimitOrderStep = { execution: Execution; title: string };

/**
 * Every call needed to place a limit order, in order: pool initialization when the pool does not
 * exist yet, the ERC20 approval to the hook when the caller wants it batched, and placeOrder.
 * Send them as one EIP-7702 batch or one by one.
 */
export function buildPlaceLimitOrderSteps({
  initialize,
  approve,
  place,
}: {
  initialize?: { chainId: number; poolKey: OrderBookPoolKey; sqrtPriceX96: bigint };
  approve?: { token: Address; amount: bigint; chainId: number };
  place: { chainId: number; poolKey: OrderBookPoolKey; tick: number; zeroForOne: boolean; liquidity: bigint };
}): PlaceLimitOrderStep[] {
  const steps: PlaceLimitOrderStep[] = [];

  if (initialize) {
    steps.push({ execution: getInitializeV4PoolExecution(initialize), title: "Initializing pool..." });
  }

  if (approve) {
    steps.push({ execution: getApproveLimitOrderExecution(approve), title: "Approving..." });
  }

  steps.push({ execution: getPlaceLimitOrderExecution(place), title: "Placing limit order..." });
  return steps;
}

export type CancelLimitOrderParams = {
  chainId: number;
  poolKey: OrderBookPoolKey;
  tickLower: number;
  zeroForOne: boolean;
  owner: Address;
};

export function getCancelLimitOrderExecution({
  chainId,
  poolKey,
  tickLower,
  zeroForOne,
  owner,
}: CancelLimitOrderParams): Execution {
  const hookAddress = requireHookAddress(chainId);
  return {
    to: hookAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: limitOrderHookAbi,
      functionName: "cancelOrder",
      args: [poolKeyTuple(poolKey), tickLower, zeroForOne, owner],
    }),
    chainId,
  };
}

export function buildCancelLimitOrderCalls(orders: CancelLimitOrderParams[]): Execution[] {
  return orders.map(getCancelLimitOrderExecution);
}

export type WithdrawLimitOrderParams = {
  chainId: number;
  orderId: bigint;
  owner: Address;
};

export function getWithdrawLimitOrderExecution({ chainId, orderId, owner }: WithdrawLimitOrderParams): Execution {
  const hookAddress = requireHookAddress(chainId);
  return {
    to: hookAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: limitOrderHookAbi,
      functionName: "withdraw",
      args: [orderId, owner],
    }),
    chainId,
  };
}

export function buildWithdrawLimitOrderCalls(orders: WithdrawLimitOrderParams[]): Execution[] {
  return orders.map(getWithdrawLimitOrderExecution);
}

import type { Config } from "@wagmi/core";
import { readContract } from "@wagmi/core";
import type { Address, Hex } from "viem";
import { encodeAbiParameters, keccak256, parseAbi } from "viem";
import { base } from "viem/chains";
import {
  limitOrderHookAddress,
  readSeerUniV4PoolInitializerIsPoolInitialized,
  seerUniV4PoolInitializerAddress,
} from "../generated/contracts/order-book";
import { getLiquidityPair } from "./market-pools";
import type { Market } from "./market-types";

export const V4_POOL_FEE = 3000;
export const V4_TICK_SPACING = 60;

/** Uniswap V3 fee tier → tick spacing (no @uniswap/v3-sdk import; safe for SSR). */
const FEE_TIER_TICK_SPACING: Record<number, number> = {
  100: 1,
  500: 10,
  3000: 60,
  10000: 200,
};

export function tickSpacingForFeeTier(feeTier: number): number {
  return FEE_TIER_TICK_SPACING[feeTier] ?? V4_TICK_SPACING;
}

export const V4_POSITION_MANAGER_ADDRESS = {
  [base.id]: "0x7c5f5a4bbd8fd63184577525326123b519429bdc",
} as const;

export const V4_STATE_VIEW_ADDRESS = {
  [base.id]: "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71",
} as const;

export const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as Address;

export const stateViewAbi = parseAbi([
  "function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)",
  "function getLiquidity(bytes32 poolId) view returns (uint128 liquidity)",
]);

export const permit2Abi = parseAbi([
  "function approve(address token, address spender, uint160 amount, uint48 expiration) external",
  "function allowance(address owner, address token, address spender) view returns (uint160 amount, uint48 expiration, uint48 nonce)",
]);

export const positionManagerAbi = parseAbi(["function multicall(bytes[] data) payable returns (bytes[])"]);

export type OrderBookPoolKey = {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
};

export type OrderBookPoolParams = {
  poolKey: OrderBookPoolKey;
  token0: Address;
  token1: Address;
  outcomeToken: Address;
  outcomeIsToken0: boolean;
  outcomeIndex: number;
};

export function chainSupportsOrderBook(chainId: number): boolean {
  return chainId === base.id;
}

export function marketSupportsOrderBook(market: Market): boolean {
  return market.chainId === base.id && market.type === "Generic";
}

export function getV4HooksAddress(chainId: number): Address | undefined {
  return limitOrderHookAddress[chainId as keyof typeof limitOrderHookAddress] as Address | undefined;
}

export function buildOrderBookPoolKey(token0: Address, token1: Address, chainId: number): OrderBookPoolKey | null {
  const hooks = getV4HooksAddress(chainId);
  if (!hooks) {
    return null;
  }

  const sorted =
    token0.toLowerCase() < token1.toLowerCase()
      ? { currency0: token0.toLowerCase() as Address, currency1: token1.toLowerCase() as Address }
      : { currency0: token1.toLowerCase() as Address, currency1: token0.toLowerCase() as Address };

  return {
    ...sorted,
    fee: V4_POOL_FEE,
    tickSpacing: V4_TICK_SPACING,
    hooks,
  };
}

export function getOrderBookPoolParams(market: Market, outcomeIndex: number): OrderBookPoolParams {
  const { token0, token1 } = getLiquidityPair(market, outcomeIndex);
  const outcomeToken = market.wrappedTokens[outcomeIndex].toLowerCase() as Address;
  const hooks = limitOrderHookAddress[base.id as keyof typeof limitOrderHookAddress] as Address;

  return {
    poolKey: {
      currency0: token0,
      currency1: token1,
      fee: V4_POOL_FEE,
      tickSpacing: V4_TICK_SPACING,
      hooks,
    },
    token0,
    token1,
    outcomeToken,
    outcomeIsToken0: outcomeToken === token0,
    outcomeIndex,
  };
}

export function clampProbability(probability: number): number {
  return Math.min(0.99, Math.max(0.01, probability));
}

export function getV4PoolId(poolKey: OrderBookPoolKey): Hex {
  const [currency0, currency1] =
    poolKey.currency0.toLowerCase() < poolKey.currency1.toLowerCase()
      ? [poolKey.currency0, poolKey.currency1]
      : [poolKey.currency1, poolKey.currency0];

  return keccak256(
    encodeAbiParameters(
      [{ type: "address" }, { type: "address" }, { type: "uint24" }, { type: "int24" }, { type: "address" }],
      [currency0, currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks],
    ),
  );
}

export async function isOrderBookPoolInitialized(
  config: Config,
  market: Market,
  outcomeIndex: number,
): Promise<boolean> {
  if (!chainSupportsOrderBook(market.chainId)) {
    return false;
  }

  const { poolKey, token0, token1 } = getOrderBookPoolParams(market, outcomeIndex);

  return readSeerUniV4PoolInitializerIsPoolInitialized(config, {
    args: [token0, token1, poolKey.hooks, poolKey.fee, poolKey.tickSpacing],
    chainId: base.id,
  });
}

export async function readV4PoolState(
  config: Config,
  chainId: number,
  poolKey: OrderBookPoolKey,
): Promise<{ sqrtPriceX96: bigint; tick: number; liquidity: bigint; poolId: Hex } | null> {
  if (!chainSupportsOrderBook(chainId)) {
    return null;
  }

  const initialized = await readSeerUniV4PoolInitializerIsPoolInitialized(config, {
    args: [poolKey.currency0, poolKey.currency1, poolKey.hooks, poolKey.fee, poolKey.tickSpacing],
    chainId: base.id,
  });

  if (!initialized) {
    return null;
  }

  const poolId = getV4PoolId(poolKey);
  const stateViewAddress = V4_STATE_VIEW_ADDRESS[chainId as keyof typeof V4_STATE_VIEW_ADDRESS];
  if (!stateViewAddress) {
    return null;
  }

  const [slot0, liquidity] = await Promise.all([
    readContract(config, {
      address: stateViewAddress,
      abi: stateViewAbi,
      functionName: "getSlot0",
      args: [poolId],
      chainId: base.id,
    }),
    readContract(config, {
      address: stateViewAddress,
      abi: stateViewAbi,
      functionName: "getLiquidity",
      args: [poolId],
      chainId: base.id,
    }),
  ]);

  return {
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
    liquidity,
    poolId,
  };
}

export function getV4PoolInitializerAddress(chainId: number): Address | undefined {
  return seerUniV4PoolInitializerAddress[chainId as keyof typeof seerUniV4PoolInitializerAddress] as
    | Address
    | undefined;
}

export function getV4PositionManagerAddress(chainId: number): Address | undefined {
  return V4_POSITION_MANAGER_ADDRESS[chainId as keyof typeof V4_POSITION_MANAGER_ADDRESS] as Address | undefined;
}

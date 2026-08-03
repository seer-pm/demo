import { limitOrderHookAddress } from "@seer-pm/contracts-ts/order-book";
import type { Market } from "@seer-pm/sdk";
import { getLiquidityPair } from "@seer-pm/sdk";
import type { Config } from "@wagmi/core";
import { readContract } from "@wagmi/core";
import type { Address, Hex } from "viem";
import { encodeAbiParameters, keccak256, parseAbi } from "viem";
import { base, mainnet, optimism } from "viem/chains";

export const V4_POOL_FEE = 3000;
export const V4_TICK_SPACING = 60;

export const V4_POOL_MANAGER_ADDRESS = {
  [mainnet.id]: "0x000000000004444c5dc75cB358380D2e3dE08A90",
  [optimism.id]: "0x9a13f98cb987694c9f086b1f5eb990eea8264ec3",
  [base.id]: "0x498581ff718922c3f8e6a244956af099b2652b2b",
} as const;

export const V4_POSITION_MANAGER_ADDRESS = {
  [mainnet.id]: "0xbd216513d74c8cf14cf4747e6aaa6420ff64ee9e",
  [optimism.id]: "0x3c3ea4b57a46241e54610e5f022e5c45859a1017",
  [base.id]: "0x7c5f5a4bbd8fd63184577525326123b519429bdc",
} as const;

export const V4_STATE_VIEW_ADDRESS = {
  [mainnet.id]: "0x7ffe42c4a5deea5b0fec41c94c136cf115597227",
  [optimism.id]: "0xc18a3169788f4f75a170290584eca6395c75ecdb",
  [base.id]: "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71",
} as const;

export const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as Address;

export const stateViewAbi = parseAbi([
  "function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)",
  "function getLiquidity(bytes32 poolId) view returns (uint128 liquidity)",
]);

export const poolManagerAbi = parseAbi([
  "function initialize((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint160 sqrtPriceX96) returns (int24 tick)",
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

export type OrderBookChainId = typeof mainnet.id | typeof optimism.id | typeof base.id;

export function chainSupportsOrderBook(chainId: number): chainId is OrderBookChainId {
  return chainId === mainnet.id || chainId === optimism.id || chainId === base.id;
}

export function marketSupportsOrderBook(market: Market): boolean {
  return chainSupportsOrderBook(market.chainId) && market.type === "Generic";
}

export type LensV4HookParams = {
  hookPoolFee: number;
  hookTickSpacing: number;
  hookAddress: Address;
};

/** Lens.quote hooked-pool candidate for markets that use LimitOrderHook V4 pools. */
export function getLensV4HookParams(market: Market): LensV4HookParams | undefined {
  if (!marketSupportsOrderBook(market)) {
    return undefined;
  }
  const hookAddress = getV4HooksAddress(market.chainId);
  if (!hookAddress) {
    return undefined;
  }
  return {
    hookPoolFee: V4_POOL_FEE,
    hookTickSpacing: V4_TICK_SPACING,
    hookAddress,
  };
}

export function getV4HooksAddress(chainId: number): Address | undefined {
  return limitOrderHookAddress[chainId as keyof typeof limitOrderHookAddress] as Address | undefined;
}

export function getV4PoolManagerAddress(chainId: number): Address | undefined {
  return V4_POOL_MANAGER_ADDRESS[chainId as keyof typeof V4_POOL_MANAGER_ADDRESS] as Address | undefined;
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
  const hooks = getV4HooksAddress(market.chainId);
  if (!hooks) {
    throw new Error("LimitOrderHook not configured for chain");
  }

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

  const { poolKey } = getOrderBookPoolParams(market, outcomeIndex);
  const state = await readV4PoolState(config, market.chainId, poolKey);
  return state !== null;
}

export async function readV4PoolState(
  config: Config,
  chainId: number,
  poolKey: OrderBookPoolKey,
): Promise<{ sqrtPriceX96: bigint; tick: number; liquidity: bigint; poolId: Hex } | null> {
  if (!chainSupportsOrderBook(chainId)) {
    return null;
  }

  const poolId = getV4PoolId(poolKey);
  const stateViewAddress = V4_STATE_VIEW_ADDRESS[chainId as keyof typeof V4_STATE_VIEW_ADDRESS];
  if (!stateViewAddress) {
    return null;
  }

  try {
    const [slot0, liquidity] = await Promise.all([
      readContract(config, {
        address: stateViewAddress,
        abi: stateViewAbi,
        functionName: "getSlot0",
        args: [poolId],
        chainId,
      }),
      readContract(config, {
        address: stateViewAddress,
        abi: stateViewAbi,
        functionName: "getLiquidity",
        args: [poolId],
        chainId,
      }),
    ]);

    if (slot0[0] === 0n) {
      return null;
    }

    return {
      sqrtPriceX96: slot0[0],
      tick: slot0[1],
      liquidity,
      poolId,
    };
  } catch {
    return null;
  }
}

export function getV4PositionManagerAddress(chainId: number): Address | undefined {
  return V4_POSITION_MANAGER_ADDRESS[chainId as keyof typeof V4_POSITION_MANAGER_ADDRESS] as Address | undefined;
}

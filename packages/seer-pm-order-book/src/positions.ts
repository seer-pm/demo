import type { Execution } from "@seer-pm/sdk";
import { uniswapV4GraphQLClient } from "@seer-pm/sdk";
import { getSdk as getUniswapV4Sdk } from "@seer-pm/sdk/subgraph/uniswap-v4";
import { Percent } from "@uniswap/sdk-core";
import { Position, V4PositionManager } from "@uniswap/v4-sdk";
import type { Config } from "@wagmi/core";
import { readContracts } from "@wagmi/core";
import type { Address, Hex } from "viem";
import { V4_LIQUIDITY_SLIPPAGE_BPS, createV4PoolInstance } from "./order-book";
import {
  type OrderBookPoolKey,
  chainSupportsOrderBook,
  getV4HooksAddress,
  getV4PoolId,
  getV4PositionManagerAddress,
  positionManagerAbi,
} from "./order-book-config";

/** A PositionManager NFT position in one of the order-book (V4) pools. */
export type V4Position = {
  tokenId: bigint;
  owner: Address;
  poolId: Hex;
  poolKey: OrderBookPoolKey;
  tickLower: number;
  tickUpper: number;
  /** Current liquidity, read on-chain from the PositionManager. */
  liquidity: bigint;
};

type SubgraphPosition = {
  tokenId: string;
  owner: string;
  tickLower: string;
  tickUpper: string;
  liquidity: string;
  pool: {
    id: string;
    feeTier: string;
    tickSpacing: string;
    hooks: string;
    token0: { id: string };
    token1: { id: string };
  };
};

/** Pool key of a subgraph pool, in the canonical (lowercased, sorted) form the order-book uses. */
export function poolKeyFromSubgraphPool(pool: SubgraphPosition["pool"]): OrderBookPoolKey {
  const token0 = pool.token0.id.toLowerCase() as Address;
  const token1 = pool.token1.id.toLowerCase() as Address;
  const [currency0, currency1] = token0 < token1 ? [token0, token1] : [token1, token0];
  return {
    currency0,
    currency1,
    fee: Number(pool.feeTier),
    tickSpacing: Number(pool.tickSpacing),
    hooks: pool.hooks.toLowerCase() as Address,
  };
}

function toV4Position(position: SubgraphPosition, poolKey: OrderBookPoolKey): V4Position {
  return {
    tokenId: BigInt(position.tokenId),
    owner: position.owner.toLowerCase() as Address,
    poolId: position.pool.id.toLowerCase() as Hex,
    poolKey,
    tickLower: Number(position.tickLower),
    tickUpper: Number(position.tickUpper),
    liquidity: BigInt(position.liquidity),
  };
}

/**
 * Re-reads each candidate's liquidity from the PositionManager so a position that was just
 * modified or burned is never shown stale, and drops the ones that are now empty.
 */
async function refreshLiquidityOnChain(
  config: Config,
  chainId: number,
  positionManager: Address,
  candidates: V4Position[],
): Promise<V4Position[]> {
  if (candidates.length === 0) {
    return [];
  }

  const liquidities = await readContracts(config, {
    allowFailure: false,
    contracts: candidates.map((position) => ({
      address: positionManager,
      abi: positionManagerAbi,
      functionName: "getPositionLiquidity" as const,
      args: [position.tokenId] as const,
      chainId,
    })),
  });

  return candidates
    .map((position, i) => ({ ...position, liquidity: liquidities[i] }))
    .filter((position) => position.liquidity > 0n);
}

/**
 * Lists the caller's V4 positions for the given pool keys.
 * Discovery comes from the Seer V4 subgraph (Goldsky); liquidity is then refreshed on-chain so
 * a position that was just modified or burned is never shown stale. Positions with zero
 * liquidity are dropped.
 */
export async function fetchUserV4Positions(
  config: Config,
  { chainId, owner, poolKeys }: { chainId: number; owner: Address; poolKeys: OrderBookPoolKey[] },
): Promise<V4Position[]> {
  if (!chainSupportsOrderBook(chainId) || poolKeys.length === 0) {
    return [];
  }

  const client = uniswapV4GraphQLClient(chainId);
  const positionManager = getV4PositionManagerAddress(chainId);
  if (!client || !positionManager) {
    return [];
  }

  const poolKeyById = new Map<string, OrderBookPoolKey>();
  for (const poolKey of poolKeys) {
    poolKeyById.set(getV4PoolId(poolKey).toLowerCase(), poolKey);
  }

  const { positions } = await getUniswapV4Sdk(client).GetV4Positions({
    owner: owner.toLowerCase(),
    pools: Array.from(poolKeyById.keys()),
  });

  const candidates = positions
    .map((position) => {
      const poolKey = poolKeyById.get(position.pool.id.toLowerCase());
      return poolKey ? toV4Position(position, poolKey) : null;
    })
    .filter((p): p is V4Position => p !== null);

  return refreshLiquidityOnChain(config, chainId, positionManager, candidates);
}

/**
 * Lists every V4 position the owner holds in an order-book pool (any market) on the chain.
 * Same discovery + on-chain refresh as `fetchUserV4Positions`; pools that are not managed by
 * the LimitOrderHook are ignored.
 */
export async function fetchUserV4PositionsByOwner(
  config: Config,
  { chainId, owner }: { chainId: number; owner: Address },
): Promise<V4Position[]> {
  if (!chainSupportsOrderBook(chainId)) {
    return [];
  }

  const client = uniswapV4GraphQLClient(chainId);
  const positionManager = getV4PositionManagerAddress(chainId);
  const hooks = getV4HooksAddress(chainId)?.toLowerCase();
  if (!client || !positionManager || !hooks) {
    return [];
  }

  const { positions } = await getUniswapV4Sdk(client).GetV4PositionsByOwner({ owner: owner.toLowerCase() });

  const candidates = positions
    .filter((position) => position.pool.hooks.toLowerCase() === hooks)
    .map((position) => toV4Position(position, poolKeyFromSubgraphPool(position.pool)));

  return refreshLiquidityOnChain(config, chainId, positionManager, candidates);
}

function toSdkPosition(position: V4Position, sqrtPriceX96: bigint, chainId: number, tick?: number): Position {
  const pool = createV4PoolInstance(chainId, position.poolKey, sqrtPriceX96, 0n, tick);
  return new Position({
    pool,
    tickLower: position.tickLower,
    tickUpper: position.tickUpper,
    liquidity: position.liquidity.toString(),
  });
}

/** Token amounts currently backing the position at the given pool price. */
export function computeV4PositionAmounts(
  position: V4Position,
  { chainId, sqrtPriceX96, tick }: { chainId: number; sqrtPriceX96: bigint; tick?: number },
): { amount0: bigint; amount1: bigint } {
  const sdkPosition = toSdkPosition(position, sqrtPriceX96, chainId, tick);
  return {
    amount0: BigInt(sdkPosition.amount0.quotient.toString()),
    amount1: BigInt(sdkPosition.amount1.quotient.toString()),
  };
}

function defaultDeadline(): string {
  return String(Math.floor(Date.now() / 1000) + 1200);
}

function positionManagerExecution(chainId: number, calldata: string, value: string): Execution {
  const positionManager = getV4PositionManagerAddress(chainId);
  if (!positionManager) {
    throw new Error("V4 PositionManager not configured for chain");
  }
  return { to: positionManager, data: calldata as Hex, value: BigInt(value), chainId };
}

/**
 * Removes `percentageBps / 10_000` of the position's liquidity (fees included) and burns the
 * NFT when removing everything. The PositionManager pays the tokens to the transaction sender,
 * so this must be sent by the NFT owner.
 */
export function buildRemoveV4PositionExecution({
  chainId,
  position,
  sqrtPriceX96,
  tick,
  percentageBps,
  slippageBps = V4_LIQUIDITY_SLIPPAGE_BPS,
}: {
  chainId: number;
  position: V4Position;
  sqrtPriceX96: bigint;
  tick?: number;
  percentageBps: number;
  slippageBps?: number;
}): Execution {
  if (percentageBps <= 0 || percentageBps > 10_000) {
    throw new Error("percentageBps must be in (0, 10000]");
  }
  const sdkPosition = toSdkPosition(position, sqrtPriceX96, chainId, tick);
  const { calldata, value } = V4PositionManager.removeCallParameters(sdkPosition, {
    tokenId: position.tokenId.toString(),
    liquidityPercentage: new Percent(percentageBps, 10_000),
    burnToken: percentageBps === 10_000,
    slippageTolerance: new Percent(slippageBps, 10_000),
    deadline: defaultDeadline(),
    hookData: "0x",
  });
  return positionManagerExecution(chainId, calldata, value);
}

/** Collects accrued fees without changing the position's liquidity. */
export function buildCollectV4FeesExecution({
  chainId,
  position,
  sqrtPriceX96,
  tick,
  recipient,
  slippageBps = V4_LIQUIDITY_SLIPPAGE_BPS,
}: {
  chainId: number;
  position: V4Position;
  sqrtPriceX96: bigint;
  tick?: number;
  recipient: Address;
  slippageBps?: number;
}): Execution {
  const sdkPosition = toSdkPosition(position, sqrtPriceX96, chainId, tick);
  const { calldata, value } = V4PositionManager.collectCallParameters(sdkPosition, {
    tokenId: position.tokenId.toString(),
    recipient,
    slippageTolerance: new Percent(slippageBps, 10_000),
    deadline: defaultDeadline(),
    hookData: "0x",
  });
  return positionManagerExecution(chainId, calldata, value);
}

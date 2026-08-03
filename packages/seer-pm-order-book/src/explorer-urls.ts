import type { Market } from "@seer-pm/sdk";
import { getLiquidityPair, getPoolExplorerUrl } from "@seer-pm/sdk";
import type { Address } from "viem";
import { base, gnosis, mainnet, optimism } from "viem/chains";
import {
  V4_POOL_FEE,
  getOrderBookPoolParams,
  getV4HooksAddress,
  getV4PoolId,
  marketSupportsOrderBook,
} from "./order-book-config";

function getUniswapChainSlug(chainId: number): string | undefined {
  switch (chainId) {
    case mainnet.id:
      return "ethereum";
    case optimism.id:
      return "optimism";
    case base.id:
      return "base";
    default:
      return undefined;
  }
}

function getV4PoolExplorerUrl(chainId: number, poolId: string): string {
  const chainName = getUniswapChainSlug(chainId);
  if (!chainName) {
    return "#";
  }
  return `https://app.uniswap.org/explore/pools/${chainName}/${poolId}`;
}

/** Liquidity UI base URLs per chain (add liquidity / create pool). */
function getLiquidityUrlUniswapV3(chainId: number, token0: string, token1: string): string {
  const chainName = getUniswapChainSlug(chainId) ?? "base";
  return `https://app.uniswap.org/positions/create/v3?step=0&currencyA=${token0}&currencyB=${token1}&chain=${chainName}&hook=undefined&priceRangeState={%22priceInverted%22:false,%22fullRange%22:true,%22minPrice%22:%22%22,%22maxPrice%22:%22%22,%22initialPrice%22:%22%22}&depositState={%22exactField%22:%22TOKEN0%22,%22exactAmounts%22:{}}&fee={%22feeAmount%22:100,%22tickSpacing%22:1,%22isDynamic%22:false}`;
}

function getLiquidityUrlUniswapV4(chainId: number, token0: string, token1: string, hook: Address): string {
  const chainName = getUniswapChainSlug(chainId);
  if (!chainName) {
    return "#";
  }
  const params = new URLSearchParams({
    currencyA: token0,
    currencyB: token1,
    chain: chainName,
    feeTier: String(V4_POOL_FEE),
    hook,
  });
  return `https://app.uniswap.org/positions/create/v4?${params.toString()}`;
}

export type GetLiquidityUrlOptions = {
  isPoolInitialized?: boolean;
  /** When set, forces the URL for that DEX (e.g. UniV3 pool on an order-book market). */
  dex?: string;
  /** Existing pool id (address or V4 id); used with `isPoolInitialized` for non-V4 DEXes. */
  poolId?: string;
};

/**
 * URL to add liquidity for an outcome (outcome token + collateral pair).
 * Order-book markets link to Uniswap V4 with the LimitOrderHook pre-filled,
 * or to the explore pool page when the pool already exists.
 * Pass `dex` to target a specific pool type (e.g. UniV3 on Base).
 */
export function getLiquidityUrl(market: Market, outcomeIndex: number, options?: GetLiquidityUrlOptions): string {
  const { token0, token1 } = getLiquidityPair(market, outcomeIndex);

  const useOrderBookV4 = options?.dex == null ? marketSupportsOrderBook(market) : options.dex === "UniV4";

  if (useOrderBookV4) {
    if (options?.isPoolInitialized) {
      const { poolKey } = getOrderBookPoolParams(market, outcomeIndex);
      return getV4PoolExplorerUrl(market.chainId, getV4PoolId(poolKey));
    }

    const hook = getV4HooksAddress(market.chainId);
    if (!hook) {
      return "#";
    }
    return getLiquidityUrlUniswapV4(market.chainId, token0, token1, hook);
  }

  if (options?.isPoolInitialized && options.poolId) {
    return getPoolExplorerUrl(market.chainId, options.poolId);
  }

  switch (market.chainId) {
    case gnosis.id:
      return `https://v3.swapr.eth.limo/#/add/${token0}/${token1}/enter-amounts`;
    case mainnet.id:
      return `https://bunni.pro/add/ethereum?tokenA=${token0}&tokenB=${token1}&fee=3000`;
    case optimism.id:
    case base.id:
      return getLiquidityUrlUniswapV3(market.chainId, token0, token1);
    default:
      return "#";
  }
}

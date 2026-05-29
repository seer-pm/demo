import type { Address } from "viem";
import { base, gnosis, mainnet, optimism } from "viem/chains";
import { getLiquidityPair } from "./market-pools";
import type { Market } from "./market-types";
import { V4_POOL_FEE, getV4HooksAddress, marketSupportsOrderBook } from "./order-book-config";

/** Block explorer base URL per chain (e.g. https://gnosisscan.io). */
const BLOCK_EXPLORER_URLS: Partial<Record<number, string>> = {
  [gnosis.id]: "https://gnosisscan.io",
  [mainnet.id]: "https://etherscan.io",
  [optimism.id]: "https://optimistic.etherscan.io",
  [base.id]: "https://basescan.org",
};

/** Liquidity UI base URLs per chain (add liquidity / create pool). */
function getLiquidityUrlUniswapV3(chainId: number, token0: string, token1: string): string {
  const chainName = chainId === optimism.id ? "optimism" : "base";
  return `https://app.uniswap.org/positions/create/v3?step=0&currencyA=${token0}&currencyB=${token1}&chain=${chainName}&hook=undefined&priceRangeState={%22priceInverted%22:false,%22fullRange%22:true,%22minPrice%22:%22%22,%22maxPrice%22:%22%22,%22initialPrice%22:%22%22}&depositState={%22exactField%22:%22TOKEN0%22,%22exactAmounts%22:{}}&fee={%22feeAmount%22:100,%22tickSpacing%22:1,%22isDynamic%22:false}`;
}

function getLiquidityUrlUniswapV4(chainId: number, token0: string, token1: string, hook: Address): string {
  const chainName = chainId === optimism.id ? "optimism" : "base";
  const params = new URLSearchParams({
    currencyA: token0,
    currencyB: token1,
    chain: chainName,
    feeTier: String(V4_POOL_FEE),
    hook,
  });
  return `https://app.uniswap.org/positions/create/v4?${params.toString()}`;
}

/** Pool explorer / info page URL per chain. */
const POOL_URL_BY_CHAIN: Partial<Record<number, (poolId: string) => string>> = {
  [gnosis.id]: (poolId) => `https://v3.swapr.eth.limo/#/info/pools/${poolId}`,
  [mainnet.id]: (poolId) => `https://bunni.pro/pools/ethereum/${poolId}`,
  [optimism.id]: (poolId) => `https://app.uniswap.org/explore/pools/optimism/${poolId}`,
  [base.id]: (poolId) => `https://app.uniswap.org/explore/pools/base/${poolId}`,
};

/**
 * URL to add liquidity for an outcome (outcome token + collateral pair).
 * Order-book markets link to Uniswap V4 with the LimitOrderHook pre-filled.
 */
export function getLiquidityUrl(market: Market, outcomeIndex: number): string {
  const { token0, token1 } = getLiquidityPair(market, outcomeIndex);

  if (marketSupportsOrderBook(market)) {
    const hook = getV4HooksAddress(market.chainId);
    if (!hook) {
      return "#";
    }
    return getLiquidityUrlUniswapV4(market.chainId, token0, token1, hook);
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

/**
 * Block explorer base URL for the given chain.
 * Returns "#" if the chain is not configured.
 */
export function getBlockExplorerUrl(chainId: number): string {
  return BLOCK_EXPLORER_URLS[chainId] ?? "#";
}

/**
 * URL to view a token contract on the block explorer.
 */
export function getTokenExplorerUrl(chainId: number, tokenAddress: Address): string {
  const baseUrl = getBlockExplorerUrl(chainId);
  return baseUrl === "#" ? "#" : `${baseUrl}/token/${tokenAddress}`;
}
/**
 * URL to the pool info/explorer page for the given pool id.
 * Returns "#" if the chain is not configured.
 */
export function getPoolExplorerUrl(chainId: number, poolId: Address | string): string {
  const fn = POOL_URL_BY_CHAIN[chainId];
  return fn ? fn(String(poolId)) : "#";
}

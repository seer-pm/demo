import type { SupportedChain } from "@seer-pm/sdk/chains";
import { getMarketPoolsPairs } from "@seer-pm/sdk/market-pools";
import type { Market } from "@seer-pm/sdk/market-types";
import type { Address } from "viem";
import { getAllLiquidityEvents, getLiquidityPositionsAtTimestamp } from "./airdropCalculation/getLiquidityBalances";
import { getAmountsForLiquidity, getSqrtRatioAtTickX96 } from "./airdropCalculation/utils";
import {
  type LiquidityLeg,
  fetchPoolLiquidityLegs,
  fetchWalletLiquidityLegs,
  supportsLiquidityAttribution,
  supportsPositionEntity,
} from "./dexLiquidityPositions";
import { fetchPools } from "./fetchPools";
import type { TokenHolder } from "./token-transactions";

export type MarketLiquidityHolders = {
  holders: Record<string, TokenHolder[]>;
  poolAddresses: string[];
};

/** Outcome-token amounts backed by LP positions, as `owner -> token -> amount`. */
export type LiquidityBalancesByOwner = Map<string, Map<string, bigint>>;

/**
 * The outcome tokens these positions touch, whether or not the wallet ever held them directly.
 *
 * The portfolio resolves markets from the tokens a wallet has balances for. Liquidity minted before
 * the wallet ever took delivery of an outcome token produces no balance row, so without seeding the
 * lookup with these the position would be fetched and then silently dropped for want of a market.
 */
export function tokensFromLiquidityLegs(legs: LiquidityLeg[]): Address[] {
  return [...new Set(legs.flatMap((leg) => [leg.token0, leg.token1]))] as Address[];
}

/**
 * LP legs for `wallets` from the owner-keyed `Position` entity, or `null` where it does not exist.
 *
 * Split out from the fold so the caller can run it before it knows which markets are involved: this
 * source is keyed on the owner alone, which is what lets a wallet's LP-only outcome tokens join the
 * market lookup instead of being filtered out by it.
 */
export async function preloadWalletLiquidityLegs(
  chainId: SupportedChain,
  wallets: Address[],
): Promise<LiquidityLeg[] | null> {
  if (!supportsPositionEntity(chainId)) return null;
  return fetchWalletLiquidityLegs(chainId, wallets);
}

/**
 * Net LP positions of a market set, netted from mint/burn events and attributed to `tx.origin`.
 *
 * The fallback for chains whose DEX subgraph has no `Position` entity. It carries two known errors
 * the owner-keyed source does not: credit does not follow a transferred position NFT, and a position
 * opened by a contract is credited to the EOA that signed for it. Both are accepted here — the
 * alternative on those chains is no attribution at all — and neither applies on Gnosis.
 */
async function legsFromLiquidityEvents(
  chainId: SupportedChain,
  markets: Market[],
  origins?: Address[],
): Promise<LiquidityLeg[]> {
  const pairs = markets.flatMap(getMarketPoolsPairs);
  const [events, pools] = await Promise.all([
    getAllLiquidityEvents(
      chainId,
      pairs.map(({ token0, token1 }) => ({ tokenId: token0, collateralToken: token1 })),
      origins,
    ),
    fetchPools(chainId, pairs),
  ]);
  const sqrtPriceByPool = new Map(pools.map((pool) => [pool.id.toLowerCase(), BigInt(pool.sqrtPrice)]));

  // The same mint/burn -> net-liquidity fold the airdrop runs, not a second copy of it, so the two
  // cannot disagree about which events net together. `Infinity` because this wants the position now.
  return getLiquidityPositionsAtTimestamp(events, Number.POSITIVE_INFINITY).flatMap((position) => {
    const sqrtPrice = sqrtPriceByPool.get(position.poolId) ?? 0n;
    if (sqrtPrice <= 0n) return [];
    return [{ id: position.poolId, owner: position.origin, sqrtPrice, ...position }];
  });
}

/**
 * Outcome-token amounts each leg represents at its pool's current price.
 *
 * Source: Uniswap v3-periphery `LiquidityAmounts.getAmountsForLiquidity`; Algebra uses the same
 * geometry. The collateral side of the pool is dropped — only outcome tokens are portfolio rows.
 */
export function liquidityBalancesFromLegs(legs: LiquidityLeg[], outcomeTokens: Set<string>): LiquidityBalancesByOwner {
  const byOwner: LiquidityBalancesByOwner = new Map();

  for (const leg of legs) {
    if (leg.liquidity <= 0n || leg.sqrtPrice <= 0n) continue;
    const { amount0, amount1 } = getAmountsForLiquidity(
      leg.sqrtPrice,
      getSqrtRatioAtTickX96(leg.tickLower),
      getSqrtRatioAtTickX96(leg.tickUpper),
      leg.liquidity,
    );

    for (const [token, amount] of [
      [leg.token0, amount0],
      [leg.token1, amount1],
    ] as const) {
      if (!outcomeTokens.has(token) || amount <= 0n) continue;
      const tokens = byOwner.get(leg.owner) ?? new Map<string, bigint>();
      tokens.set(token, (tokens.get(token) ?? 0n) + amount);
      byOwner.set(leg.owner, tokens);
    }
  }

  return byOwner;
}

function outcomeTokenSet(markets: Market[]): Set<string> {
  return new Set(markets.flatMap((market) => market.wrappedTokens).map((token) => token.toLowerCase()));
}

/**
 * Outcome-token amounts each of `wallets` holds through LP positions, keyed by lowercased token id.
 *
 * One fetch for the whole wallet set, not one per wallet: the owner-keyed source takes them all in
 * a single filter, and the event fallback takes them all in a single `origin_in`. Pass `preloaded`
 * to reuse legs already fetched for the market lookup.
 */
export async function getWalletsLiquidityBalances(
  chainId: SupportedChain,
  wallets: Address[],
  markets: Market[],
  preloaded?: LiquidityLeg[] | null,
): Promise<LiquidityBalancesByOwner> {
  if (wallets.length === 0 || markets.length === 0 || !supportsLiquidityAttribution(chainId)) return new Map();
  const legs = preloaded ?? (await legsFromLiquidityEvents(chainId, markets, wallets));
  return liquidityBalancesFromLegs(legs, outcomeTokenSet(markets));
}

/** LP holder sets change far more slowly than the endpoint's own cache window. */
const HOLDERS_TTL_MS = 5 * 60 * 1000;
const holdersCache = new Map<string, { at: number; value: Promise<MarketLiquidityHolders> }>();

/**
 * `getLiquidityHolders` for one market, memoized per (chain, market) for `HOLDERS_TTL_MS`.
 *
 * The market page prefetches the holders endpoint on every load and issues another request per
 * account filter in the Activity tab, and each CDN miss otherwise re-crawls the market's pools.
 * The promise is cached, not just its result, so concurrent misses share one crawl; a rejection
 * evicts itself so the next caller retries instead of being served the failure for five minutes.
 */
export function getMarketLiquidityHoldersCached(market: Market): Promise<MarketLiquidityHolders> {
  const key = `${market.chainId}:${market.id.toLowerCase()}`;
  const hit = holdersCache.get(key);
  if (hit && Date.now() - hit.at < HOLDERS_TTL_MS) return hit.value;

  const value = getLiquidityHolders([market]);
  holdersCache.set(key, { at: Date.now(), value });
  value.catch(() => holdersCache.delete(key));
  return value;
}

/** Derives current outcome-token holdings represented by supported LP positions. */
export async function getLiquidityHolders(markets: Market[]): Promise<MarketLiquidityHolders> {
  if (markets.length === 0) return { holders: {}, poolAddresses: [] };
  const chainId = markets[0].chainId as SupportedChain;
  // Bunni and chains without a supported user-position source are intentionally not attributed.
  if (!supportsLiquidityAttribution(chainId)) return { holders: {}, poolAddresses: [] };

  let legs: LiquidityLeg[];
  let poolAddresses: string[];
  if (supportsPositionEntity(chainId)) {
    // Pools are needed regardless: `mergeTokenHolders` uses them to keep pool reserves out of the
    // direct holders, and those reserves are exactly what the legs below re-credit to the LPs.
    const pools = await fetchPools(chainId, markets.flatMap(getMarketPoolsPairs));
    poolAddresses = pools.map((pool) => pool.id.toLowerCase());
    legs = await fetchPoolLiquidityLegs(chainId, poolAddresses);
  } else {
    legs = await legsFromLiquidityEvents(chainId, markets);
    poolAddresses = [...new Set(legs.map((leg) => leg.poolId))];
  }

  const byOwner = liquidityBalancesFromLegs(legs, outcomeTokenSet(markets));
  const byToken = new Map<string, Map<string, bigint>>();
  for (const [owner, tokens] of byOwner) {
    for (const [token, amount] of tokens) {
      const holders = byToken.get(token) ?? new Map<string, bigint>();
      holders.set(owner, (holders.get(owner) ?? 0n) + amount);
      byToken.set(token, holders);
    }
  }

  const holders = Object.fromEntries(
    markets
      .flatMap((market) => market.wrappedTokens)
      .map((token) => {
        const tokenId = token.toLowerCase();
        const tokenBalances = byToken.get(tokenId) ?? new Map<string, bigint>();
        return [
          tokenId,
          [...tokenBalances.entries()]
            .map(([address, balance]) => ({ address: address as Address, balance: balance.toString() }))
            .sort((a, b) => {
              const difference = BigInt(b.balance) - BigInt(a.balance);
              return difference === 0n ? 0 : difference > 0n ? 1 : -1;
            }),
        ];
      }),
  );

  return { holders, poolAddresses };
}

/** Combines direct and LP-backed token balances while excluding pool contracts. */
export function mergeTokenHolders(
  direct: Record<string, TokenHolder[]>,
  liquidity: Record<string, TokenHolder[]>,
  poolAddresses: string[],
): Record<string, TokenHolder[]> {
  const tokens = new Set([...Object.keys(direct), ...Object.keys(liquidity)]);
  const pools = new Set(poolAddresses.map((address) => address.toLowerCase()));
  const merged: Record<string, TokenHolder[]> = {};

  for (const token of tokens) {
    const balances = new Map<string, bigint>();
    for (const holder of [...(direct[token] ?? []), ...(liquidity[token] ?? [])]) {
      const address = holder.address.toLowerCase();
      if (pools.has(address)) continue;
      balances.set(address, (balances.get(address) ?? 0n) + BigInt(holder.balance));
    }
    merged[token] = [...balances.entries()]
      .filter(([, balance]) => balance > 0n)
      .map(([address, balance]) => ({ address: address as Address, balance: balance.toString() }))
      .sort((a, b) => {
        const difference = BigInt(b.balance) - BigInt(a.balance);
        return difference === 0n ? 0 : difference > 0n ? 1 : -1;
      });
  }

  return merged;
}

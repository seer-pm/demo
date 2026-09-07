import type { PortfolioLpLeg, PortfolioPosition } from "@seer-pm/sdk";
import type { SupportedChain } from "@seer-pm/sdk/chains";
import { getMarketPoolsPairs } from "@seer-pm/sdk/market-pools";
import type { Market } from "@seer-pm/sdk/market-types";
import { type Address, formatUnits } from "viem";
import { getAllLiquidityEvents, getLiquidityPositionsAtTimestamp } from "./airdropCalculation/getLiquidityBalances";
import { getAmountsForLiquidity, getSqrtRatioAtTickX96 } from "./airdropCalculation/utils";
import {
  type LiquidityLeg,
  fetchPoolLiquidityLegs,
  fetchPoolSqrtPrices,
  fetchWalletLiquidityLegs,
  supportsLiquidityAttribution,
  supportsPositionEntity,
} from "./dexLiquidityPositions";
import { fetchPools } from "./fetchPools";
import type { TokenHolder } from "./token-transactions";
import { getTokenDecimalsList } from "./tokenDecimals";

export type MarketLiquidityHolders = {
  holders: Record<string, TokenHolder[]>;
  poolAddresses: string[];
};

/** What one wallet holds of one outcome token through AMM positions, and the positions behind it. */
export type LpTokenHolding = {
  amount: bigint;
  /** Kept so a cached row can be re-derived at a later pool price; see `PortfolioPosition.lpLegs`. */
  legs: PortfolioLpLeg[];
};

/** LP-backed outcome-token holdings, as `owner -> token -> holding`. */
export type LiquidityBalancesByOwner = Map<string, Map<string, LpTokenHolding>>;

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
 * the owner-keyed source does not, both accepted because the alternative on those chains is no
 * attribution at all, and neither reachable on Gnosis:
 *
 * - Credit does not follow a transferred position NFT: a position sold or moved stays on the
 *   minter's portfolio, and on the market's holder list, until it is burned from the same EOA.
 * - `tx.origin` is always an EOA, so a position opened by a contract is credited to whoever signed
 *   for it. That would mean a Safe or a TradeExecutor showing no liquidity while its signer shows
 *   liquidity it never owned. Deliberately not worked around: the TradeExecutor never adds
 *   liquidity, and no Safe provides it today either.
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

    for (const [side, token, amount] of [
      [0, leg.token0, amount0],
      [1, leg.token1, amount1],
    ] as const) {
      // A position whose range the price has left holds nothing of this side today, but it is still
      // the wallet's position: keep the leg so a later re-derivation can find it back in range.
      if (!outcomeTokens.has(token)) continue;
      const tokens = byOwner.get(leg.owner) ?? new Map<string, LpTokenHolding>();
      const holding = tokens.get(token) ?? { amount: 0n, legs: [] };
      holding.amount += amount > 0n ? amount : 0n;
      holding.legs.push({
        poolId: leg.poolId,
        tickLower: leg.tickLower,
        tickUpper: leg.tickUpper,
        liquidity: leg.liquidity.toString(),
        side,
      });
      tokens.set(token, holding);
      byOwner.set(leg.owner, tokens);
    }
  }

  return byOwner;
}

/** Outcome-token amounts each leg represents right now, dropping the positions behind them. */
export function liquidityAmountsFromLegs(legs: LiquidityLeg[], outcomeTokens: Set<string>): Map<string, bigint> {
  const amounts = new Map<string, bigint>();
  for (const tokens of liquidityBalancesFromLegs(legs, outcomeTokens).values()) {
    for (const [token, holding] of tokens) {
      if (holding.amount > 0n) amounts.set(token, (amounts.get(token) ?? 0n) + holding.amount);
    }
  }
  return amounts;
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
    for (const [token, holding] of tokens) {
      if (holding.amount <= 0n) continue;
      const holders = byToken.get(token) ?? new Map<string, bigint>();
      holders.set(owner, (holders.get(owner) ?? 0n) + holding.amount);
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

/**
 * Re-derives what each row's stored AMM positions hold at the pools' current prices.
 *
 * A cached row's `lpTokenBalance` is not a balance that stays put until the wallet moves: it is a
 * function of the pool price, and any other trader moving that price changes it with no transfer to
 * the wallet at all. The activity probe that decides a cached portfolio is still fresh cannot see
 * that, so without this a concentrated position that went out of range keeps being reported at the
 * composition it had when the blob was written, for the length of the TTL.
 *
 * Costs one pool query per chain, because the liquidity and tick range stored on the row are the
 * invariants — only the price has to be fetched again.
 */
export async function repriceLiquidityLegs(
  chainId: SupportedChain,
  positions: PortfolioPosition[],
): Promise<PortfolioPosition[]> {
  const poolIds = [...new Set(positions.flatMap((position) => (position.lpLegs ?? []).map((leg) => leg.poolId)))];
  if (poolIds.length === 0) return positions;

  const sqrtPrices = await fetchPoolSqrtPrices(chainId, poolIds);
  if (sqrtPrices.size === 0) return positions;

  const decimals = getTokenDecimalsList(
    chainId,
    positions.map((position) => position.tokenId),
  );

  return positions.map((position, index) => {
    const raw = lpAmountAtPrices(position.lpLegs, sqrtPrices);
    if (raw === null) return position;
    return {
      ...position,
      rawLpBalance: raw.toString(),
      lpTokenBalance: Number(formatUnits(raw, decimals[index])),
    };
  });
}

/**
 * What `legs` hold of their row's token at `sqrtPrices`, or `null` when they cannot be re-derived.
 *
 * `null` for a row with no stored positions, and for one whose pool the price lookup did not answer
 * for: keeping the amount already on the row beats reporting zero for a position that plainly
 * exists. Zero is a real answer — it means every position has moved out of range on this side.
 */
export function lpAmountAtPrices(legs: PortfolioLpLeg[] | undefined, sqrtPrices: Map<string, bigint>): bigint | null {
  if (!legs?.length) return null;

  let raw = 0n;
  for (const leg of legs) {
    const sqrtPrice = sqrtPrices.get(leg.poolId);
    if (sqrtPrice === undefined) return null;
    if (sqrtPrice <= 0n) continue;
    const amounts = getAmountsForLiquidity(
      sqrtPrice,
      getSqrtRatioAtTickX96(leg.tickLower),
      getSqrtRatioAtTickX96(leg.tickUpper),
      BigInt(leg.liquidity),
    );
    const amount = leg.side === 0 ? amounts.amount0 : amounts.amount1;
    if (amount > 0n) raw += amount;
  }
  return raw;
}

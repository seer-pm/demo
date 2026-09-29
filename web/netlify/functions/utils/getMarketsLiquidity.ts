import { base, optimism } from "@/lib/chains.ts";
import { isTwoStringsEqual } from "@/lib/utils.ts";
import type { SupportedChain } from "@seer-pm/sdk";
import { getDefaultCollateralProfile } from "@seer-pm/sdk/collateral";
import { tickToPrice } from "@seer-pm/sdk/liquidity-utils";
import { getCollateralByIndex, getMarketPoolsPairs } from "@seer-pm/sdk/market-pools";
import type { Market } from "@seer-pm/sdk/market-types";
import { type Address, zeroAddress } from "viem";
import { getDexScreenerPriceUSD } from "./common.ts";
import { chainIds } from "./config.ts";
import type { Pool } from "./fetchPools.ts";
import { fetchSUSDSPriceFromContract } from "./fetchSUSDSPriceFromContract.ts";

type MainCollateralPriceByChain = Record<Address, Partial<Record<SupportedChain, number>>>;

/** USD price for each chain’s **default** collateral profile (sDAI on Gnosis, etc.). */
export async function getMainCollateralPriceByChainMapping(): Promise<MainCollateralPriceByChain> {
  const acc: MainCollateralPriceByChain = {};
  try {
    await Promise.all(
      chainIds.map(async (chainId) => {
        const profile = getDefaultCollateralProfile(chainId);
        let price: number;
        if (chainId === optimism.id || chainId === base.id) {
          // TODO: dexscreener doesn't have the sUSDS price, get from contract
          price = (await fetchSUSDSPriceFromContract(10)) || 1.097;
        } else {
          // sDAI
          price = (await getDexScreenerPriceUSD(profile.primary.address, chainId)) || 1.2;
        }
        acc[profile.primary.address] = { [chainId]: price };
      }),
    );
  } catch {
    for (const chainId of chainIds) {
      const profile = getDefaultCollateralProfile(chainId);
      acc[profile.primary.address] = { [chainId]: 1.13 };
    }
  }
  return acc;
}

type FutarchyCollateralsPriceMapping = Record<string, Record<string, number>>;

async function getFutarchyCollateralsByChainMapping(markets: Market[]): Promise<FutarchyCollateralsPriceMapping> {
  const futarchyCollateralsByChain = markets.reduce(
    (acc, market) => {
      const chainId = market.chainId.toString();
      if (!acc[chainId]) {
        acc[chainId] = new Set();
      }
      acc[chainId].add(market.collateralToken1);
      acc[chainId].add(market.collateralToken2);
      return acc;
    },
    {} as Record<string, Set<string>>,
  );

  const priceMapping: FutarchyCollateralsPriceMapping = {};

  await Promise.all(
    Object.entries(futarchyCollateralsByChain).map(async ([chainId, collaterals]) => {
      priceMapping[chainId] = {};
      await Promise.all(
        Array.from(collaterals).map(async (collateral) => {
          priceMapping[chainId][collateral] =
            (await getDexScreenerPriceUSD(collateral as Address, Number(chainId) as SupportedChain)) || 0;
        }),
      );
    }),
  );

  return priceMapping;
}

type TokenLiquidityBalanceInfo = {
  token0: { symbol: string; balance: number };
  token1: { symbol: string; balance: number };
};

/**
 * Lifetime swap volume of an outcome token, in USD. `volumeUSD` is the cash side: the counterparty
 * handed over in the swaps. `volumeNotionalUSD` is the outcome side, each share valued at one unit
 * of the pool's counterparty, which is the most it can pay out.
 */
type TokenVolume = {
  volumeUSD: number;
  volumeNotionalUSD: number;
};

const ZERO_VOLUME: TokenVolume = { volumeUSD: 0, volumeNotionalUSD: 0 };

type TokenLiquidityMapping = Record<
  Address,
  TokenVolume & {
    liquidity: number;
    tokenBalanceInfo: TokenLiquidityBalanceInfo;
  }
>;

/**
 * One pool of a Generic outcome. `main` pools quote the outcome in the chain's main collateral and
 * price it on their own; `parent` pools quote it in the parent outcome token, so their price only
 * means something once that token has a main-collateral price of its own.
 */
type OutcomePoolCandidate = {
  pool: Pool;
  outcomeToken: Address;
  counterparty: Address;
  kind: "main" | "parent";
  balanceOutcome: number;
  balanceCounterparty: number;
  /** Counterparty per outcome token, from the pool's spot price. */
  mid: number;
  tokenBalanceInfo: TokenLiquidityBalanceInfo;
};

type GenericTokenLiquidityMapping = Record<
  Address,
  TokenVolume & {
    liquidity: number;
    tokenBalanceInfo: TokenLiquidityBalanceInfo;
    tokenPriceInMainCollateral: number;
    /**
     * Price the odds are made of, from the tick of the pool that priced the token: in the market
     * collateral when that is the parent pool, in the main collateral when only a main pool exists.
     * The second is absolute rather than conditional on the parent outcome, by decision: it needs no
     * price for the parent token, which the "Other" of a chained market never has. NaN when unknown.
     */
    tokenPriceForOdds: number;
  }
>;

function isChildMarket(market: Market): boolean {
  return market.parentMarket.id !== zeroAddress;
}

/** Outcome token per counterparty, from the pool's tick. NaN when the subgraph has no tick yet. */
function tickPrice(pool: Pool, outcomeToken: Address): number {
  if (pool.tick === null || pool.tick === undefined) {
    return Number.NaN;
  }
  const [price0, price1] = tickToPrice(Number(pool.tick));
  return isTwoStringsEqual(pool.token0.id, outcomeToken) ? Number(price0) : Number(price1);
}

/**
 * Candidates per outcome token, in price precedence: the market collateral pair first, then the main
 * collateral pair. Several pools of the same pair (fee tiers) keep only the one holding the most
 * collateral, as one pool per pair is what the rest of the pipeline assumes.
 */
function toOutcomePoolCandidate(pool: Pool): OutcomePoolCandidate {
  const outcomeToken = (pool.isToken0Collateral ? pool.token1.id : pool.token0.id).toLowerCase() as Address;
  const counterparty = pool.counterparty.toLowerCase() as Address;
  const [balanceOutcome, balanceCounterparty] = pool.isToken0Collateral
    ? [pool.balance1, pool.balance0]
    : [pool.balance0, pool.balance1];
  return {
    pool,
    outcomeToken,
    counterparty,
    kind:
      isChildMarket(pool.market) && isTwoStringsEqual(counterparty, pool.market.collateralToken) ? "parent" : "main",
    balanceOutcome,
    balanceCounterparty,
    mid: pool.isToken0Collateral ? Number(pool.token0Price) : Number(pool.token1Price),
    tokenBalanceInfo: {
      token0: { symbol: pool.token0.symbol, balance: pool.balance0 },
      token1: { symbol: pool.token1.symbol, balance: pool.balance1 },
    },
  };
}

function groupOutcomePoolCandidates(genericTokenPools: Pool[]): Map<Address, OutcomePoolCandidate[]> {
  const byPair = new Map<string, OutcomePoolCandidate>();
  for (const pool of genericTokenPools) {
    const candidate = toOutcomePoolCandidate(pool);
    const key = `${candidate.outcomeToken}-${candidate.counterparty}`;
    const existing = byPair.get(key);
    if (!existing || candidate.balanceCounterparty > existing.balanceCounterparty) {
      byPair.set(key, candidate);
    }
  }

  const byToken = new Map<Address, OutcomePoolCandidate[]>();
  for (const candidate of byPair.values()) {
    const candidates = byToken.get(candidate.outcomeToken) ?? [];
    candidates.push(candidate);
    byToken.set(candidate.outcomeToken, candidates);
  }
  for (const candidates of byToken.values()) {
    candidates.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "parent" ? -1 : 1));
  }
  return byToken;
}

type ResolvedPrice = { price: number; source: OutcomePoolCandidate };

/**
 * Main-collateral price of every outcome token that has one.
 *
 * A token takes the price of its first candidate as soon as that candidate can be priced, which for a
 * parent pool means once the parent token itself is priced: a grandchild resolves one pass after its
 * parent. Only when no pass can price a token through its parent pool does its main pool step in, and
 * that may in turn unlock the tokens hanging from it, so the passes restart after every such fallback.
 *
 * A parent token without any pool stays unpriced, and so do the outcomes hanging from it: their odds
 * and open interest read as unknown until someone pools it.
 */
function resolveMainCollateralPrices(byToken: Map<Address, OutcomePoolCandidate[]>): Map<Address, ResolvedPrice> {
  const resolved = new Map<Address, ResolvedPrice>();
  const priceOf = (candidate: OutcomePoolCandidate): number | undefined => {
    if (candidate.kind === "main") {
      return candidate.mid;
    }
    const parent = resolved.get(candidate.counterparty);
    return parent === undefined ? undefined : candidate.mid * parent.price;
  };

  while (true) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const [token, candidates] of byToken) {
        if (resolved.has(token)) continue;
        const price = priceOf(candidates[0]);
        if (price !== undefined) {
          resolved.set(token, { price, source: candidates[0] });
          changed = true;
        }
      }
    }
    let fellBack = false;
    for (const [token, candidates] of byToken) {
      if (resolved.has(token)) continue;
      const main = candidates.find((candidate) => candidate.kind === "main");
      if (main) {
        resolved.set(token, { price: main.mid, source: main });
        fellBack = true;
        break;
      }
    }
    if (!fellBack) {
      return resolved;
    }
  }
}

/**
 * Main-collateral value of one unit of the candidate's counterparty: 1 for a main pool, the parent
 * token's price for a parent pool, undefined while that token has no price.
 */
function counterpartyInMain(
  candidate: OutcomePoolCandidate,
  resolved: Map<Address, ResolvedPrice>,
): number | undefined {
  return candidate.kind === "main" ? 1 : resolved.get(candidate.counterparty)?.price;
}

/** Lifetime swap volume of a pool, in token units, split into its outcome and counterparty sides. */
function poolVolumeLegs(pool: Pool): { outcome: number; counterparty: number } {
  const volume0 = Number(pool.volumeToken0) || 0;
  const volume1 = Number(pool.volumeToken1) || 0;
  return pool.isToken0Collateral
    ? { outcome: volume1, counterparty: volume0 }
    : { outcome: volume0, counterparty: volume1 };
}

/**
 * Swap volume per Generic outcome token, in USD, through the same counterparty multiplier as the
 * liquidity. Every pool counts, so several fee tiers of one pair add up even though only the deepest
 * one sets the price. A pool whose counterparty has no main-collateral price adds nothing: the same
 * market already reads zero liquidity and no odds for that reason, and one is only an upper bound on
 * what the parent token is worth.
 */
function getGenericTokenVolumes(
  genericTokenPools: Pool[],
  resolved: Map<Address, ResolvedPrice>,
  mainUsd: (chainId: SupportedChain) => number,
): Record<Address, TokenVolume> {
  const res: Record<Address, TokenVolume> = {};
  for (const pool of genericTokenPools) {
    const candidate = toOutcomePoolCandidate(pool);
    const inMain = counterpartyInMain(candidate, resolved);
    if (inMain === undefined) continue;
    const multiplier = inMain * mainUsd(pool.chainId);
    const legs = poolVolumeLegs(pool);
    const entry = res[candidate.outcomeToken] ?? { ...ZERO_VOLUME };
    entry.volumeUSD += legs.counterparty * multiplier;
    entry.volumeNotionalUSD += legs.outcome * multiplier;
    res[candidate.outcomeToken] = entry;
  }
  return res;
}

/**
 * Liquidity, volume and prices of every Generic outcome token, top-level and conditional alike.
 * Liquidity is the sum over the token's pools, each valued in USD through its own counterparty, so a
 * child outcome with a main-collateral pool counts even when its parent has none.
 */
function getGenericTokenToLiquidityMapping(
  genericTokenPools: Pool[],
  mainCollateralPriceByChainMapping: MainCollateralPriceByChain,
): GenericTokenLiquidityMapping {
  const byToken = groupOutcomePoolCandidates(genericTokenPools);
  const resolved = resolveMainCollateralPrices(byToken);
  const mainUsd = (chainId: SupportedChain) =>
    mainCollateralPriceByChainMapping?.[getDefaultCollateralProfile(chainId).primary.address]?.[chainId] || 0;
  const volumes = getGenericTokenVolumes(genericTokenPools, resolved, mainUsd);

  const res: GenericTokenLiquidityMapping = {};
  for (const [token, candidates] of byToken) {
    const liquidity = candidates.reduce((total, candidate) => {
      const inCounterparty = candidate.mid * candidate.balanceOutcome + candidate.balanceCounterparty;
      return total + inCounterparty * (counterpartyInMain(candidate, resolved) ?? 0) * mainUsd(candidate.pool.chainId);
    }, 0);

    const priced = resolved.get(token);
    // Unpriced tokens still report the balances of their first pool, so the header can list them.
    const source = priced?.source ?? candidates[0];

    res[token] = {
      liquidity,
      ...(volumes[token] ?? ZERO_VOLUME),
      tokenPriceInMainCollateral: priced?.price ?? 0,
      tokenPriceForOdds: tickPrice(source.pool, token),
      tokenBalanceInfo: source.tokenBalanceInfo,
    };
  }
  return res;
}

function getFutarchyTokenToLiquidityMapping(
  futarchyTokenPools: Pool[],
  futarchyCollateralsByChainMapping: FutarchyCollateralsPriceMapping,
): TokenLiquidityMapping {
  return futarchyTokenPools.reduce((acc, curr) => {
    // Determine which collateral token (1 or 2) corresponds to token0 based on the wrapped token indices
    // For futarchy markets: wrappedTokens[0] and [2] use collateralToken1, while [1] and [3] use collateralToken2
    const collaterals =
      curr.market.wrappedTokens[0] === curr.token0.id || curr.market.wrappedTokens[2] === curr.token0.id
        ? [curr.market.collateralToken1, curr.market.collateralToken2]
        : [curr.market.collateralToken2, curr.market.collateralToken1];
    const prices = futarchyCollateralsByChainMapping[curr.chainId.toString()];
    // Each leg is worth its own conditional collateral: wrappedTokens[0] and [1] redeem to
    // collateralToken1, [2] and [3] to collateralToken2 (see getCollateralByIndex).
    const legUsd = (token: string, volume: string) => {
      const index = curr.market.wrappedTokens.findIndex((wrapped) => isTwoStringsEqual(wrapped, token));
      return (Number(volume) || 0) * (prices[getCollateralByIndex(curr.market, index)] ?? 0);
    };
    const leg0 = legUsd(curr.token0.id, curr.volumeToken0);
    const leg1 = legUsd(curr.token1.id, curr.volumeToken1);
    // Both legs of a swap are worth the same when it executes, so a trade counts once: half on each
    // side, or the priced leg alone when the other collateral has no quote. Both sides being outcome
    // tokens, there is no cash/notional split and the two figures are equal.
    const [volume0, volume1] = leg0 > 0 && leg1 > 0 ? [leg0 / 2, leg1 / 2] : [leg0, leg1];

    // Volume is lifetime and adds up over every pool of the pair, fee tiers included, like the
    // Generic path. Liquidity and balances are a snapshot and stay those of the last pool seen.
    const prior0 = acc[curr.token0.id as Address] ?? ZERO_VOLUME;
    const prior1 = acc[curr.token1.id as Address] ?? ZERO_VOLUME;
    // count 50% of liquidity for both sides
    acc[curr.token0.id as Address] = {
      liquidity: (curr.balance0 / 2) * prices[collaterals[0]],
      volumeUSD: prior0.volumeUSD + volume0,
      volumeNotionalUSD: prior0.volumeNotionalUSD + volume0,
      tokenBalanceInfo: {
        token0: { symbol: curr.token0.symbol, balance: curr.balance0 },
        token1: { symbol: curr.token1.symbol, balance: curr.balance1 },
      },
    };
    acc[curr.token1.id as Address] = {
      liquidity: (curr.balance1 / 2) * prices[collaterals[1]],
      volumeUSD: prior1.volumeUSD + volume1,
      volumeNotionalUSD: prior1.volumeNotionalUSD + volume1,
      tokenBalanceInfo: {
        token0: { symbol: curr.token0.symbol, balance: curr.balance0 },
        token1: { symbol: curr.token1.symbol, balance: curr.balance1 },
      },
    };
    return acc;
  }, {} as TokenLiquidityMapping);
}

export type LiquidityToMarketMapping = Record<
  `0x${string}`,
  {
    totalLiquidity: number;
    /**
     * Lifetime swap volume over the market's pools, in USD at today's prices: cash is the collateral
     * that changed hands, notional is the shares that did, each valued at one unit of its pool's
     * counterparty. Zero for a market whose pools have no priced counterparty.
     */
    volumeUSD: number;
    volumeNotionalUSD: number;
    collateralPriceInUSD: number;
    poolBalance: Array<TokenLiquidityBalanceInfo | null>;
    /** Per outcome, the price its odds are made of (NaN when unknown). Empty on Futarchy markets. */
    outcomePrices: number[];
  }
>;

export async function getMarketsLiquidity(markets: Market[], allPools: Pool[]): Promise<LiquidityToMarketMapping> {
  const futarchyMarkets = markets.filter((market) => market.type === "Futarchy");
  const genericTokenPools = allPools.filter((pool) => pool.market.type === "Generic");
  const futarchyTokenPools = allPools.filter((pool) => pool.market.type === "Futarchy");

  const mainCollateralPriceByChainMapping = await getMainCollateralPriceByChainMapping();

  const futarchyCollateralsByChainMapping = await getFutarchyCollateralsByChainMapping(futarchyMarkets);
  const genericTokenToLiquidityMapping = getGenericTokenToLiquidityMapping(
    genericTokenPools,
    mainCollateralPriceByChainMapping,
  );
  const futarchyTokenToLiquidityMapping = getFutarchyTokenToLiquidityMapping(
    futarchyTokenPools,
    futarchyCollateralsByChainMapping,
  );

  const tokenToLiquidityMapping: TokenLiquidityMapping = {
    ...genericTokenToLiquidityMapping,
    ...futarchyTokenToLiquidityMapping,
  };

  const liquidityToMarketMapping: LiquidityToMarketMapping = markets.reduce((acc, market) => {
    let totalLiquidity = 0;
    let volumeUSD = 0;
    let volumeNotionalUSD = 0;

    const tokenBalanceInfo: (TokenLiquidityBalanceInfo | null)[] = [];

    for (const outcomeToken of market.wrappedTokens) {
      const data = tokenToLiquidityMapping[outcomeToken.toLowerCase() as `0x${string}`];

      totalLiquidity += data?.liquidity ?? 0;
      volumeUSD += data?.volumeUSD ?? 0;
      volumeNotionalUSD += data?.volumeNotionalUSD ?? 0;

      tokenBalanceInfo.push(data?.tokenBalanceInfo || null);
    }

    let collateralPriceInUSD = 1;

    if (market.type === "Generic") {
      const mainCollateralPrice =
        mainCollateralPriceByChainMapping?.[getDefaultCollateralProfile(market.chainId).primary.address]?.[
          market.chainId
        ] || 0;

      if (!isChildMarket(market)) {
        // generic market collateral = main collateral
        collateralPriceInUSD = mainCollateralPrice;
      } else {
        // conditional market collateral =
        // parent outcome token price * main collateral price
        const parentOutcomeToken = market.collateralToken.toLowerCase() as Address;

        const parentOutcomePriceInMainCollateral =
          genericTokenToLiquidityMapping[parentOutcomeToken]?.tokenPriceInMainCollateral || 0;

        collateralPriceInUSD = parentOutcomePriceInMainCollateral * mainCollateralPrice;
      }
    } else if (market.type === "Futarchy") {
      collateralPriceInUSD = 1;
    }

    if (!acc[market.id]) {
      acc[market.id] = {
        totalLiquidity: 0,
        volumeUSD: 0,
        volumeNotionalUSD: 0,
        collateralPriceInUSD: 0,
        poolBalance: [],
        outcomePrices: [],
      };
    }

    acc[market.id].totalLiquidity = totalLiquidity;
    acc[market.id].volumeUSD = volumeUSD;
    acc[market.id].volumeNotionalUSD = volumeNotionalUSD;

    acc[market.id].collateralPriceInUSD = collateralPriceInUSD;

    acc[market.id].poolBalance = getMarketPoolsPairs(market).map((poolPair, i) => {
      if (market.type === "Futarchy") {
        return tokenToLiquidityMapping[poolPair.token0]?.tokenBalanceInfo || null;
      }

      const collateral = getCollateralByIndex(market, i);

      const outcomeToken = collateral === poolPair.token0 ? poolPair.token1 : poolPair.token0;

      return tokenToLiquidityMapping[outcomeToken]?.tokenBalanceInfo || null;
    });

    if (market.type === "Generic") {
      acc[market.id].outcomePrices = market.wrappedTokens.map(
        (outcomeToken) =>
          genericTokenToLiquidityMapping[outcomeToken.toLowerCase() as Address]?.tokenPriceForOdds ?? Number.NaN,
      );
    }

    return acc;
  }, {} as LiquidityToMarketMapping);
  return liquidityToMarketMapping;
}

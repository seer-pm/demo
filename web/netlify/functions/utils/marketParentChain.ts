import type { SupportedChain } from "@seer-pm/sdk";
import type { Market } from "@seer-pm/sdk/market-types";
import { zeroAddress } from "viem";
import type { PricedMarket } from "./marketMtmRefresh";
import { searchAllMarkets } from "./markets";

/** Nesting reaches depth 2 on gnosis today; the bound only exists so a cyclic parent cannot hang. */
const MAX_PARENT_DEPTH = 8;

export function isRootMarket(market: Market): boolean {
  const parent = market.parentMarket?.id;
  return !parent || parent.toLowerCase() === (zeroAddress as string);
}

/**
 * A market that could not be found keeps `parentMarketId` set, which prices its outcomes at 0.
 * That is deliberate: a conditional quoted against a parent nobody loaded is worth 0 as far as we
 * can prove, and the alternative — dropping `parentMarketId` — makes `mapOutcomePrices` store the
 * price *relative to the parent outcome* as if it were an absolute collateral price.
 */
export function toPricedMarket(market: Market): PricedMarket {
  return {
    id: market.id.toLowerCase(),
    collateralToken: market.collateralToken.toLowerCase(),
    wrappedTokens: (market.wrappedTokens ?? []).map((t) => String(t).toLowerCase()),
    parentMarketId: isRootMarket(market) ? undefined : market.parentMarket.id.toLowerCase(),
  };
}

/**
 * `markets` plus every ancestor of theirs, deduplicated by id.
 *
 * Callers that resolve markets from the tokens a wallet holds get no parents at all — a wallet
 * holding a conditional outcome usually holds none of the parent's outcome tokens, since splitting
 * consumed them. Pricing needs the parent anyway, so it is fetched here, one query per depth level
 * rather than one per market.
 */
export async function loadMarketsWithAncestors(
  markets: Market[],
  chainId: SupportedChain,
  collateralProfile?: string,
): Promise<Market[]> {
  const byId = new Map<string, Market>();
  for (const market of markets) {
    byId.set(market.id.toLowerCase(), market);
  }

  let frontier = markets;
  for (let depth = 0; depth < MAX_PARENT_DEPTH; depth++) {
    const missing = [
      ...new Set(
        frontier
          .filter((market) => !isRootMarket(market))
          .map((market) => market.parentMarket.id.toLowerCase())
          .filter((id) => !byId.has(id)),
      ),
    ];
    if (missing.length === 0) {
      break;
    }

    const { markets: found } = await searchAllMarkets({ chainIds: [chainId], marketIds: missing, collateralProfile });
    if (found.length === 0) {
      break;
    }

    for (const market of found) {
      byId.set(market.id.toLowerCase(), market);
    }
    frontier = found;
  }

  return [...byId.values()];
}

/**
 * `marketIds` plus every ancestor of theirs that is **already** in `pool`, deduplicated.
 *
 * Pruning before `loadMarketsWithAncestors` is what keeps the price read proportional to the wallet
 * being valued rather than to the whole market list its holdings were resolved against — and when
 * the caller already expanded `pool`, the follow-up load finds nothing missing and queries nothing.
 */
export function marketsWithLocalAncestors(marketIds: readonly string[], pool: readonly Market[]): Market[] {
  const byId = new Map(pool.map((market) => [market.id.toLowerCase(), market]));
  const picked = new Map<string, Market>();

  for (const marketId of marketIds) {
    let current = byId.get(marketId.toLowerCase());
    for (let depth = 0; current && depth < MAX_PARENT_DEPTH; depth++) {
      const currentId = current.id.toLowerCase();
      if (picked.has(currentId)) break;
      picked.set(currentId, current);
      if (isRootMarket(current)) break;
      current = byId.get(current.parentMarket.id.toLowerCase());
    }
  }

  return [...picked.values()];
}

/** Depth of `market` within `byId`; 0 for a root, and for a child whose parent is not in the set. */
function marketDepth(market: Market, byId: Map<string, Market>): number {
  let depth = 0;
  let current = market;
  const seen = new Set<string>([current.id.toLowerCase()]);

  while (!isRootMarket(current) && depth < MAX_PARENT_DEPTH) {
    const parentId = current.parentMarket.id.toLowerCase();
    const parent = byId.get(parentId);
    if (!parent || seen.has(parentId)) {
      break;
    }
    seen.add(parentId);
    current = parent;
    depth += 1;
  }

  return depth;
}

/**
 * Pricing inputs ordered root first — the order `mapOutcomePrices` needs, since a conditional reads
 * its parent's price out of the map that same pass.
 */
export function pricedMarketsRootFirst(markets: Market[]): PricedMarket[] {
  const byId = new Map(markets.map((market) => [market.id.toLowerCase(), market]));
  return [...markets].sort((a, b) => marketDepth(a, byId) - marketDepth(b, byId)).map(toPricedMarket);
}

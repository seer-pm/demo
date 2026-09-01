import type { SupportedChain } from "@seer-pm/sdk";
import { isOpStack } from "@seer-pm/sdk/chains";
import { getToken0Token1 } from "@seer-pm/sdk/market-pools";
import type { Token0Token1 } from "@seer-pm/sdk/market-pools";
import { getSubgraphUrl } from "@seer-pm/sdk/subgraph";
import pLimit from "p-limit";
import { type Address, zeroAddress } from "viem";
import { mainnet } from "viem/chains";
import { withRetry } from "../withRetry";

// Chains can have tens of thousands of outcome tokens (e.g. Optimism), so we cannot put every
// token pair into a single subgraph `or` filter. Split pairs into batches, fetch concurrently,
// and guard each request with a timeout so a stalled gateway request cannot hang the run.
const PAIR_BATCH_SIZE = 250;
const PAGE_SIZE = 1000;
const SUBGRAPH_CONCURRENCY = 5;
const REQUEST_TIMEOUT_MS = 60_000;

function chunkArray<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

function getLiquiditySubgraphUrl(chainId: SupportedChain) {
  const useUniswap = chainId === mainnet.id || isOpStack(chainId);
  return getSubgraphUrl(useUniswap ? "uniswap" : "algebra", useUniswap ? chainId : 100)!;
}

// biome-ignore lint/suspicious/noExplicitAny: subgraph JSON shape varies per entity
export type SubgraphRequest = (url: string, query: string) => Promise<any>;

/**
 * One subgraph query, retried on transient gateway failures.
 *
 * The mint/burn crawl is the expensive, metered half of a backfill, and it had no retry at all: a
 * single hiccup from The Graph's decentralised gateway ("bad indexers: {0x..: BadResponse(404)}")
 * threw straight out of `loadChainInputs` and aborted the whole run, discarding every chain already
 * crawled. That is the same defect as the unretried `get_direct_holdings_at` call, and it is worth
 * more here because the work being thrown away costs money. A fresh AbortController per attempt
 * keeps the per-request timeout intact across retries.
 */
// biome-ignore lint/suspicious/noExplicitAny: subgraph JSON shape varies per entity
async function subgraphRequest(url: string, query: string): Promise<any> {
  return withRetry(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const results = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });
      const json = await results.json();
      if (json.errors?.length) {
        throw json.errors[0];
      }
      return json;
    } finally {
      clearTimeout(timer);
    }
  }, "subgraph");
}

export interface LiquidityEvent {
  id: string;
  /** The pool the event happened in. Used to keep pool reserves out of direct holdings. */
  pool: {
    id: string;
  };
  token0: {
    id: string;
    symbol: string;
  };
  token1: {
    id: string;
    symbol: string;
  };
  /** Liquidity delta (L), raw. This — not amount0/amount1 — is what defines the position. */
  amount: string;
  amount0: string;
  amount1: string;
  tickLower: string;
  tickUpper: string;
  timestamp: string;
  origin: string;
  type: string;
}

/**
 * Fetches all events of one entity ("mints" | "burns") for a single batch of token pairs.
 *
 * Paginated on `id`, NOT on `timestamp`. The previous cursor advanced to
 * `{timestamp_gt: <last event's timestamp>}`, but timestamps are not unique — a block can hold many
 * mints or burns — so whenever a page boundary landed inside a timestamp, every remaining event in
 * that second was skipped. It also broke out of the loop entirely when a full page shared one
 * timestamp, abandoning the rest of the batch. Both are silent truncation, the same defect class as
 * the `period_start_unix` cursor fixed in `getPoolHourDatas.ts`.
 *
 * That matters more than it used to. A position is now its net liquidity `L`, so a dropped burn
 * leaves a closed position credited for the rest of history, and a dropped mint can drive `L`
 * negative, deleting a real position in `getLiquidityPositionsAtTimestamp`.
 *
 * `id` is unique per entity in The Graph (mint/burn ids are `txHash#index`), which makes the order
 * total: no page boundary can straddle a duplicate key. Ordering by id rather than timestamp is
 * safe downstream — `getLiquidityPositionsAtTimestamp` filters on timestamp and sums deltas, and
 * both are order-independent.
 *
 * `request` is injectable so the pagination loop is testable without a subgraph.
 */
export async function fetchLiquidityEventsForBatch(
  entity: "mints" | "burns",
  url: string,
  tokenPairs: Token0Token1[],
  request: SubgraphRequest = subgraphRequest,
): Promise<LiquidityEvent[]> {
  const orFilter = tokenPairs
    .map((tokenPair) => `{token0: "${tokenPair.token0}", token1: "${tokenPair.token1}"}`)
    .join(",");
  const allEvents: LiquidityEvent[] = [];
  let lastId: string | undefined;
  while (true) {
    const query = `{
          ${entity}(first: ${PAGE_SIZE}, orderBy: id, orderDirection: asc, where:
            {
              and: [
                { or: [${orFilter}] }${lastId ? `,{id_gt: "${lastId}"}` : ""}
              ]
            }) {
            id
            pool { id }
            token0 { id symbol }
            token1 { id symbol }
            amount
            amount0
            amount1
            tickLower
            tickUpper
            timestamp
            origin
          }
        }`;
    const json = await request(url, query);
    const events: LiquidityEvent[] = json?.data?.[entity] ?? [];
    // Stop on an empty page only. A short page is not evidence of the end — the gateway can cap a
    // response independently of `first` — and breaking on one would reintroduce the same silent
    // truncation this replaces. The cost is one extra request per batch.
    if (events.length === 0) {
      break;
    }
    for (const event of events) {
      allEvents.push(event);
    }
    lastId = events[events.length - 1]?.id;
    if (!lastId) {
      break; // a page without ids cannot advance the cursor; stop rather than refetch it forever
    }
  }
  return allEvents;
}

async function fetchLiquidityEvents(
  entity: "mints" | "burns",
  chainId: SupportedChain,
  tokenPairs: Token0Token1[],
): Promise<LiquidityEvent[]> {
  const url = getLiquiditySubgraphUrl(chainId);
  const type = entity === "mints" ? "mint" : "burn";
  const limit = pLimit(SUBGRAPH_CONCURRENCY);
  const batches = chunkArray(tokenPairs, PAIR_BATCH_SIZE);
  const results = await Promise.all(
    batches.map((batch) => limit(() => fetchLiquidityEventsForBatch(entity, url, batch))),
  );
  return results.flat().map((event) => ({ ...event, type }));
}

export async function getAllLiquidityEvents(
  chainId: SupportedChain,
  tokenPairs: {
    tokenId: Address;
    parentTokenId?: Address;
    collateralToken: Address;
  }[],
) {
  // Canonicalize (token0/token1) and dedupe: each outcome token has a single pool with its
  // collateral, but conditional markets can repeat collaterals, so drop duplicate pools.
  const seen = new Set<string>();
  const sortedTokenPairs: Token0Token1[] = [];
  for (const { tokenId, parentTokenId, collateralToken } of tokenPairs) {
    const collateral = (parentTokenId ?? collateralToken).toLocaleLowerCase();
    const pair = getToken0Token1(tokenId, collateral as Address);
    const key = `${pair.token0}-${pair.token1}`;
    if (seen.has(key)) continue;
    seen.add(key);
    sortedTokenPairs.push(pair);
  }
  const [mints, burns] = await Promise.all([
    fetchLiquidityEvents("mints", chainId, sortedTokenPairs),
    fetchLiquidityEvents("burns", chainId, sortedTokenPairs),
  ]);
  return mints.concat(burns);
}

/**
 * Every AMM pool address seen in this chain's liquidity events, lowercased.
 *
 * Pool contracts hold the outcome tokens backing every LP position, so they appear in
 * `tokens_transfers` as ordinary holders with large balances. They must not be credited as direct
 * holders: the caller already credits those same reserves to the LPs as `indirectHolding`, so
 * counting the pool as well counts the reserves twice and allocates a share of the emission to a
 * contract that can never claim it. See the exclusion in `computeDailyAirdrop.ts`.
 *
 * Every pool that can hold reserves has minted liquidity at least once, so mint/burn events are a
 * complete source on their own; the caller unions this with `dex_pool_hour_prices.pool_id` anyway.
 */
export function getPoolAddresses(events: LiquidityEvent[]): Set<string> {
  const addresses = new Set<string>();
  for (const event of events) {
    const poolId = event.pool?.id;
    if (poolId) {
      addresses.add(poolId.toLowerCase());
    }
  }
  return addresses;
}

/** A concentrated-liquidity position: one (owner, pool, tick range) with its net liquidity. */
export interface LiquidityPosition {
  origin: string;
  token0: string;
  token1: string;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
}

/**
 * Net liquidity per (origin, pool, tick range) as of `timestamp`.
 *
 * This replaces a model that netted the `amount0`/`amount1` recorded on mint and burn events. Those
 * amounts describe the position's composition at the moments it was opened and closed, and in a
 * concentrated-liquidity AMM that composition changes continuously as the price moves through the
 * range — a position whose price left its range may hold no outcome tokens at all while still being
 * credited the full amount deposited. Liquidity (L) is the invariant; the caller converts it to
 * token amounts at the snapshot price via `getAmountsForLiquidity`.
 *
 * Attribution stays on `origin` (the EOA that sent the transaction), which is a known
 * approximation: credit does not follow the position NFT if it is transferred or sold. The events'
 * `owner` field is not a better choice — for NFT-managed positions it resolves to the position
 * manager contract, not a person. Following transfers would mean replaying the NFT's own Transfer
 * history, which is out of scope; the error is far smaller than the valuation one this fixes.
 */
export function getLiquidityPositionsAtTimestamp(events: LiquidityEvent[], timestamp: number): LiquidityPosition[] {
  const positions = new Map<string, LiquidityPosition>();

  for (const event of events) {
    if (Number(event.timestamp) > timestamp || event.origin === zeroAddress) {
      continue;
    }
    const key = `${event.token0.id}-${event.token1.id}-${event.tickLower}-${event.tickUpper}-${event.origin}`;
    let position = positions.get(key);
    if (!position) {
      position = {
        origin: event.origin,
        token0: event.token0.id,
        token1: event.token1.id,
        tickLower: Number(event.tickLower),
        tickUpper: Number(event.tickUpper),
        liquidity: 0n,
      };
      positions.set(key, position);
    }
    const delta = BigInt(event.amount ?? 0);
    position.liquidity += event.type === "mint" ? delta : -delta;
  }

  // A closed position nets to zero; a burn seen without its mint can go negative. Neither holds
  // anything, and a negative would produce a negative valuation.
  return Array.from(positions.values()).filter((position) => position.liquidity > 0n);
}

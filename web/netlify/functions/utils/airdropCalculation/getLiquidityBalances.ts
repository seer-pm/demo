import type { SupportedChain } from "@seer-pm/sdk";
import { isOpStack } from "@seer-pm/sdk/chains";
import { getToken0Token1 } from "@seer-pm/sdk/market-pools";
import type { Token0Token1 } from "@seer-pm/sdk/market-pools";
import { getSubgraphUrl } from "@seer-pm/sdk/subgraph";
import pLimit from "p-limit";
import { type Address, zeroAddress } from "viem";
import { mainnet } from "viem/chains";

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
async function subgraphRequest(url: string, query: string): Promise<any> {
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
}

export interface LiquidityEvent {
  id: string;
  token0: {
    id: string;
    symbol: string;
  };
  token1: {
    id: string;
    symbol: string;
  };
  amount0: string;
  amount1: string;
  timestamp: string;
  origin: string;
  type: string;
}

// Fetches all events of one entity ("mints" | "burns") for a single batch of token pairs,
// paginating by timestamp.
async function fetchLiquidityEventsForBatch(
  entity: "mints" | "burns",
  url: string,
  tokenPairs: Token0Token1[],
): Promise<LiquidityEvent[]> {
  const orFilter = tokenPairs
    .map((tokenPair) => `{token0: "${tokenPair.token0}", token1: "${tokenPair.token1}"}`)
    .join(",");
  let allEvents: LiquidityEvent[] = [];
  let currentTimestamp: string | undefined;
  while (true) {
    const query = `{
          ${entity}(first: ${PAGE_SIZE}, orderBy: timestamp, orderDirection: asc, where:
            {
              and: [
                { or: [${orFilter}] }${currentTimestamp ? `,{timestamp_gt: "${currentTimestamp}"}` : ""}
              ]
            }) {
            id
            token0 { id symbol }
            token1 { id symbol }
            amount0
            amount1
            timestamp
            origin
          }
        }`;
    const json = await subgraphRequest(url, query);
    const events: LiquidityEvent[] = json?.data?.[entity] ?? [];
    allEvents = allEvents.concat(events);
    if (events.length < PAGE_SIZE) {
      break; // fetched all for this batch
    }
    if (events[events.length - 1]?.timestamp === currentTimestamp) {
      break;
    }
    currentTimestamp = events[events.length - 1]?.timestamp;
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

export function getLiquidityBalancesAtTimestamp(events: LiquidityEvent[], timestamp: number) {
  const records = events.filter((event) => Number(event.timestamp) <= timestamp);
  const tokenBalances: { [key: string]: { [key: string]: number } } = {};

  // Process each event
  for (const event of records) {
    const { token0, token1, amount0, amount1, origin } = event;
    // Initialize token balances if not exists
    if (!tokenBalances[origin]) {
      tokenBalances[origin] = {};
    }

    if (event.type === "mint") {
      tokenBalances[origin][token0.id] = (tokenBalances[origin][token0.id] || 0) + Number(amount0);
      tokenBalances[origin][token1.id] = (tokenBalances[origin][token1.id] || 0) + Number(amount1);
    } else {
      tokenBalances[origin][token0.id] = (tokenBalances[origin][token0.id] || 0) - Number(amount0);
      tokenBalances[origin][token1.id] = (tokenBalances[origin][token1.id] || 0) - Number(amount1);
    }
  }

  const formattedBalances: { [key: string]: { [key: string]: number } } = {};
  for (const [user, balances] of Object.entries(tokenBalances)) {
    // Exclude zero address and non-positive balances
    if (user !== zeroAddress) {
      formattedBalances[user] = {};
      for (const [tokenId, balance] of Object.entries(balances)) {
        if (balance > 0) {
          formattedBalances[user][tokenId] = balance;
        }
      }
    }
  }
  return formattedBalances;
}

import type { SupportedChain } from "@seer-pm/sdk";
import { type Address, getAddress } from "viem";
import { getPublicClientByChainId } from "./config";
import {
  TRADE_EXECUTOR_CHAIN_IDS,
  type TradeExecutorChainConfig,
  getTradeExecutorConfig,
  predictedExecutorsForOwner,
} from "./tradeExecutorOwnersCore";

/**
 * The set of wallets a portfolio request is really about: the requested account plus the
 * TradeExecutor contracts it owns.
 *
 * A user trading through a TradeExecutor holds the outcome tokens IN the executor, and the DEX
 * indexes the swap with the executor as `recipient`. Querying the owner EOA alone therefore returns
 * only what the EOA did with its own hands — the reason a wallet can read 84 traded markets on the
 * leaderboard, which rolls executors up, and 4 rows in its portfolio history, which does not.
 *
 * Derivation is CREATE2 prediction plus a `getCode`, not the `key_value` owner map the P&L job
 * maintains:
 *
 * - `resolveOwnerMap` is a *writer*. On a stale record it read-modify-writes the whole map under one
 *   key, so putting it behind a user-facing GET means two Supabase round trips before the first
 *   indexer query and concurrent page views racing the refresh job last-write-wins.
 * - `readOwnerMap` only knows owners the P&L candidate scan has reached. The airdrop accepts that —
 *   it hands 70k holders to a probe and a miss self-corrects on a later run — but here a miss *is*
 *   the bug: someone opens their own portfolio, sees 4 rows, and it never self-corrects for them.
 * - Prediction is complete and needs neither. The candidate set is fixed at 3 addresses (2 Optimism
 *   bytecodes, 1 Gnosis), independent of the account, and `salt = keccak256("TradeExecutorV1" ‖
 *   owner)` with the owner in the constructor args means code at the predicted slot *is* that
 *   owner's executor by construction — no `owner()` call needed to confirm it.
 *
 * Discovery is best-effort and never throws: any failure degrades to `wallets = [account]`, which is
 * exactly the behaviour before executors were merged in. Callers must extend that contract to their
 * own fan-out — a failed query for an executor wallet may degrade the merged view, but it must not
 * fail the response, and it must suppress the cache write so a partial result is not frozen.
 */
export type PortfolioIdentity = {
  /** The requested account, lowercased. */
  account: Address;
  /** `account` first, then every deployed executor. Deduped, stable order. */
  wallets: Address[];
  /** `account` plus only the executors deployed on that chain. */
  walletsForChain: (chainId: SupportedChain) => Address[];
  /** True for a wallet in the set that is not the requested account. */
  isExecutor: (address: string) => boolean;
  /**
   * False when a probe failed, i.e. the set may be missing an executor that does exist.
   *
   * Exposed because "this owner has no executors" and "we could not find out" have to be cached
   * differently: the memo below already refuses to hold an incomplete answer for five minutes, and a
   * caller that then writes it to a blob or hands it to the CDN reinstates that freeze one layer out.
   */
  complete: boolean;
};

const IDENTITY_CACHE_TTL_MS = 5 * 60 * 1000;
const IDENTITY_CACHE_MAX_SIZE = 256;

type CacheEntry = { promise: Promise<PortfolioIdentity>; expiresAt: number };

const identityCache = new Map<string, CacheEntry>();

function evictExpiredAndOldest(now: number): void {
  for (const [key, entry] of identityCache) {
    if (entry.expiresAt <= now) identityCache.delete(key);
  }
  while (identityCache.size >= IDENTITY_CACHE_MAX_SIZE) {
    const oldest = identityCache.keys().next().value;
    if (oldest === undefined) break;
    identityCache.delete(oldest);
  }
}

/**
 * Predicted executors of `owner` on this chain that actually have bytecode.
 *
 * A failed probe is not the same answer as an empty account, and the difference matters: swallowing
 * it would turn a transient RPC outage into a confident "this owner has no executors", which the
 * caller would then cache. Failures are counted and reported rather than folded into the result.
 */
async function deployedExecutors(
  owner: Address,
  chainId: number,
  config: TradeExecutorChainConfig,
): Promise<{ executors: Address[]; failures: number }> {
  const client = getPublicClientByChainId(chainId);
  const candidates = predictedExecutorsForOwner(owner, config) as Address[];
  const results = await Promise.all(
    candidates.map(async (executor) => {
      try {
        const code = await client.getCode({ address: executor });
        return code && code !== "0x" ? executor : null;
      } catch (error) {
        // One dead candidate must not remove the executors this owner does have.
        console.warn("portfolioIdentity: getCode failed", { chainId, executor, error });
        return "failed" as const;
      }
    }),
  );
  return {
    executors: results.filter((result): result is Address => result !== null && result !== "failed"),
    failures: results.filter((result) => result === "failed").length,
  };
}

function buildIdentity(
  account: Address,
  executorsByChain: Map<number, Address[]>,
  complete: boolean,
): PortfolioIdentity {
  const executors = [...executorsByChain.values()].flat();
  const wallets = [...new Set([account, ...executors])];
  const executorSet = new Set(executors);
  return {
    account,
    wallets,
    walletsForChain: (chainId) => [account, ...(executorsByChain.get(chainId) ?? [])],
    isExecutor: (address) => executorSet.has(address.toLowerCase() as Address),
    complete,
  };
}

/** `identity.complete` is false when any probe failed, i.e. the set may be missing an executor. */
async function probeIdentity(account: Address): Promise<PortfolioIdentity> {
  const chains = TRADE_EXECUTOR_CHAIN_IDS.map((chainId) => ({
    chainId,
    config: getTradeExecutorConfig(chainId),
  })).filter((chain): chain is { chainId: number; config: TradeExecutorChainConfig } => chain.config !== undefined);

  const results = await Promise.allSettled(
    chains.map(({ chainId, config }) => deployedExecutors(account, chainId, config)),
  );

  const executorsByChain = new Map<number, Address[]>();
  let complete = true;
  results.forEach((result, index) => {
    const { chainId } = chains[index];
    if (result.status === "fulfilled") {
      if (result.value.executors.length > 0) executorsByChain.set(chainId, result.value.executors);
      if (result.value.failures > 0) complete = false;
    } else {
      complete = false;
      console.warn("portfolioIdentity: executor probe failed", { chainId, account, error: result.reason });
    }
  });

  return buildIdentity(account, executorsByChain, complete);
}

/**
 * The wallets to query for `account`. Memoized per process for 5 minutes: a single page view hits
 * four portfolio endpoints, and without the memo each would re-probe the same three addresses.
 *
 * Only a *complete* probe is cached. An incomplete one is still returned — a degraded portfolio
 * beats a failed one — but caching it would freeze a transient RPC outage into five minutes of
 * "this owner has no executors", which reads to the user as the very bug this exists to fix.
 */
export function resolvePortfolioIdentity(account: Address): Promise<PortfolioIdentity> {
  const accountLc = getAddress(account).toLowerCase() as Address;
  const now = Date.now();
  const existing = identityCache.get(accountLc);
  if (existing && existing.expiresAt > now) {
    return existing.promise;
  }
  identityCache.delete(accountLc);
  evictExpiredAndOldest(now);

  const promise = probeIdentity(accountLc)
    .catch((error) => {
      // Never fail a portfolio request because executor discovery did: fall back to the account
      // alone, which is what the endpoints did before executors were merged in.
      console.warn("portfolioIdentity: falling back to the account alone", { account: accountLc, error });
      return buildIdentity(accountLc, new Map(), false);
    })
    .then((identity) => {
      if (!identity.complete) identityCache.delete(accountLc);
      return identity;
    });

  identityCache.set(accountLc, {
    promise,
    expiresAt: now + IDENTITY_CACHE_TTL_MS,
  });
  return promise;
}

/** Test seam: the memo is process-wide, so a suite that probes twice must be able to reset it. */
export function clearPortfolioIdentityCache(): void {
  identityCache.clear();
}

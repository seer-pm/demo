import type { PortfolioPosition, SupportedChain } from "@seer-pm/sdk";
import type { Address } from "viem";
import { fetchLastActivityTimestampForWallets } from "./accountLastActivity";
import { buildCurrentPortfolioPositionsForWallets, repricePortfolioPositions } from "./buildPortfolioPositions";
import { type ActivityCachedPayload, isActivityCacheFresh, readJsonBlob, writeJsonBlob } from "./portfolioBlobCache";
import type { PortfolioIdentity } from "./portfolioIdentity";

const PORTFOLIO_POSITIONS_STORE = "portfolio-positions";

export type PositionsCachePayload = ActivityCachedPayload<{
  positions: PortfolioPosition[];
}>;

export type ResolvedChain = { chainId: SupportedChain; profileName: string };

export function filterPositionsByChain(positions: PortfolioPosition[], chainId: number | "all"): PortfolioPosition[] {
  if (chainId === "all") return positions;
  return positions.filter((position) => position.chainId === chainId);
}

async function computeAllChainPositions(
  identity: PortfolioIdentity,
  chains: ResolvedChain[],
): Promise<{ positions: PortfolioPosition[]; failures: number }> {
  const results = await Promise.allSettled(
    chains.map(({ chainId, profileName }) =>
      buildCurrentPortfolioPositionsForWallets(identity.walletsForChain(chainId), chainId, profileName),
    ),
  );

  const positions: PortfolioPosition[] = [];
  let failures = 0;
  for (const result of results) {
    if (result.status === "fulfilled") {
      positions.push(...result.value);
    } else {
      failures += 1;
      console.warn("portfolio positions: chain compute failed", result.reason);
    }
  }
  if (failures === results.length) {
    throw new Error("Failed to load portfolio positions on all chains");
  }
  return { positions, failures };
}

/**
 * The wallet's current positions, from the shared blob when it is still fresh.
 *
 * Shared by `get-portfolio` and `get-portfolio-value` because they are two views of one bag: the
 * page renders both at once, and computing them separately meant paying for every wallet's balances,
 * markets and LP positions twice per page load — and let the positions tab and the value card
 * disagree, since only one of them would see a mid-flight change.
 *
 * `:v4` marks the LP-aware payload: older blobs carry no `lpTokenBalance`, and freshness is a
 * timestamp comparison, so without the bump they read as fresh and serve LP-free rows for a further
 * TTL. `:v3` did the same for the conditional-pricing fix — older blobs held positions of markets
 * whose parent branch already lost, priced relative to the parent outcome as if that were collateral
 * — and `:v2` for the executor-merged payload format.
 *
 * The key suffix is the only version knob. Renaming the store instead would work once and then
 * orphan every blob in the old one: this module exposes no list or delete and Netlify Blobs have no
 * retention policy, so the abandoned store would count against site storage forever.
 */
export async function loadPortfolioPositions(args: {
  account: Address;
  profileName: string;
  identity: PortfolioIdentity;
  chains: ResolvedChain[];
  /** Applied before repricing, so a chain-scoped request does not pay to re-price the rest. */
  chainScope?: number | "all";
}): Promise<PortfolioPosition[]> {
  const { account, profileName, identity, chains, chainScope = "all" } = args;
  const cacheKey = `${account.toLowerCase()}:${profileName}:v4`;

  const [cached, lastActivityTs] = await Promise.all([
    readJsonBlob<PositionsCachePayload>(PORTFOLIO_POSITIONS_STORE, cacheKey),
    // Caught here rather than around the `Promise.all`: the probe fans out over the wallet set and
    // its own `Promise.all` rejects if any single wallet's indexer query does, and a rejection
    // reaching the outer await would fail the request while discarding the blob read beside it.
    fetchLastActivityTimestampForWallets(identity.wallets).then(
      (ts): number | undefined => ts,
      (error): number | undefined => {
        console.warn("portfolio positions: last activity lookup failed", error);
        return undefined;
      },
    ),
  ]);

  // With the probe down, judge the blob against its own stored timestamp: serving a slightly stale
  // portfolio beats recomputing every wallet on every request for the length of an indexer outage.
  const activityTsForFreshness = lastActivityTs ?? cached?.lastActivityTs;
  if (
    activityTsForFreshness !== undefined &&
    isActivityCacheFresh(cached, activityTsForFreshness) &&
    Array.isArray(cached.positions)
  ) {
    return repricePortfolioPositions(filterPositionsByChain(cached.positions, chainScope));
  }

  const computed = await computeAllChainPositions(identity, chains);
  // `identity.complete` because a degraded identity has no executor wallets left to fail: every
  // chain succeeds over the reduced set, `failures` is 0, and the executor-free payload would be
  // frozen for the full TTL — the partial result the identity contract says not to freeze.
  if (computed.failures === 0 && identity.complete && lastActivityTs !== undefined) {
    await writeJsonBlob(PORTFOLIO_POSITIONS_STORE, cacheKey, {
      cachedAt: Date.now(),
      lastActivityTs,
      positions: computed.positions,
    } satisfies PositionsCachePayload);
  }
  return filterPositionsByChain(computed.positions, chainScope);
}

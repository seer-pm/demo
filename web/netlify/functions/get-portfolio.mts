import type { PortfolioPosition, SupportedChain } from "@seer-pm/sdk";
import { DEFAULT_COLLATERAL_PROFILE } from "@seer-pm/sdk/collateral";
import { type Address, isAddress } from "viem";
import { fetchLastActivityTimestampForWallets, supportedChainIds } from "./utils/accountLastActivity";
import { buildCurrentPortfolioPositionsForWallets, repricePortfolioPositions } from "./utils/buildPortfolioPositions";
import { parseChainIdQueryParam } from "./utils/parseChainIdParam";
import {
  type ActivityCachedPayload,
  isActivityCacheFresh,
  readJsonBlob,
  writeJsonBlob,
} from "./utils/portfolioBlobCache";
import { type PortfolioIdentity, resolvePortfolioIdentity } from "./utils/portfolioIdentity";
import { parseCollateralProfileQueryParam } from "./utils/resolveCollateralParam";

const PORTFOLIO_POSITIONS_STORE = "portfolio-positions";

type PositionsCachePayload = ActivityCachedPayload<{ positions: PortfolioPosition[] }>;

type ResolvedChain = { chainId: SupportedChain; profileName: string };

function jsonError(error: string, status: number) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonOk(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function filterPositionsByChain(positions: PortfolioPosition[], chainId: number | "all"): PortfolioPosition[] {
  if (chainId === "all") return positions;
  return positions.filter((p) => p.chainId === chainId);
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
      console.warn("get-portfolio: chain compute failed", result.reason);
    }
  }
  if (failures === results.length) {
    throw new Error("Failed to load portfolio positions on all chains");
  }
  return { positions, failures };
}

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const accountParam = url.searchParams.get("account");
    if (!accountParam || !isAddress(accountParam)) {
      return jsonError("Account parameter is required", 400);
    }
    const account = accountParam as Address;

    const chainParsed = parseChainIdQueryParam(url.searchParams.get("chainId") ?? "all", { allowAll: true });
    if ("error" in chainParsed) {
      return jsonError(chainParsed.error, 400);
    }

    const profileParam = url.searchParams.get("collateralProfile");
    const profileName = profileParam?.trim() || DEFAULT_COLLATERAL_PROFILE;
    const resolvedChains: ResolvedChain[] = [];
    let firstProfileError: string | undefined;
    for (const chainId of supportedChainIds()) {
      const collateralResolved = parseCollateralProfileQueryParam(chainId, profileParam);
      if ("error" in collateralResolved) {
        firstProfileError ??= collateralResolved.error;
        console.warn(`get-portfolio: skip chain ${chainId}: ${collateralResolved.error}`);
        continue;
      }
      resolvedChains.push({ chainId, profileName: collateralResolved.profileName });
    }
    if (resolvedChains.length === 0) {
      return jsonError(firstProfileError ?? "Invalid collateral profile", 400);
    }

    // `:v3` marks the conditional-pricing fix. Older blobs hold positions of markets whose parent
    // branch already lost, priced relative to the parent outcome as if that were collateral, and
    // freshness is a timestamp comparison — so without this they read as fresh and serve the
    // pre-fix view for a further TTL. `:v2` did the same for the executor-merged payload format.
    const cacheKey = `${account.toLowerCase()}:${profileName}:v3`;

    // Resolved first: freshness has to cover the executors too, or a wallet that only trades through
    // one never invalidates its own cache. The probe is memoized, so this is usually free.
    const identity = await resolvePortfolioIdentity(account);
    const [cached, lastActivityTs] = await Promise.all([
      readJsonBlob<PositionsCachePayload>(PORTFOLIO_POSITIONS_STORE, cacheKey),
      // Caught here rather than around the `Promise.all`: the probe now fans out over the wallet set
      // and its own `Promise.all` rejects if any single wallet's indexer query does, and a rejection
      // reaching the outer await would 500 the request while discarding the blob read beside it.
      fetchLastActivityTimestampForWallets(identity.wallets).then(
        (ts): number | undefined => ts,
        (error): number | undefined => {
          console.warn("get-portfolio: last activity lookup failed", error);
          return undefined;
        },
      ),
    ]);

    // With the probe down, judge the blob against its own stored timestamp: serving a slightly stale
    // portfolio beats recomputing every wallet on every request for the length of an indexer outage.
    const activityTsForFreshness = lastActivityTs ?? cached?.lastActivityTs;
    let positions: PortfolioPosition[];
    if (
      activityTsForFreshness !== undefined &&
      isActivityCacheFresh(cached, activityTsForFreshness) &&
      Array.isArray(cached.positions)
    ) {
      positions = await repricePortfolioPositions(filterPositionsByChain(cached.positions, chainParsed.chainId));
    } else {
      const computed = await computeAllChainPositions(identity, resolvedChains);
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
      positions = filterPositionsByChain(computed.positions, chainParsed.chainId);
    }

    return jsonOk(positions);
  } catch (e) {
    console.log(e);
    return jsonError((e as Error).message || "Internal server error", 500);
  }
};

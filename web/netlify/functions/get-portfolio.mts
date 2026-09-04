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

    const cacheKey = `${account.toLowerCase()}:${profileName}`;

    // Resolved first: freshness has to cover the executors too, or a wallet that only trades through
    // one never invalidates its own cache. The probe is memoized, so this is usually free.
    const identity = await resolvePortfolioIdentity(account);
    const [cached, lastActivityTs] = await Promise.all([
      readJsonBlob<PositionsCachePayload>(PORTFOLIO_POSITIONS_STORE, cacheKey),
      fetchLastActivityTimestampForWallets(identity.wallets),
    ]);

    let positions: PortfolioPosition[];
    if (isActivityCacheFresh(cached, lastActivityTs) && Array.isArray(cached.positions)) {
      positions = await repricePortfolioPositions(filterPositionsByChain(cached.positions, chainParsed.chainId));
    } else {
      const computed = await computeAllChainPositions(identity, resolvedChains);
      if (computed.failures === 0) {
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

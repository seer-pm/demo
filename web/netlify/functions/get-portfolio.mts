import { DEFAULT_COLLATERAL_PROFILE, type PortfolioPosition } from "@seer-pm/sdk";
import { createClient } from "@supabase/supabase-js";
import { type Address, isAddress } from "viem";
import { fetchLastActivityTimestamp, supportedChainIds } from "./utils/accountLastActivity";
import { buildCurrentPortfolioPositions, repricePortfolioPositions } from "./utils/buildPortfolioPositions";
import { parseChainIdQueryParam } from "./utils/parseChainIdParam";
import {
  type ActivityCachedPayload,
  isActivityCacheFresh,
  readJsonBlob,
  writeJsonBlob,
} from "./utils/portfolioBlobCache";
import { parseCollateralProfileQueryParam } from "./utils/resolveCollateralParam";
import type { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const PORTFOLIO_POSITIONS_STORE = "portfolio-positions";

type PositionsCachePayload = ActivityCachedPayload<{ positions: PortfolioPosition[] }>;

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

async function computeAllChainPositions(account: Address, profileParam: string | null): Promise<PortfolioPosition[]> {
  const results = await Promise.allSettled(
    supportedChainIds().map(async (chainId) => {
      const collateralResolved = parseCollateralProfileQueryParam(chainId, profileParam);
      if ("error" in collateralResolved) {
        console.warn(`get-portfolio: skip chain ${chainId}: ${collateralResolved.error}`);
        return [] as PortfolioPosition[];
      }
      return buildCurrentPortfolioPositions(supabase, account, chainId, collateralResolved.profileName);
    }),
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
  return positions;
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
    const chainIds = supportedChainIds();
    const resolvableChains = chainIds.filter((id) => !("error" in parseCollateralProfileQueryParam(id, profileParam)));
    if (resolvableChains.length === 0) {
      const first = parseCollateralProfileQueryParam(chainIds[0], profileParam);
      return jsonError("error" in first ? first.error : "Invalid collateral profile", 400);
    }

    const cacheKey = `${account.toLowerCase()}:${profileName}`;

    const [cached, lastActivityTs] = await Promise.all([
      readJsonBlob<PositionsCachePayload>(PORTFOLIO_POSITIONS_STORE, cacheKey),
      fetchLastActivityTimestamp(account),
    ]);

    let positions: PortfolioPosition[];
    if (isActivityCacheFresh(cached, lastActivityTs) && Array.isArray(cached.positions)) {
      positions = await repricePortfolioPositions(
        supabase,
        filterPositionsByChain(cached.positions, chainParsed.chainId),
      );
    } else {
      positions = await computeAllChainPositions(account, profileParam);
      await writeJsonBlob(PORTFOLIO_POSITIONS_STORE, cacheKey, {
        cachedAt: Date.now(),
        lastActivityTs,
        positions,
      } satisfies PositionsCachePayload);
      positions = filterPositionsByChain(positions, chainParsed.chainId);
    }

    return jsonOk(positions);
  } catch (e) {
    console.log(e);
    return jsonError((e as Error).message || "Internal server error", 500);
  }
};

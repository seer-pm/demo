import { DEFAULT_COLLATERAL_PROFILE } from "@seer-pm/sdk/collateral";
import { type Address, isAddress } from "viem";
import { supportedChainIds } from "./utils/accountLastActivity";
import { parseChainIdQueryParam } from "./utils/parseChainIdParam";
import { resolvePortfolioIdentity } from "./utils/portfolioIdentity";
import { type ResolvedChain, loadPortfolioPositions } from "./utils/portfolioPositionsCache";
import { parseCollateralProfileQueryParam } from "./utils/resolveCollateralParam";

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
      resolvedChains.push({
        chainId,
        profileName: collateralResolved.profileName,
      });
    }
    if (resolvedChains.length === 0) {
      return jsonError(firstProfileError ?? "Invalid collateral profile", 400);
    }

    // Resolved first: freshness has to cover the executors too, or a wallet that only trades through
    // one never invalidates its own cache. The probe is memoized, so this is usually free.
    const identity = await resolvePortfolioIdentity(account);
    const positions = await loadPortfolioPositions({
      account,
      profileName,
      identity,
      chains: resolvedChains,
      chainScope: chainParsed.chainId,
    });

    // Hidden here and not in the builder: the rows still have to exist for `get-portfolio-pl`,
    // which reconstructs each window's opening positions from the current ones. The blob keeps them
    // too, so a cache hit can re-derive the flag when a parent settles mid-TTL.
    return jsonOk(positions.filter((position) => !position.isWorthless));
  } catch (e) {
    console.log(e);
    return jsonError((e as Error).message || "Internal server error", 500);
  }
};

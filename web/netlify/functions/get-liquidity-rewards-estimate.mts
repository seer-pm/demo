import { PAYOUT_CHAINS, type RewardsEstimate } from "@seer-pm/rewards/claims";
import { getAddress, isAddress } from "viem";
import { readJsonBlob } from "./utils/portfolioBlobCache.ts";

/** Netlify Blobs store `rewards-estimate-background` writes one estimate per payout chain to. */
export const REWARDS_ESTIMATE_STORE = "liquidity-rewards-estimate";

const json = (body: unknown, status: number, cache = "no-store") =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": cache },
  });

/**
 * Each payout chain's latest rewards estimate, written every 2 hours by
 * `rewards-estimate-background`, with what every campaign emitted. `?account=0x…` keeps only that
 * account's amounts; without it the amounts are left out, for the admin page. A chain without an
 * estimate is left out.
 */
export default async (req: Request) => {
  const account = new URL(req.url).searchParams.get("account");
  if (account !== null && !isAddress(account)) {
    return json({ error: "account must be an address" }, 400);
  }
  // The estimate files key accounts by checksummed address.
  const key = account === null ? undefined : getAddress(account);
  const estimates = await Promise.all(
    Object.keys(PAYOUT_CHAINS).map((chainId) => readJsonBlob<RewardsEstimate>(REWARDS_ESTIMATE_STORE, chainId)),
  );
  const body: RewardsEstimate[] = estimates.flatMap((estimate) =>
    estimate ? [{ ...estimate, claims: key && estimate.claims[key] ? { [key]: estimate.claims[key] } : {} }] : [],
  );
  return json(body, 200, "public, max-age=60");
};

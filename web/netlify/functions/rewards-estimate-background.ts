import { PAYOUT_CHAINS, estimateRewards } from "@seer-pm/rewards";
import { REWARDS_ESTIMATE_STORE } from "./get-liquidity-rewards-estimate.mts";
import { requireBackgroundSecret } from "./utils/backgroundAuth.ts";
import { getPublicClientByChainId } from "./utils/config.ts";
import { writeJsonBlob } from "./utils/portfolioBlobCache.ts";

/**
 * Liquidity rewards earned up to the latest block on every payout chain, for the portfolio's
 * Rewards tab (`get-liquidity-rewards-estimate`). Read-only: it never touches a distributor or a
 * registry. A failed chain keeps its last stored estimate, which carries its own `asOf`.
 */
export default async (req: Request) => {
  const unauthorized = requireBackgroundSecret(req);
  if (unauthorized) return unauthorized;

  for (const payoutChainId of Object.keys(PAYOUT_CHAINS).map(Number)) {
    try {
      const estimate = await estimateRewards({
        payoutChainId,
        payoutClient: getPublicClientByChainId(payoutChainId),
        clientFor: getPublicClientByChainId,
      });
      if (!estimate) {
        console.log(`rewards-estimate: chain ${payoutChainId}: no campaigns yet`);
        continue;
      }
      await writeJsonBlob(REWARDS_ESTIMATE_STORE, String(payoutChainId), estimate);
      console.log(
        `rewards-estimate: chain ${payoutChainId}: ${Object.keys(estimate.claims).length} accounts as of ${estimate.asOf}`,
      );
    } catch (e) {
      console.error(`rewards-estimate: chain ${payoutChainId}:`, e);
    }
  }
};

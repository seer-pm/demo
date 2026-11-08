import { syncDistributor } from "@seer-pm/rewards";
import campaignsFile from "@seer-pm/rewards/campaigns.json";
import type { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { requireBackgroundSecret } from "./utils/backgroundAuth.ts";
import { getPublicClientByChainId, getWalletClientForNetwork } from "./utils/config.ts";

/**
 * Weekly liquidity rewards for the V4 pools (`packages/seer-pm-rewards`): on every payout chain
 * with a distributor, accepts the pending root once its timelock is over and submits the root of
 * the week that just settled. `REWARDS_UPDATER_PRIVATE_KEY` is a hot wallet set as root updater on
 * the distributors; it can propose and revoke roots but not skip the timelock.
 */
export default async (req: Request) => {
  const unauthorized = requireBackgroundSecret(req);
  if (unauthorized) return unauthorized;

  const privateKey = process.env.REWARDS_UPDATER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("rewards-distribution: REWARDS_UPDATER_PRIVATE_KEY is not configured");
    return;
  }
  const account = privateKeyToAccount((privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Hex);

  const rawCampaigns: { payoutChainId: number }[] = campaignsFile.campaigns;
  for (const payoutChainId of new Set(rawCampaigns.map((c) => c.payoutChainId))) {
    try {
      const status = await syncDistributor({
        payoutChainId,
        rawCampaigns,
        payoutClient: getPublicClientByChainId(payoutChainId),
        wallet: getWalletClientForNetwork(account, payoutChainId),
        clientFor: getPublicClientByChainId,
      });
      console.log(`rewards-distribution: chain ${payoutChainId}: ${status}`);
    } catch (e) {
      console.error(`rewards-distribution: chain ${payoutChainId}:`, e);
    }
  }
};

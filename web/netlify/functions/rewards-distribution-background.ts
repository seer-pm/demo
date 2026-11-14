import { PAYOUT_CHAINS, syncDistributor } from "@seer-pm/rewards";
import type { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { requireBackgroundSecret } from "./utils/backgroundAuth.ts";
import { getPublicClientByChainId, getWalletClientForNetwork } from "./utils/config.ts";

/**
 * Weekly liquidity rewards for the V4 pools (`packages/seer-pm-rewards`): on every payout chain
 * with a distributor and a campaign registry, accepts the pending root once its timelock is over,
 * releases what the campaigns emitted and submits the root of the week that just settled.
 * `REWARDS_UPDATER_PRIVATE_KEY` is a hot wallet set as root updater on the distributors and as
 * releaser on the registries; it can propose and revoke roots but not skip the timelock, and can only
 * move escrowed budgets to the distributor, never beyond each campaign's deposit.
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

  for (const payoutChainId of Object.keys(PAYOUT_CHAINS).map(Number)) {
    try {
      const status = await syncDistributor({
        payoutChainId,
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

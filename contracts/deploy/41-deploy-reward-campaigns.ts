import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { getAddress, isAddress, zeroAddress } from "viem";

const DEPLOYMENT_NAME = "RewardCampaigns";

/**
 * Deploys the `RewardCampaigns` registry of a chain with Seer V4 pools, next to its Universal Rewards Distributor
 * (`40-deploy-rewards-distributor.ts`). It holds the campaigns of the chain's pools, which pay out on the same
 * chain, and escrows their budgets;
 * `/admin/rewards` writes it and the weekly V4 rewards bot (`packages/seer-pm-rewards`) reads it and releases
 * what each campaign emitted to the distributor.
 *
 * - `REWARD_CAMPAIGNS_OWNER` (required): appoints managers and the releaser, usually a Safe.
 *   It has no default, so a full deploy never leaves the registry owned by whichever key ran it; that run skips it.
 * - `REWARD_CAMPAIGNS_MANAGERS`: comma-separated accounts that create, fund and update campaigns.
 * - `REWARD_CAMPAIGNS_RELEASER`: the bot's wallet (`REWARDS_UPDATER_PRIVATE_KEY`), the same as `URD_ROOT_UPDATER`.
 *
 * An existing deployment on the network is kept; delete `deployments/<network>/RewardCampaigns.json` to deploy
 * a new one. A new registry restarts campaign ids at 0, which collide with the ids of the published weeks, so
 * only redeploy before the chain's first week is published.
 */
const deployRewardCampaigns: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
	const { deployments, getNamedAccounts, getChainId } = hre;
	const chainId = Number(await getChainId());
	const distributor = await deployments.getOrNull("UniversalRewardsDistributor");
	if (!distributor) {
		console.log("skipping %s: no UniversalRewardsDistributor on chain %s", DEPLOYMENT_NAME, chainId);
		return;
	}

	const readAddress = (name: string) => {
		const value = process.env[name]?.trim();
		if (!value) return undefined;
		if (!isAddress(value)) throw new Error(`${name} is not an address: ${value}`);
		return getAddress(value);
	};
	const owner = readAddress("REWARD_CAMPAIGNS_OWNER");
	if (!owner) {
		console.log("skipping %s: set REWARD_CAMPAIGNS_OWNER to the address that will own it", DEPLOYMENT_NAME);
		return;
	}
	const managers = (process.env.REWARD_CAMPAIGNS_MANAGERS ?? "")
		.split(",")
		.map((value) => value.trim())
		.filter(Boolean)
		.map((value) => {
			if (!isAddress(value)) throw new Error(`REWARD_CAMPAIGNS_MANAGERS has a bad address: ${value}`);
			return getAddress(value);
		});
	const releaser = readAddress("REWARD_CAMPAIGNS_RELEASER") ?? zeroAddress;

	const deployer =
		(await getNamedAccounts()).deployer ?? (await hre.viem.getWalletClients())[0].account.address;
	const deployment = await deployments.deploy(DEPLOYMENT_NAME, {
		from: deployer,
		args: [distributor.address, owner, releaser, managers],
		log: true,
	});

	if (releaser === zeroAddress) {
		console.log("no REWARD_CAMPAIGNS_RELEASER: the owner must call setReleaser(<bot wallet>) before the first week");
	}
	console.log(
		'set PAYOUT_CHAINS[%s].registry in packages/seer-pm-rewards/src/chains.ts to { address: "%s", fromBlock: %sn }',
		chainId,
		deployment.address,
		String(deployment.receipt?.blockNumber),
	);
};

deployRewardCampaigns.tags = ["RewardCampaigns"];

export default deployRewardCampaigns;

import { randomBytes } from "node:crypto";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
	decodeEventLog,
	encodeFunctionData,
	getAddress,
	isAddress,
	parseAbi,
	toHex,
	zeroHash,
} from "viem";

// Morpho's UrdFactory v1.0.0 (https://docs.morpho.org/developers/contracts/addresses/). Creating
// the distributor through it deploys the exact bytecode Morpho verified and audited, so the explorers
// match it without a separate verification. Gnosis has no factory.
const URD_FACTORY: Record<number, `0x${string}`> = {
	1: "0x9baA51245CDD28D8D74Afe8B3959b616E9ee7c8D",
	10: "0xe41AEcB4570A7B68d15a4Fb0a03ACEe421A21498",
	8453: "0x7276454fc1cf9C408deeed722fd6b5E7A4CA25D8",
};

const urdFactoryAbi = parseAbi([
	"function createUrd(address initialOwner, uint256 initialTimelock, bytes32 initialRoot, bytes32 initialIpfsHash, bytes32 salt) returns (address urd)",
	"event UrdCreated(address indexed urd, address indexed caller, address indexed initialOwner, uint256 initialTimelock, bytes32 initialRoot, bytes32 initialIpfsHash, bytes32 salt)",
]);

// IUniversalRewardsDistributorStaticTyping and EventsLib of universal-rewards-distributor v1.0.0.
const urdAbi = parseAbi([
	"function root() view returns (bytes32)",
	"function owner() view returns (address)",
	"function timelock() view returns (uint256)",
	"function ipfsHash() view returns (bytes32)",
	"function isUpdater(address) view returns (bool)",
	"function claimed(address, address) view returns (uint256)",
	"function pendingRoot() view returns (bytes32 root, bytes32 ipfsHash, uint256 validAt)",
	"function acceptRoot()",
	"function setRoot(bytes32 newRoot, bytes32 newIpfsHash)",
	"function setTimelock(uint256 newTimelock)",
	"function setRootUpdater(address updater, bool active)",
	"function revokePendingRoot()",
	"function setOwner(address newOwner)",
	"function submitRoot(bytes32 newRoot, bytes32 ipfsHash)",
	"function claim(address account, address reward, uint256 claimable, bytes32[] proof) returns (uint256 amount)",
	"event RootSet(bytes32 indexed newRoot, bytes32 indexed newIpfsHash)",
	"event PendingRootSet(address indexed caller, bytes32 indexed newRoot, bytes32 indexed newIpfsHash)",
	"event PendingRootRevoked(address indexed caller)",
	"event TimelockSet(uint256 newTimelock)",
	"event RootUpdaterSet(address indexed rootUpdater, bool active)",
	"event Claimed(address indexed account, address indexed reward, uint256 amount)",
	"event OwnerSet(address indexed newOwner)",
]);

const DEPLOYMENT_NAME = "UniversalRewardsDistributor";

/**
 * Deploys the Morpho Universal Rewards Distributor that pays the weekly V4 liquidity rewards
 * (`packages/seer-pm-rewards`). Contract reference: https://docs.morpho.org/developers/contracts/rewards/
 * and the source at https://github.com/morpho-org/universal-rewards-distributor/tree/v1.0.0.
 *
 * Settings come from the environment:
 *
 * - `URD_OWNER` (required): revokes pending roots and manages updaters. It has no default, so a
 *   deploy never ends up owned by whichever key happened to run it.
 * - `URD_TIMELOCK`: seconds a submitted root waits before it can be accepted; 172800 (48 h) when unset.
 * - `URD_ROOT_UPDATER`: the bot's wallet (`REWARDS_UPDATER_PRIVATE_KEY`). The deployer creates the
 *   distributor as its own owner, enables the updater and then hands ownership to `URD_OWNER`, so
 *   the owner (usually a Safe) sends nothing. `setOwner` takes effect at once, with no acceptance
 *   step, so `URD_OWNER` must be right: the deployer has no control left after it.
 *
 * Each step checks the distributor's state first, so a run that stopped halfway finishes on the
 * next one. An existing deployment on the network is kept; delete
 * `deployments/<network>/UniversalRewardsDistributor.json` to deploy a new one.
 */
const deployRewardsDistributor: DeployFunction = async (
	hre: HardhatRuntimeEnvironment,
) => {
	const { deployments, getNamedAccounts, getChainId } = hre;

	const deployer = getAddress(
		(await getNamedAccounts()).deployer ??
			(await hre.viem.getWalletClients())[0].account.address,
	);
	const chainId = Number(await getChainId());
	const factory = URD_FACTORY[chainId];
	if (!factory) {
		console.log(
			"skipping %s: no Morpho UrdFactory on chain %s",
			DEPLOYMENT_NAME,
			chainId,
		);
		return;
	}

	const readAddress = (name: string) => {
		const value = process.env[name];
		if (value === undefined || value === "") return undefined;
		if (!isAddress(value))
			throw new Error(`${name} is not an address: ${value}`);
		return getAddress(value);
	};
	const owner = readAddress("URD_OWNER");
	if (!owner)
		throw new Error(
			"set URD_OWNER to the address that will own the distributor",
		);
	const updater = readAddress("URD_ROOT_UPDATER");
	const timelock = BigInt(process.env.URD_TIMELOCK || 172800);

	const publicClient = await hre.viem.getPublicClient();
	const wallet = await hre.viem.getWalletClient(deployer);

	// Public RPCs such as mainnet.optimism.io balance requests across nodes, and the one answering a
	// read right after a transaction may not have its block yet: it answers "0x" or an unknown block.
	// Reads therefore ask for the state at the last mined transaction's block, and retry until a node
	// that has it answers.
	let minedBlock: bigint | undefined;
	const read = async <T>(
		call: (blockNumber: bigint | undefined) => Promise<T>,
	): Promise<T> => {
		for (let attempt = 1; ; attempt++) {
			try {
				return await call(minedBlock);
			} catch (error) {
				if (attempt === 10) throw error;
				await new Promise((resolve) => setTimeout(resolve, 3000));
			}
		}
	};
	const send = async (
		address: `0x${string}`,
		call: "setRootUpdater" | "setOwner",
		args: readonly unknown[],
	) => {
		const hash = await wallet.writeContract({
			address,
			abi: urdAbi,
			functionName: call,
			args,
		} as Parameters<typeof wallet.writeContract>[0]);
		const receipt = await publicClient.waitForTransactionReceipt({ hash });
		if (receipt.status !== "success")
			throw new Error(`${call} reverted in ${hash}`);
		minedBlock = receipt.blockNumber;
	};

	let deployment = await deployments.getOrNull(DEPLOYMENT_NAME);
	if (deployment) {
		console.log(
			"%s already deployed at %s",
			DEPLOYMENT_NAME,
			deployment.address,
		);
	} else {
		// The deployer owns it first only when it has an updater to enable; otherwise `URD_OWNER` owns
		// it from the start and there is nothing to hand over.
		const initialOwner = updater ? deployer : owner;
		console.log(
			"deploying %s to chainId %s with deployer %s: owner %s, timelock %ss",
			DEPLOYMENT_NAME,
			chainId,
			deployer,
			owner,
			timelock.toString(),
		);

		// No initial root: the bot submits the first one, which goes through the timelock like every other.
		// The factory deploys with CREATE2, so a fixed salt gives two deploys with the same owner and
		// timelock the same address and the second one reverts; anyone could also take that address first.
		const salt = toHex(randomBytes(32));
		const createArgs = [
			initialOwner,
			timelock,
			zeroHash,
			zeroHash,
			salt,
		] as const;
		const transactionHash = await wallet.writeContract({
			address: factory,
			abi: urdFactoryAbi,
			functionName: "createUrd",
			args: createArgs,
		});
		const receipt = await publicClient.waitForTransactionReceipt({
			hash: transactionHash,
		});
		if (receipt.status !== "success")
			throw new Error(`createUrd reverted in ${transactionHash}`);
		minedBlock = receipt.blockNumber;
		const createdLog = receipt.logs.find(
			(log) => getAddress(log.address) === getAddress(factory),
		);
		if (!createdLog)
			throw new Error(`no UrdCreated event in ${transactionHash}`);
		const created = decodeEventLog({
			abi: urdFactoryAbi,
			eventName: "UrdCreated",
			...createdLog,
		});
		const createdAddress = getAddress(created.args.urd);

		// Saved before the owner steps, so a run that fails in them resumes on this distributor.
		await deployments.save(DEPLOYMENT_NAME, {
			address: createdAddress,
			abi: urdAbi as unknown as unknown[],
			transactionHash,
			receipt: {
				from: receipt.from,
				to: factory,
				contractAddress: createdAddress,
				transactionIndex: receipt.transactionIndex,
				gasUsed: receipt.gasUsed.toString(),
				logsBloom: receipt.logsBloom,
				blockHash: receipt.blockHash,
				transactionHash,
				logs: [],
				blockNumber: Number(receipt.blockNumber),
				cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
				status: 1,
				byzantium: true,
			},
			args: [...createArgs],
		});
		console.log(
			"%s deployed at %s in block %s",
			DEPLOYMENT_NAME,
			createdAddress,
			receipt.blockNumber.toString(),
		);

		const actualTimelock = await read((blockNumber) =>
			publicClient.readContract({
				address: createdAddress,
				abi: urdAbi,
				functionName: "timelock",
				blockNumber,
			}),
		);
		if (actualTimelock !== timelock)
			throw new Error(`${createdAddress} has timelock ${actualTimelock}`);
		deployment = await deployments.get(DEPLOYMENT_NAME);
	}
	const address = getAddress(deployment.address);
	const deployedInBlock = deployment.receipt?.blockNumber;
	const currentOwner = async () =>
		getAddress(
			await read((blockNumber) =>
				publicClient.readContract({
					address,
					abi: urdAbi,
					functionName: "owner",
					blockNumber,
				}),
			),
		);
	const isUpdater = (account: `0x${string}`) =>
		read((blockNumber) =>
			publicClient.readContract({
				address,
				abi: urdAbi,
				functionName: "isUpdater",
				args: [account],
				blockNumber,
			}),
		);

	if (updater && !(await isUpdater(updater))) {
		if ((await currentOwner()) === deployer) {
			await send(address, "setRootUpdater", [updater, true]);
			if (!(await isUpdater(updater))) {
				throw new Error(
					`${updater} is not an updater of ${address} after setRootUpdater`,
				);
			}
			console.log("enabled root updater %s", updater);
		} else {
			const data = encodeFunctionData({
				abi: urdAbi,
				functionName: "setRootUpdater",
				args: [updater, true],
			});
			console.log(
				"the owner %s must enable the root updater: send to %s the data %s",
				owner,
				address,
				data,
			);
		}
	}

	const ownerNow = await currentOwner();
	if (ownerNow !== owner) {
		if (ownerNow !== deployer)
			throw new Error(
				`${address} is owned by ${ownerNow}, not by ${owner} or the deployer`,
			);
		await send(address, "setOwner", [owner]);
		if ((await currentOwner()) !== owner)
			throw new Error(`${address} is not owned by ${owner} after setOwner`);
		console.log("transferred ownership to %s", owner);
	}

	console.log(
		'set PAYOUT_CHAINS[%s].distributor in packages/seer-pm-rewards/src/chains.ts to { address: "%s", fromBlock: %sn }',
		chainId,
		address,
		String(deployedInBlock),
	);
};

deployRewardsDistributor.tags = ["RewardsDistributor"];

export default deployRewardsDistributor;

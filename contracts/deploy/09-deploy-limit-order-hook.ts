import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { getAddress, Hex } from "viem";
import { POOL_MANAGER, encodeHookConstructorArgs, hasHookFlags, mineHookSalt } from "../scripts/hook-miner";

const LIMIT_ORDER_HOOK_FQN =
  "@openzeppelin/uniswap-hooks/src/general/LimitOrderHook.sol:LimitOrderHook";

const deployLimitOrderHook: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  const deployer =
    (await getNamedAccounts()).deployer ?? (await hre.viem.getWalletClients())[0].account.address;
  const chainId = Number(await getChainId());
  console.log("deploying LimitOrderHook to chainId %s with deployer %s", chainId, deployer);

  const poolManager = POOL_MANAGER[chainId];
  if (!poolManager) {
    console.log("skipping LimitOrderHook: Uni V4 PoolManager not configured for chain %s", chainId);
    return;
  }

  const artifact = await deployments.getArtifact(LIMIT_ORDER_HOOK_FQN);
  const creationCode = artifact.bytecode as Hex;
  const constructorArgs = encodeHookConstructorArgs(poolManager);

  const { hookAddress, salt } = mineHookSalt(creationCode, constructorArgs);
  console.log("mined hook address %s with salt %s", hookAddress, salt);

  const result = await deploy("LimitOrderHook", {
    from: deployer,
    contract: LIMIT_ORDER_HOOK_FQN,
    args: [poolManager],
    deterministicDeployment: salt,
    log: true,
  });

  if (getAddress(result.address) !== getAddress(hookAddress)) {
    throw new Error(
      `LimitOrderHook address mismatch: deployed ${result.address}, expected ${hookAddress}`,
    );
  }

  if (!hasHookFlags(result.address)) {
    throw new Error(`LimitOrderHook flags mismatch: ${result.address}`);
  }

  console.log("LimitOrderHook deployed at %s (newlyDeployed=%s)", result.address, result.newlyDeployed);
};

deployLimitOrderHook.tags = ["LimitOrderHook"];

export default deployLimitOrderHook;

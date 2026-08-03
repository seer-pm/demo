import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { getAddress, Hex, keccak256, encodeAbiParameters, pad, toHex, concatHex } from "viem";

/** Arachnid CREATE2 Deployer Proxy — same address on supported EVM chains. */
const CREATE2_DEPLOYER = "0x4e59b44847b379578588920cA78FbF26c0B4956C" as const;

/** AFTER_INITIALIZE (1<<12) | AFTER_SWAP (1<<6) */
const HOOK_FLAGS = 0x1040n;
const FLAG_MASK = 0x3fffn;
const MAX_LOOP = 160_444;

const POOL_MANAGER: Record<number, `0x${string}`> = {
  1: "0x000000000004444c5dc75cB358380D2e3dE08A90",
  10: "0x9a13f98cb987694c9f086b1f5eb990eea8264ec3",
  8453: "0x498581ff718922c3f8e6a244956af099b2652b2b",
};

const LIMIT_ORDER_HOOK_FQN =
  "@openzeppelin/uniswap-hooks/src/general/LimitOrderHook.sol:LimitOrderHook";

function computeCreate2Address(deployer: `0x${string}`, salt: Hex, initCodeHash: Hex): `0x${string}` {
  return getAddress(`0x${keccak256(concatHex(["0xff", deployer, salt, initCodeHash])).slice(-40)}`);
}

/** Mine a CREATE2 salt so the hook address encodes `HOOK_FLAGS` in its low 14 bits. */
function mineHookSalt(creationCode: Hex, constructorArgs: Hex): { hookAddress: `0x${string}`; salt: Hex } {
  const initCode = concatHex([creationCode, constructorArgs]);
  const initCodeHash = keccak256(initCode);

  for (let i = 0; i < MAX_LOOP; i++) {
    const salt = pad(toHex(i), { size: 32 });
    const hookAddress = computeCreate2Address(CREATE2_DEPLOYER, salt, initCodeHash);
    if ((BigInt(hookAddress) & FLAG_MASK) === HOOK_FLAGS) {
      return { hookAddress, salt };
    }
  }

  throw new Error("HookMiner: could not find salt");
}

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
  const constructorArgs = encodeAbiParameters([{ type: "address" }], [poolManager]);

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

  if ((BigInt(result.address) & FLAG_MASK) !== HOOK_FLAGS) {
    throw new Error(`LimitOrderHook flags mismatch: ${result.address}`);
  }

  console.log("LimitOrderHook deployed at %s (newlyDeployed=%s)", result.address, result.newlyDeployed);
};

deployLimitOrderHook.tags = ["LimitOrderHook"];

export default deployLimitOrderHook;

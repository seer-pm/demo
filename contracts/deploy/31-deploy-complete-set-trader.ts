import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { base, gnosis, mainnet, optimism } from "viem/chains";

/**
 * DEX routers the Lens quoter builds swaps for, per chain. The trader only lets its swaps call these,
 * so a new venue in the quoter means a redeploy with the new list.
 */
const SWAPR_ROUTER = "0xfFB643E73f280B97809A8b41f7232AB401a04ee1";
const UNISWAP_V3_SWAP_ROUTER_02 = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const UNISWAP_V3_SWAP_ROUTER_02_BASE = "0x2626664c2603336E57B271c5C0b26F421741e481";
const UNISWAP_V4_ROUTER = "0x00000000000044a361Ae3cAc094c9D1b14Eece97";

const SWAP_TARGETS: Record<number, string[]> = {
  [gnosis.id]: [SWAPR_ROUTER],
  [mainnet.id]: [UNISWAP_V3_SWAP_ROUTER_02, UNISWAP_V4_ROUTER],
  [optimism.id]: [UNISWAP_V3_SWAP_ROUTER_02, UNISWAP_V4_ROUTER],
  [base.id]: [UNISWAP_V3_SWAP_ROUTER_02_BASE, UNISWAP_V4_ROUTER],
};

const deployCompleteSetTrader: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  // fallback to hardhat node signers on local network
  const namedAccounts = await getNamedAccounts();
  const deployer = namedAccounts.deployer ?? (await hre.viem.getWalletClients())[0].account.address;
  const chainId = Number(await getChainId());
  console.log("deploying to chainId %s with deployer %s", chainId, deployer);

  const routerName = chainId === gnosis.id ? "GnosisRouter" : chainId === mainnet.id ? "MainnetRouter" : "Router";
  const router = await deployments.get(routerName);
  const targets = SWAP_TARGETS[chainId] ?? SWAP_TARGETS[gnosis.id];

  await deploy("CompleteSetTrader", {
    from: deployer,
    args: [router.address, targets],
    log: true,
  });
};

deployCompleteSetTrader.tags = ["CompleteSetTrader"];

export default deployCompleteSetTrader;

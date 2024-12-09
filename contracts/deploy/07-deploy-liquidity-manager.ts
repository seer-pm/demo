import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { gnosis } from "viem/chains";

const deployLiquidityManager: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  // fallback to hardhat node signers on local network
  const namedAccounts = await getNamedAccounts()
  const deployer = namedAccounts.deployer ?? (await hre.viem.getWalletClients())[0].account.address;
  const chainId = Number(await getChainId());
  console.log("deploying to chainId %s with deployer %s", chainId, deployer);
  if (chainId === gnosis.id) {
    const sDAI = await deployments.get("SavingsXDai");
    const conditionalTokens = await deployments.get("ConditionalTokens");
    const gnosisRouter = await deployments.get("GnosisRouter");
    const uniswapRouterV2 = await deployments.get("UniswapV2Router02");
    console.log(sDAI.address, conditionalTokens.address, gnosisRouter.address, uniswapRouterV2.address)
    await deploy("LiquidityManager", {
      from: deployer,
      args: [sDAI.address, conditionalTokens.address, gnosisRouter.address, uniswapRouterV2.address],
      log: true,
    });
  }
};

deployLiquidityManager.tags = ['LiquidityManager'];

export default deployLiquidityManager;
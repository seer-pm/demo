import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { gnosis } from "viem/chains";

const deployTradeManager: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  // fallback to hardhat node signers on local network
  const namedAccounts = await getNamedAccounts();
  const deployer = namedAccounts.deployer ?? (await hre.viem.getWalletClients())[0].account.address;
  const chainId = Number(await getChainId());
  console.log("deploying to chainId %s with deployer %s", chainId, deployer);
  if (chainId === gnosis.id) {
    const sDAI = await deployments.get("SavingsXDai");
    const conditionalTokens = await deployments.get("ConditionalTokens");
    const gnosisRouter = await deployments.get("GnosisRouter");
    const swapRouter = await deployments.get("SwapRouter");
    const quoter = await deployments.get("Quoter");
    await deploy("TradeQuoter", {
      from: deployer,
      args: [quoter.address, conditionalTokens.address],
      log: true,
    });
    await deploy("TradeManager", {
      from: deployer,
      args: [swapRouter.address, gnosisRouter.address, conditionalTokens.address, sDAI.address],
      log: true,
    });
  }
};

deployTradeManager.tags = ["TradeManager"];

export default deployTradeManager;

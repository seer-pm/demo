import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployCreditsManager: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  // fallback to hardhat node signers on local network
  const namedAccounts = await getNamedAccounts()
  const deployer = namedAccounts.deployer ?? (await hre.viem.getWalletClients())[0].account.address;
  const chainId = Number(await getChainId());
  console.log("deploying to chainId %s with deployer %s", chainId, deployer);

  const seerCredits = await deploy("SeerCredits", {
    from: deployer,
    args: [deployer],
    log: true,
  });

  const collateralToken = await deployments.get("CollateralToken");
  const creditsManager = await deploy("CreditsManager", {
    from: deployer,
    args: [collateralToken.address, seerCredits.address],
    log: true,
  });

  const seerCreditsContract = await hre.ethers.getContractAt("SeerCredits", seerCredits.address);
  await seerCreditsContract.changeCreditsManager(creditsManager.address);
};

deployCreditsManager.tags = ['CreditsManager'];

export default deployCreditsManager;
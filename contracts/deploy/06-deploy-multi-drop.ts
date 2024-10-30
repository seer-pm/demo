import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployMultiDrop: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  // fallback to hardhat node signers on local network
  const namedAccounts = await getNamedAccounts()
  const deployer = namedAccounts.deployer ?? (await hre.viem.getWalletClients())[0].account.address;
  const chainId = Number(await getChainId());
  console.log("deploying to chainId %s with deployer %s", chainId, deployer);
  const governedRecipient = await deployments.get("GovernedRecipient");
  await deploy("MultiDrop", {
    from: deployer,
    args: [governedRecipient.address],
    log: true,
  });
};

deployMultiDrop.tags = ['MultiDrop'];

export default deployMultiDrop;
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { mainnet, gnosis } from "viem/chains";

const deployRouter: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  // fallback to hardhat node signers on local network
  const namedAccounts = await getNamedAccounts();
  const deployer =
    namedAccounts.deployer ??
    (await hre.viem.getWalletClients())[0].account.address;
  const chainId = Number(await getChainId());
  console.log("deploying to chainId %s with deployer %s", chainId, deployer);

  const conditionalTokens = await deployments.get("ConditionalTokens");
  const wrapped1155Factory = await deployments.get("Wrapped1155Factory");

  if (chainId === gnosis.id) {
    await deploy("GnosisRouter", {
      from: deployer,
      args: [conditionalTokens.address, wrapped1155Factory.address],
      log: true,
    });
  } else if (chainId === mainnet.id) {
    await deploy("MainnetRouter", {
      from: deployer,
      args: [conditionalTokens.address, wrapped1155Factory.address],
      log: true,
    });
  } else {
    await deploy("Router", {
      from: deployer,
      args: [conditionalTokens.address, wrapped1155Factory.address],
      log: true,
    });
  }
};

deployRouter.tags = ['Router'];

export default deployRouter;

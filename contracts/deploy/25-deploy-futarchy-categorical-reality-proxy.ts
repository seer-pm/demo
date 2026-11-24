import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployFutarchyCategoricalRealityProxy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  // fallback to hardhat node signers on local network
  const namedAccounts = await getNamedAccounts()
  const deployer = namedAccounts.deployer ?? (await hre.viem.getWalletClients())[0].account.address;
  const chainId = Number(await getChainId());
  console.log("deploying to chainId %s with deployer %s", chainId, deployer);

  const conditionalTokens = await deployments.get("ConditionalTokens");
  const reality = await deployments.get("Reality");

  await deploy("FutarchyCategoricalRealityProxy", {
    from: deployer,
    args: [
      conditionalTokens.address,
      reality.address,
    ],
    log: true,
  });
};

deployFutarchyCategoricalRealityProxy.tags = ['Futarchy', 'FutarchyCategoricalRealityProxy'];

export default deployFutarchyCategoricalRealityProxy;
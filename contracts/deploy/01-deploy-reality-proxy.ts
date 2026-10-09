import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployRealityProxy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  // fallback to hardhat node signers on local network
  const namedAccounts = await getNamedAccounts()
  const deployer = namedAccounts.deployer ?? (await hre.viem.getWalletClients())[0].account.address;
  const chainId = Number(await getChainId());
  console.log("deploying to chainId %s with deployer %s", chainId, deployer);

  const conditionalTokens = await deployments.get("ConditionalTokens");
  // RealityETH 3.2: its templates carry a description where 3.0 had a category.
  const reality = await deployments.get("RealityV3_2");
  if (BigInt(reality.address) === 0n) {
    throw new Error(`No RealityETH 3.2 address for chainId ${chainId} in deployments/<network>/RealityV3_2.json`);
  }

  await deploy("RealityProxy", {
    from: deployer,
    args: [
      conditionalTokens.address,
      reality.address,
    ],
    log: true,
  });
};

deployRealityProxy.tags = ['RealityProxy'];

export default deployRealityProxy;
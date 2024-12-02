import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployFutarchyFactory: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  // fallback to hardhat node signers on local network
  const namedAccounts = await getNamedAccounts()
  const deployer = namedAccounts.deployer ?? (await hre.viem.getWalletClients())[0].account.address;
  const chainId = Number(await getChainId());
  console.log("deploying to chainId %s with deployer %s", chainId, deployer);

  const proposal = await deployments.get("FutarchyProposal");
  // TODO: change arbitrator?
  const realitioArbitrator = await deployments.get("RealitioHomeArbitrationProxy");
  const reality = await deployments.get("Reality");
  const wrapped1155Factory = await deployments.get("Wrapped1155Factory");
  const conditionalTokens = await deployments.get("ConditionalTokens");
  const realityProxy = await deployments.get("FutarchyRealityProxy");

  await deploy("FutarchyFactory", {
    from: deployer,
    args: [
      proposal.address,
      realitioArbitrator.address,
      reality.address,
      wrapped1155Factory.address,
      conditionalTokens.address,
      realityProxy.address,
      60 * 60 * 24 * 3.5, // 3.5 days
    ],
    log: true,
  });
};

deployFutarchyFactory.tags = ['Futarchy', 'FutarchyFactory'];

export default deployFutarchyFactory;
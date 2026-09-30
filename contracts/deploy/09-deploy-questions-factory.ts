import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployQuestionsFactory: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  // fallback to hardhat node signers on local network
  const namedAccounts = await getNamedAccounts()
  const deployer = namedAccounts.deployer ?? (await hre.viem.getWalletClients())[0].account.address;
  const chainId = Number(await getChainId());
  console.log("deploying to chainId %s with deployer %s", chainId, deployer);

  const marketFactory = await deployments.get("MarketFactory");

  // The ERC20s this contract deploys must be the same ones MarketFactory later finds, so the
  // position ids have to be computed with MarketFactory's own dependencies.
  const conditionalTokens = await deployments.read("MarketFactory", "conditionalTokens");
  const wrapped1155Factory = await deployments.read("MarketFactory", "wrapped1155Factory");

  await deploy("QuestionsFactory", {
    from: deployer,
    args: [marketFactory.address, conditionalTokens, wrapped1155Factory],
    log: true,
  });
};

deployQuestionsFactory.tags = ['QuestionsFactory'];

export default deployQuestionsFactory;

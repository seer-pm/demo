import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { rootstock } from "viem/chains";

const deployConditionalTokens: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  // fallback to hardhat node signers on local network
  const namedAccounts = await getNamedAccounts()
  const deployer = namedAccounts.deployer ?? (await hre.viem.getWalletClients())[0].account.address;
  const chainId = Number(await getChainId());

  // Every other network shares the ConditionalTokens and Wrapped1155Factory that the wider ecosystem
  // already uses there, saved by hand in deployments/. Rootstock has neither.
  if (chainId !== rootstock.id) {
    return;
  }

  console.log("deploying to chainId %s with deployer %s", chainId, deployer);

  await deploy("ConditionalTokens", {
    contract: "src/interaction/conditional-tokens/ConditionalTokens.sol:ConditionalTokens",
    from: deployer,
    args: [],
    log: true,
  });

  await deploy("Wrapped1155Factory", {
    contract: "src/interaction/1155-to-20/Wrapped1155Factory.sol:Wrapped1155Factory",
    from: deployer,
    args: [],
    log: true,
  });
};

deployConditionalTokens.tags = ['ConditionalTokens'];

export default deployConditionalTokens;

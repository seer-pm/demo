import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

// same address in every network
export const WRAPPED_1155_FACTORY = '0xD194319D1804C1051DD21Ba1Dc931cA72410B79f'

const deployWrappedERC20Factory: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  // fallback to hardhat node signers on local network
  const namedAccounts = await getNamedAccounts()
  const deployer = namedAccounts.deployer ?? (await hre.viem.getWalletClients())[0].account.address;
  const chainId = Number(await getChainId());
  console.log("deploying to chainId %s with deployer %s", chainId, deployer);

  await deploy("WrappedERC20Factory", {
    from: deployer,
    args: [
      WRAPPED_1155_FACTORY,
    ],
    log: true,
  });
};

export default deployWrappedERC20Factory;
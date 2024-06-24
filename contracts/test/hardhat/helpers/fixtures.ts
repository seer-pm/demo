import { ethers } from "hardhat";
import { IERC20 } from "../../../typechain-types";

export async function marketFactoryDeployFixture(
  customCollateralToken?: IERC20
) {
  // Deploy contracts
  const market = await ethers.deployContract("Market");

  //skip arbitrator
  const arbitrator = "0x0000000000000000000000000000000000000000";

  const realitio = await ethers.deployContract("RealityETH_v3_0");

  const wrapped1155Factory = await ethers.deployContract(
    "src/1155-to-20/Wrapped1155Factory.sol:Wrapped1155Factory"
  );

  const wrappedERC20Factory = await (
    await ethers.getContractFactory("WrappedERC20Factory")
  ).deploy(wrapped1155Factory);

  const conditionalTokens = await ethers.deployContract("ConditionalTokens");

  const collateralToken =
    customCollateralToken ?? (await ethers.deployContract("CollateralToken"));

  const realityProxy = await (
    await ethers.getContractFactory("RealityProxy")
  ).deploy(conditionalTokens, realitio);

  const router = await (
    await ethers.getContractFactory("Router")
  ).deploy(conditionalTokens, wrappedERC20Factory);

  const [owner] = await ethers.getSigners();
  const governor = owner.address;
  // Deploy MarketFactory
  const marketFactory = await (
    await ethers.getContractFactory("MarketFactory")
  ).deploy(
    market,
    arbitrator,
    realitio,
    wrappedERC20Factory,
    conditionalTokens,
    await collateralToken.getAddress(),
    realityProxy,
    governor
  );
  return {
    marketFactory,
    realitio,
    arbitrator,
    conditionalTokens,
    realityProxy,
    router,
    collateralToken,
    wrappedERC20Factory,
  };
}


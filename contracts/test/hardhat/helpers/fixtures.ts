import { ethers } from "hardhat";
import { IERC20 } from "../../../typechain-types";
import { QUESTION_TIMEOUT } from "./constants";

export async function marketFactoryDeployFixture(customCollateralToken?: IERC20) {
  // Deploy contracts
  const market = await ethers.deployContract("Market");

  //skip arbitrator
  const arbitrator = "0x0000000000000000000000000000000000000000";
  const realitio = await ethers.deployContract("RealityETH_v3_0");
  const wrapped1155Factory = await ethers.deployContract(
    "src/interaction/1155-to-20/Wrapped1155Factory.sol:Wrapped1155Factory",
  );

  const conditionalTokens = await ethers.deployContract("ConditionalTokens");

  const collateralToken = customCollateralToken ?? (await ethers.deployContract("CollateralToken"));

  const realityProxy = await (await ethers.getContractFactory("RealityProxy")).deploy(conditionalTokens, realitio);

  const router = await (await ethers.getContractFactory("Router")).deploy(conditionalTokens, wrapped1155Factory);

  const conditionalRouter = await (
    await ethers.getContractFactory("ConditionalRouter")
  ).deploy(conditionalTokens, wrapped1155Factory);

  // Deploy MarketFactory
  const marketFactory = await (
    await ethers.getContractFactory("MarketFactory")
  ).deploy(
    market,
    arbitrator,
    realitio,
    wrapped1155Factory,
    conditionalTokens,
    await collateralToken.getAddress(),
    realityProxy,
    QUESTION_TIMEOUT,
  );
  return {
    marketFactory,
    realitio,
    arbitrator,
    conditionalTokens,
    realityProxy,
    router,
    conditionalRouter,
    collateralToken,
    wrapped1155Factory,
  };
}

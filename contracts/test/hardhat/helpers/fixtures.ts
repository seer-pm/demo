import { ethers } from "hardhat";
import { IERC20 } from "../../../typechain-types";
import { QUESTION_TIMEOUT } from "./constants";

import { Contract } from "ethers";
import AlgebraFactoryData from "./abis/AlgebraFactory.json";
import AlgebraPoolDeployerData from "./abis/AlgebraPoolDeployer.json";
import SwapRouterData from "./abis/SwapRouter.json";
import TestAlgebraCalleeData from "./abis/TestAlgebraCallee.json";
import WNativeTokenData from "./abis/WNativeToken.json";
import QuoterData from "./abis/Quoter.json";

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

export async function swaprFixture() {
  // Deploy contracts
  const [deployer] = await ethers.getSigners();
  const vaultAddress = "0x1d8b6fA722230153BE08C4Fa4Aa4B4c7cd01A95a";
  const PoolDeployerFactory = new ethers.ContractFactory(
    AlgebraPoolDeployerData.abi,
    AlgebraPoolDeployerData.bytecode,
    deployer,
  );
  const poolDeployer = (await PoolDeployerFactory.deploy()) as Contract;

  const AlgebraFactoryFactory = new ethers.ContractFactory(
    AlgebraFactoryData.abi,
    AlgebraFactoryData.bytecode,
    deployer,
  );
  const algebraFactory = (await AlgebraFactoryFactory.deploy(poolDeployer, vaultAddress)) as Contract;

  await poolDeployer.setFactory(algebraFactory);
  const wnativeFactory = await ethers.getContractFactory(WNativeTokenData.abi, WNativeTokenData.bytecode);
  const wnative = (await wnativeFactory.deploy()) as Contract;

  const SwapRouterFactory = new ethers.ContractFactory(SwapRouterData.abi, SwapRouterData.bytecode, deployer);
  const swapRouter = (await SwapRouterFactory.deploy(
    algebraFactory,
    wnative,
    await algebraFactory.poolDeployer(),
  )) as Contract;

  const SwapQuoterFactory = new ethers.ContractFactory(QuoterData.abi, QuoterData.bytecode, deployer);
  const swapQuoter = (await SwapQuoterFactory.deploy(
    algebraFactory,
    wnative,
    await algebraFactory.poolDeployer(),
  )) as Contract;

  const MinterFactory = new ethers.ContractFactory(TestAlgebraCalleeData.abi, TestAlgebraCalleeData.bytecode, deployer);
  const minter = (await MinterFactory.deploy()) as Contract;

  return {
    algebraFactory,
    swapRouter,
    poolDeployer,
    minter,
    swapQuoter
  };
}

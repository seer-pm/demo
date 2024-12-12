import { ethers, network } from "hardhat";
import { IERC20 } from "../../../typechain-types";
import { QUESTION_TIMEOUT } from "./constants";

import { Contract, getCreateAddress, ZeroAddress } from "ethers";
import AlgebraFactoryData from "./abis/AlgebraFactory.json";
import AlgebraCommunityVaultData from "./abis/AlgebraCommunityVault.json";
import AlgebraVaultFactoryStubData from "./abis/AlgebraVaultFactoryStub.json";
import AlgebraPoolDeployerData from "./abis/AlgebraPoolDeployer.json";
import SwapRouterData from "./abis/SwapRouter.json";
import TestAlgebraCalleeData from "./abis/TestAlgebraCallee.json";

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
    collateralToken,
    wrapped1155Factory,
  };
}

export async function swaprFixture() {
  // Deploy contracts
  console.log("deploy contracts");
  const [deployer] = await ethers.getSigners();
  const poolDeployerAddress = getCreateAddress({
    from: deployer.address,
    nonce: (await ethers.provider.getTransactionCount(deployer.address)) + 1,
  });

  const AlgebraFactoryFactory = new ethers.ContractFactory(
    AlgebraFactoryData.abi,
    AlgebraFactoryData.bytecode,
    deployer,
  );
  const algebraFactory = (await AlgebraFactoryFactory.deploy(poolDeployerAddress)) as Contract;

  const PoolDeployerFactory = new ethers.ContractFactory(
    AlgebraPoolDeployerData.abi,
    AlgebraPoolDeployerData.bytecode,
    deployer,
  );
  const poolDeployer = (await PoolDeployerFactory.deploy(algebraFactory)) as Contract;

  const CommunityVaultFactory = new ethers.ContractFactory(
    AlgebraCommunityVaultData.abi,
    AlgebraCommunityVaultData.bytecode,
    deployer,
  );
  const communityVault = (await CommunityVaultFactory.deploy(algebraFactory, deployer)) as Contract;

  const AlgebraVaultFactoryStubFactory = new ethers.ContractFactory(
    AlgebraVaultFactoryStubData.abi,
    AlgebraVaultFactoryStubData.bytecode,
    deployer,
  );

  const vaultFactoryStub = await AlgebraVaultFactoryStubFactory.deploy(communityVault);

  const SwapRouterFactory = new ethers.ContractFactory(SwapRouterData.abi, SwapRouterData.bytecode, deployer);
  const swapRouter = (await SwapRouterFactory.deploy(algebraFactory, ZeroAddress, poolDeployer)) as Contract;

  await algebraFactory.setVaultFactory(vaultFactoryStub);

  const MinterFactory = new ethers.ContractFactory(TestAlgebraCalleeData.abi, TestAlgebraCalleeData.bytecode, deployer);
  const minter = (await MinterFactory.deploy()) as Contract;

  return {
    algebraFactory,
    swapRouter,
    poolDeployer,
    minter,
  };
}

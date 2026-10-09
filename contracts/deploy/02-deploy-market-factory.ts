import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { parseAbi } from "viem";

const deployMarketFactory: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;

  // fallback to hardhat node signers on local network
  const namedAccounts = await getNamedAccounts()
  const deployer = namedAccounts.deployer ?? (await hre.viem.getWalletClients())[0].account.address;
  const chainId = Number(await getChainId());
  console.log("deploying to chainId %s with deployer %s", chainId, deployer);

  const market = await deployments.get("Market");
  const realitioArbitrator = await deployments.get(chainId === 1 ? "Realitio_v2_1_ArbitratorWithAppeals" : "RealitioHomeArbitrationProxy");
  const reality = await deployments.get("RealityV3_2");
  if (BigInt(reality.address) === 0n) {
    throw new Error(`No RealityETH 3.2 address for chainId ${chainId} in deployments/<network>/RealityV3_2.json`);
  }

  // An arbitrator answers on the one Reality instance it was deployed with. A factory that asks on another
  // instance would create questions nobody can take to arbitration.
  const arbitratorReality = await (await hre.viem.getPublicClient()).readContract({
    address: realitioArbitrator.address as `0x${string}`,
    abi: parseAbi(["function realitio() view returns (address)"]),
    functionName: "realitio",
  });
  if (arbitratorReality.toLowerCase() !== reality.address.toLowerCase()) {
    throw new Error(`Arbitrator ${realitioArbitrator.address} uses Reality ${arbitratorReality}, not ${reality.address}`);
  }

  const wrapped1155Factory = await deployments.get("Wrapped1155Factory");
  const conditionalTokens = await deployments.get("ConditionalTokens");
  const realityProxy = await deployments.get("RealityProxy");

  await deploy("MarketFactory", {
    from: deployer,
    args: [
      market.address,
      realitioArbitrator.address,
      reality.address,
      wrapped1155Factory.address,
      conditionalTokens.address,
      realityProxy.address,
    ],
    log: true,
  });
};

deployMarketFactory.tags = ['MarketFactory'];

export default deployMarketFactory;
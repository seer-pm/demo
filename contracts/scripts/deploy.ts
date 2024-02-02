import hre from "hardhat";
import { Address } from "viem";
import { goerli, mainnet, gnosis } from "viem/chains";

interface ContractsList {
  ARBITRATOR: Address | '',
  REALITY: Address | '',
  WRAPPED_1155_FACTORY: Address | '',
  CONDITIONAL_TOKENS: Address | '',
  COLLATERAL_TOKEN: Address | '',
  ORACLE: Address | '',
  MAVERICK_FACTORY: Address | '',
}

const CONTRACTS: Record<number, ContractsList> = {
  /*[gnosis.id]: {
    ARBITRATOR: "0xe40DD83a262da3f56976038F1554Fe541Fa75ecd",
    REALITY: "0xE78996A233895bE74a66F451f1019cA9734205cc",
    WRAPPED_1155_FACTORY: "", // need to deploy latest version
    CONDITIONAL_TOKENS: "0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce",
    COLLATERAL_TOKEN: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d", // WXDAI
    ORACLE: "0xd47de3542d4e6b90fb3df59e6361dffd6579c866",
    UNISWAP_V3_FACTORY: "0xe32F7dD7e3f098D518ff19A22d5f028e076489B1",
  },*/
  [goerli.id]: {
    ARBITRATOR: "0xaa5681047a16f163391377fd9f78e84355cc9696",
    REALITY: "0x6F80C5cBCF9FbC2dA2F0675E56A5900BB70Df72f",
    WRAPPED_1155_FACTORY: "0xD194319D1804C1051DD21Ba1Dc931cA72410B79f",
    CONDITIONAL_TOKENS: "0x383e1Dd5D232516aFa1b1524d31B1EF6E9c6caFb",
    COLLATERAL_TOKEN: "0x65a5ba240cbd7fd75700836b683ba95ebb2f32bd",
    ORACLE: "0xAd20b7db13c74E69fCD92dF48F352669625D21a8",
    MAVERICK_FACTORY: "0x6292B737E6640223EB783F1355737315985Ece49",
  },
}

async function main() {
  const [signer] = await hre.viem.getWalletClients();

  const chainId = signer.chain.id === 31337 ? goerli.id : signer.chain.id
  
  console.log(`Deploying contracts with the account ${signer.account.address}`);

  const market = await hre.viem.deployContract("Market");

  console.log(`Market deployed to ${market.address}`);

  const GOVERNOR = signer.account.address;

  const marketFactory = await hre.viem.deployContract("MarketFactory", [
    market.address,
    CONTRACTS[chainId].ARBITRATOR,
    CONTRACTS[chainId].REALITY,
    CONTRACTS[chainId].WRAPPED_1155_FACTORY,
    CONTRACTS[chainId].CONDITIONAL_TOKENS,
    CONTRACTS[chainId].COLLATERAL_TOKEN,
    CONTRACTS[chainId].ORACLE,
    CONTRACTS[chainId].MAVERICK_FACTORY,
    GOVERNOR,
  ]);

  console.log(`Market Factory deployed to ${marketFactory.address}`);

  await hre.run("verify:verify", {
    address: market.address,
  });

  await hre.run("verify:verify", {
    address: marketFactory.address,
    constructorArguments: [
      market.address,
      CONTRACTS[chainId].ARBITRATOR,
      CONTRACTS[chainId].REALITY,
      CONTRACTS[chainId].WRAPPED_1155_FACTORY,
      CONTRACTS[chainId].CONDITIONAL_TOKENS,
      CONTRACTS[chainId].COLLATERAL_TOKEN,
      CONTRACTS[chainId].ORACLE,
      CONTRACTS[chainId].MAVERICK_FACTORY,
      GOVERNOR,
    ],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

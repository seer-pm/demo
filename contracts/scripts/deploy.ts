import hre from "hardhat";

const ARBITRATOR = "0xe40DD83a262da3f56976038F1554Fe541Fa75ecd";
const REALITY = "0xE78996A233895bE74a66F451f1019cA9734205cc";
const WRAPPED_1155_FACTORY = "0xDE6943f3717738038159a406FF157d4eb3238c1B"; // not verified
const CONDITIONAL_TOKENS = "0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce";
const COLLATERAL_TOKEN = "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d"; // WXDAI
const ORACLE = "0xd47de3542d4e6b90fb3df59e6361dffd6579c866";
const UNISWAP_V3_FACTORY = "0xe32F7dD7e3f098D518ff19A22d5f028e076489B1";

async function main() {
  const [signer] = await hre.viem.getWalletClients();

  console.log(`Deploying contracts with the account ${signer.account.address}`);

  const market = await hre.viem.deployContract("Market");

  console.log(`Market deployed to ${market.address}`);

  const GOVERNOR = signer.account.address;

  const marketFactory = await hre.viem.deployContract("MarketFactory", [
    market.address,
    ARBITRATOR,
    REALITY,
    WRAPPED_1155_FACTORY,
    CONDITIONAL_TOKENS,
    COLLATERAL_TOKEN,
    ORACLE,
    UNISWAP_V3_FACTORY,
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
      ARBITRATOR,
      REALITY,
      WRAPPED_1155_FACTORY,
      CONDITIONAL_TOKENS,
      COLLATERAL_TOKEN,
      ORACLE,
      UNISWAP_V3_FACTORY,
      GOVERNOR,
    ],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

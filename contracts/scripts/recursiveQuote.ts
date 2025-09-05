import { ethers } from "hardhat";
import { GnosisAddress } from "../test/hardhat/helpers/constants";
import {
  RecursiveQuoter,
  RecursiveQuoter__factory,
  TradeQuoter__factory,
} from "../typechain-types";
const swapQuoterAddress = "0xcBaD9FDf0D2814659Eb26f600EFDeAF005Eda0F7";
const algebraFactoryAddress = "0xA0864cCA6E114013AB0e27cbd5B6f4c8947da766";
const conditionalTokensAddress = "0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8546/");
  const accounts = await provider.send("eth_accounts", []);
  await provider.send("hardhat_reset", [
    {
      forking: {
        jsonRpcUrl: GnosisAddress.RPC_URL,
      },
    },
  ]);
  await provider.send("evm_setAutomine", [true]);
  const signer = await provider.getSigner(accounts[0]);
  const tradeQuoterFactory = new ethers.ContractFactory(
    TradeQuoter__factory.abi,
    TradeQuoter__factory.bytecode,
    signer
  );
  const tradeQuoter = await tradeQuoterFactory.deploy(
    swapQuoterAddress,
    conditionalTokensAddress
  );
  await tradeQuoter.waitForDeployment();
  const recursiveQuoterFactory = new ethers.ContractFactory(
    RecursiveQuoter__factory.abi,
    RecursiveQuoter__factory.bytecode,
    signer
  );
  const recursiveQuoter = (await (
    await recursiveQuoterFactory.deploy(tradeQuoter, algebraFactoryAddress)
  ).waitForDeployment()) as RecursiveQuoter;
  const chainParams = [
    {
      targetToken: "0x27827651fb99f4d241f450e93135cad9fb7831f4",
      collateralToken: "0xaf204776c7245bF4147c2612BF6e5972Ee483701",
      targetMarket: "0x4684484388bf048b23621449a3ea4ae16faca5c6",
      collateralMarket: ethers.ZeroAddress,
      maxRecursionDepth: 1,
    },
    {
      targetToken: "0xdae99dd4fbe89ea8ccfa5870b27cca6cc459b99e",
      collateralToken: "0x27827651fb99f4d241f450e93135cad9fb7831f4",
      targetMarket: "0xe020b9bcb9d59b0cafd8603e9e07976c5ee7711b",
      collateralMarket: "0x4684484388bf048b23621449a3ea4ae16faca5c6",
      maxRecursionDepth: 1,
    },
  ];

  const initialCollateralAmount = ethers.parseUnits("100", 18);
  // Call the function (use staticCall to avoid state changes and save gas)
  try {
    const result = await recursiveQuoter.quoteRecursiveRebuy.staticCall(
      chainParams,
      initialCollateralAmount
    );

    console.log("Final amount:", ethers.formatUnits(result.finalAmount, 18));
    console.log("Total fee:", result.totalFee);
    console.log("Number of steps:", result.steps.length);
    for (let i = 0; i < result.steps.length; i++) {
      const step = result.steps[i];
      const actionName = step.action === 0n ? "SWAP" : "MINT";
      console.log(`Step ${i + 1}: ${actionName}`);
      console.log(`  Token In: ${step.tokenIn}`);
      console.log(`  Token Out: ${step.tokenOut}`);
      console.log(`  Amount In: ${ethers.formatUnits(step.amountIn, 18)}`);
      console.log(`  Amount Out: ${ethers.formatUnits(step.amountOut, 18)}`);
      console.log(`  Fee: ${step.fee}`);
    }
  } catch (error) {
    console.error("Error calling quoteRecursiveRebuy:", error);
  }
  console.log("Finished");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

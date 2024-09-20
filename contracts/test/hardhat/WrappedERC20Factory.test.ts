import { expect } from "chai";
import { ethers, network } from "hardhat";
import {
  ConditionalTokens,
  Wrapped1155Factory,
  WrappedERC20Factory,
} from "../../typechain-types";

describe("WrappedERC20Factory", function () {
  let wrappedERC20Factory: WrappedERC20Factory;
  let wrapped1155Factory: Wrapped1155Factory;
  let conditionalTokens: ConditionalTokens;

  beforeEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);
    conditionalTokens = await ethers.deployContract("ConditionalTokens");
    wrapped1155Factory = (await ethers.deployContract(
      "src/interaction/1155-to-20/Wrapped1155Factory.sol:Wrapped1155Factory"
    )) as unknown as Wrapped1155Factory;
    wrappedERC20Factory = await (
      await ethers.getContractFactory("WrappedERC20Factory")
    ).deploy(wrapped1155Factory);
  });

  describe("createWrappedToken", function () {
    it("Should create a wrapped token and store its data", async function () {
      const tokenId = 1;

      const trx = await wrappedERC20Factory.createWrappedToken(
        conditionalTokens,
        tokenId,
      );
      const receipt = await trx.wait(1);
      const events = await wrapped1155Factory.queryFilter(
        wrapped1155Factory.filters.Wrapped1155Creation,
        receipt?.blockNumber
      );

      // Check if the token was created and stored
      const storedToken = await wrappedERC20Factory.tokens(tokenId);
      expect(storedToken).to.equal(events[0].args[2]);
    });
  });
});

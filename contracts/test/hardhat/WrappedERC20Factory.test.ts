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
      "src/1155-to-20/Wrapped1155Factory.sol:Wrapped1155Factory"
    )) as unknown as Wrapped1155Factory;
    wrappedERC20Factory = await (
      await ethers.getContractFactory("WrappedERC20Factory")
    ).deploy(wrapped1155Factory);
  });

  describe("toString31", function () {
    it("encodes short strings", async function () {
      const testString = "Test";
      const encoded = await wrappedERC20Factory.toString31(testString);

      // The expected result:
      // - "Test" in hex is 0x54657374
      // - Padded to 32 bytes: 0x5465737400000000000000000000000000000000000000000000000000000000
      // - Length (4) * 2 = 8, so the last byte should be 0x08
      const expected =
        "0x5465737400000000000000000000000000000000000000000000000000000008";

      expect(encoded).to.equal(expected);
    });

    it("reverts for strings longer than 31 bytes", async function () {
      const longString = "ThisStringIsDefinitelyTooLongToEncode";
      await expect(
        wrappedERC20Factory.toString31(longString)
      ).to.be.revertedWith("string too long");
    });
  });

  describe("createWrappedToken", function () {
    it("Should create a wrapped token and store its data", async function () {
      const tokenId = 1;
      const tokenName = "Wrapped Token";
      const tokenSymbol = "WTKN";

      const trx = await wrappedERC20Factory.createWrappedToken(
        conditionalTokens,
        tokenId,
        tokenName,
        tokenSymbol
      );
      const receipt = await trx.wait(1);
      const events = await wrapped1155Factory.queryFilter(
        wrapped1155Factory.filters.Wrapped1155Creation,
        receipt?.blockNumber
      );

      // Check if the token was created and stored
      const storedToken = await wrappedERC20Factory.tokens(tokenId);
      expect(storedToken).to.equal(events[0].args[2]);

      // Check if the token data was stored
      const storedData = await wrappedERC20Factory.data(tokenId);
      expect(storedData).to.not.equal("0x");
    });
  });
});

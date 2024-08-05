import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ContractTransactionResponse } from "ethers";
import { ethers, network } from "hardhat";
import {
  MinimalERC1155,
  Wrapped1155,
  Wrapped1155Factory,
} from "../../../typechain-types";
import { tokenMetadataToBytes } from "../helpers/utils";
import { ETH_BALANCE } from "../helpers/constants";
const tokens = [
  {
    tokenId: 1,
    amount: 100,
    name: "Wrapped Token 1",
    symbol: "WTK1",
    decimals: 18,
  },
  {
    tokenId: 2,
    amount: 200,
    name: "Wrapped Token 2",
    symbol: "WTK2",
    decimals: 19,
  },
  {
    tokenId: 3,
    amount: 300,
    name: "Wrapped Token 3",
    symbol: "WTK3",
    decimals: 20,
  },
];
describe("Wrapped1155Factory", function () {
  let wrapped1155Factory: Wrapped1155Factory;
  let minimalERC1155: MinimalERC1155;
  let owner: HardhatEthersSigner;

  beforeEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);
    [owner] = await ethers.getSigners();

    wrapped1155Factory = (await ethers.deployContract(
      "src/interaction/1155-to-20/Wrapped1155Factory.sol:Wrapped1155Factory"
    )) as unknown as Wrapped1155Factory;
    minimalERC1155 = await ethers.deployContract("MinimalERC1155");
  });

  describe("Wrapping and Unwrapping", function () {
    beforeEach(async function () {
      // Mint some tokens to owner
      await minimalERC1155.batchMint(
        owner,
        tokens.map((x) => x.tokenId),
        tokens.map((x) => x.amount),
        "0x"
      );
    });

    context("transferring a token to the factory", function () {
      const { name, symbol, decimals, tokenId, amount } = tokens[0];
      const data = tokenMetadataToBytes(name, symbol, decimals);
      let trx: Promise<ContractTransactionResponse>;
      beforeEach(async function () {
        trx = minimalERC1155.safeTransferFrom(
          owner,
          wrapped1155Factory,
          tokenId,
          amount,
          data
        );
      });
      it("emits a Wrapped1155Creation event", async function () {
        await expect(trx).to.emit(wrapped1155Factory, "Wrapped1155Creation");
      });

      it("sends wrapped token to user", async function () {
        const wrappedTokenAddress = await wrapped1155Factory.getWrapped1155(
          minimalERC1155,
          tokenId,
          data
        );

        const wrappedToken = await ethers.getContractAt(
          "Wrapped1155",
          wrappedTokenAddress
        );

        expect(await wrappedToken.balanceOf(owner)).to.equal(amount);
      });

      describe("unwrap", function () {
        it("burns wrapped token and send ERC1155 token back to user", async function () {
          const wrappedTokenAddress = await wrapped1155Factory.getWrapped1155(
            minimalERC1155,
            tokenId,
            data
          );
          const wrappedToken = await ethers.getContractAt(
            "Wrapped1155",
            wrappedTokenAddress
          );

          await wrapped1155Factory.unwrap(
            minimalERC1155,
            tokenId,
            amount,
            owner,
            data
          );

          expect(await wrappedToken.balanceOf(owner)).to.equal(0);
          expect(await minimalERC1155.balanceOf(owner, tokenId)).to.equal(
            amount
          );
          expect(
            await minimalERC1155.balanceOf(wrapped1155Factory, tokenId)
          ).to.equal(0);
        });
      });
    });

    context("transferring multiple tokens to the factory", function () {
      it("reverts if ids length is different from data length", async function () {
        const data = ethers.concat(
          tokens
            .map((x) => {
              const { name, symbol, decimals } = x;
              return tokenMetadataToBytes(name, symbol, decimals);
            })
            .slice(1)
        );
        await expect(
          minimalERC1155.safeBatchTransferFrom(
            owner,
            wrapped1155Factory,
            tokens.map((x) => x.tokenId),
            tokens.map((x) => x.amount),
            data
          )
        ).to.be.revertedWith(
          "Wrapped1155Factory: data bytes should be ids size"
        );
      });

      context("with valid transfer", function () {
        const data = ethers.concat(
          tokens.map((x) => {
            const { name, symbol, decimals } = x;
            return tokenMetadataToBytes(name, symbol, decimals);
          })
        );
        let trx: Promise<ContractTransactionResponse>;
        beforeEach(async function () {
          trx = minimalERC1155.safeBatchTransferFrom(
            owner,
            wrapped1155Factory,
            tokens.map((x) => x.tokenId),
            tokens.map((x) => x.amount),
            data
          );
        });

        it("emits a Wrapped1155Creation event", async function () {
          await expect(trx).to.emit(wrapped1155Factory, "Wrapped1155Creation");
        });

        it("sends wrapped tokens to user", async function () {
          for (let i = 0; i < tokens.length; i++) {
            const { name, symbol, decimals, tokenId, amount } = tokens[i];
            const wrappedTokenAddress = await wrapped1155Factory.getWrapped1155(
              minimalERC1155,
              tokenId,
              tokenMetadataToBytes(name, symbol, decimals)
            );

            const wrappedToken = await ethers.getContractAt(
              "Wrapped1155",
              wrappedTokenAddress
            );

            expect(await wrappedToken.balanceOf(owner)).to.equal(amount);
          }
        });

        describe("batchUnwrap", function () {
          it("reverts if tokenIds length is different from amounts length", async function () {
            await expect(
              wrapped1155Factory.batchUnwrap(
                minimalERC1155,
                tokens.map((x) => x.tokenId),
                tokens.map((x) => x.amount).slice(1),
                owner,
                data
              )
            ).to.be.revertedWith("Wrapped1155Factory: mismatched input arrays");
          });
          it("reverts if tokenIds length is different from data length", async function () {
            await expect(
              wrapped1155Factory.batchUnwrap(
                minimalERC1155,
                tokens.map((x) => x.tokenId).slice(1),
                tokens.map((x) => x.amount).slice(1),
                owner,
                data
              )
            ).to.be.revertedWith(
              "Wrapped1155Factory: data bytes should be ids size"
            );
          });
          it("burns wrapped token and send ERC1155 tokens back to user", async function () {
            await wrapped1155Factory.batchUnwrap(
              minimalERC1155,
              tokens.map((x) => x.tokenId),
              tokens.map((x) => x.amount),
              owner,
              data
            );

            for (let i = 0; i < tokens.length; i++) {
              const { name, symbol, decimals, tokenId, amount } = tokens[i];
              const wrappedTokenAddress =
                await wrapped1155Factory.getWrapped1155(
                  minimalERC1155,
                  tokenId,
                  tokenMetadataToBytes(name, symbol, decimals)
                );

              const wrappedToken = await ethers.getContractAt(
                "Wrapped1155",
                wrappedTokenAddress
              );

              expect(await wrappedToken.balanceOf(owner)).to.equal(0);
              expect(await minimalERC1155.balanceOf(owner, tokenId)).to.equal(
                amount
              );
              expect(
                await minimalERC1155.balanceOf(wrapped1155Factory, tokenId)
              ).to.equal(0);
            }
          });
        });
      });
    });
  });

  describe("requireWrapped1155", function () {
    const { name, symbol, decimals, tokenId } = tokens[0];

    it("does not emit a Wrapped1155Creation event if call again", async function () {
      await wrapped1155Factory.requireWrapped1155(
        minimalERC1155,
        tokenId,
        tokenMetadataToBytes(name, symbol, decimals)
      );
      await expect(
        wrapped1155Factory.requireWrapped1155(
          minimalERC1155,
          tokenId,
          tokenMetadataToBytes(name, symbol, decimals)
        )
      ).to.not.emit(wrapped1155Factory, "Wrapped1155Creation");
    });
  });
});

describe("Wrapped1155", function () {
  let wrapped1155: Wrapped1155;
  let wrapped1155Factory: Wrapped1155Factory;
  let minimalERC1155: MinimalERC1155;
  let factorySigner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;

  beforeEach(async function () {
    const { name, symbol, decimals, tokenId } = tokens[0];
    await network.provider.send("evm_setAutomine", [true]);
    addr1 = (await ethers.getSigners())[1];
    wrapped1155Factory = (await ethers.deployContract(
      "src/interaction/1155-to-20/Wrapped1155Factory.sol:Wrapped1155Factory"
    )) as unknown as Wrapped1155Factory;
    minimalERC1155 = await ethers.deployContract("MinimalERC1155");
    // create a wrapped1155
    await wrapped1155Factory.requireWrapped1155(
      minimalERC1155,
      tokenId,
      tokenMetadataToBytes(name, symbol, decimals)
    );
    const wrapped1155Address = await wrapped1155Factory.getWrapped1155(
      minimalERC1155,
      tokenId,
      tokenMetadataToBytes(name, symbol, decimals)
    );
    wrapped1155 = await ethers.getContractAt("Wrapped1155", wrapped1155Address);
    const factoryAddress = await wrapped1155Factory.getAddress();
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [factoryAddress],
    });
    await network.provider.send("hardhat_setBalance", [
      factoryAddress,
      ethers.toBeHex(ethers.parseEther(ETH_BALANCE)),
    ]);
    factorySigner = await ethers.getSigner(factoryAddress);
  });

  describe("mint", function () {
    it("mints tokens if called by factory", async function () {
      await wrapped1155.connect(factorySigner).mint(addr1.address, 100);
      expect(await wrapped1155.balanceOf(addr1.address)).to.equal(100);
    });

    it("reverts if not called by factory", async function () {
      await expect(wrapped1155.mint(addr1.address, 100)).to.be.revertedWith(
        "Wrapped1155: only factory allowed to perform operation"
      );
    });
  });

  describe("burn", function () {
    beforeEach(async function () {
      await wrapped1155.connect(factorySigner).mint(addr1.address, 1000);
    });

    it("burns tokens if called by factory", async function () {
      await wrapped1155.connect(factorySigner).burn(addr1.address, 100);
      expect(await wrapped1155.balanceOf(addr1.address)).to.equal(900);
    });

    it("reverts if not called by factory", async function () {
      await expect(wrapped1155.burn(addr1.address, 100)).to.be.revertedWith(
        "Wrapped1155: only factory allowed to perform operation"
      );
    });
  });
});

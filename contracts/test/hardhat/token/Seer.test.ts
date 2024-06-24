import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Seer } from "../../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Seer", function () {
  let seer: Seer;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  beforeEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);
    [owner, addr1, addr2] = await ethers.getSigners();
    seer = await (await ethers.getContractFactory("Seer")).deploy(owner);
  });

  describe("Deployment", function () {
    it("sets the right governor", async function () {
      expect(await seer.governor()).to.equal(owner.address);
    });

    it("sets the correct name and symbol", async function () {
      expect(await seer.name()).to.equal("Seer");
      expect(await seer.symbol()).to.equal("SEER");
    });

    it("sets the correct decimals", async function () {
      expect(await seer.decimals()).to.equal(18);
    });
  });

  describe("changeGovernor", function () {
    it("changes the governor when called by the current governor", async function () {
      await seer.changeGovernor(addr1.address);
      expect(await seer.governor()).to.equal(addr1.address);
    });

    it("fails when called by non-governor", async function () {
      await expect(
        seer.connect(addr1).changeGovernor(addr2.address)
      ).to.be.revertedWith("The caller must be the governor");
    });
  });

  describe("mint", function () {
    it("mints tokens when called by governor", async function () {
      await seer.mint(addr1.address, 100);
      expect(await seer.balanceOf(addr1.address)).to.equal(100);
    });

    it("fails when called by non-governor", async function () {
      await expect(
        seer.connect(addr1).mint(addr2.address, 100)
      ).to.be.revertedWith("The caller must be the governor");
    });
  });

  describe("burn", function () {
    beforeEach(async function () {
      await seer.mint(addr1.address, 1000);
    });

    it("burns tokens when called by governor", async function () {
      await seer.burn(addr1.address, 100);
      expect(await seer.balanceOf(addr1.address)).to.equal(900);
    });

    it("fails when called by non-governor", async function () {
      await expect(
        seer.connect(addr1).burn(addr1.address, 100)
      ).to.be.revertedWith("The caller must be the governor");
    });

    it("fails when trying to burn more tokens than available", async function () {
      await expect(seer.burn(addr1.address, 1001)).to.be.reverted;
    });
  });
});

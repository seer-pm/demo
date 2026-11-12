import { time } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { CallbackToken, CollateralToken, RewardCampaigns } from "../../typechain-types";

const POOL_ID = `0x${"ab".repeat(32)}`;
const DAY = 86400;

describe("RewardCampaigns", function () {
  let registry: RewardCampaigns;
  let token: CollateralToken;
  let owner: HardhatEthersSigner;
  let manager: HardhatEthersSigner;
  let bot: HardhatEthersSigner;
  let distributor: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  beforeEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);
    [owner, manager, bot, distributor, other] = await ethers.getSigners();
    registry = await (await ethers.getContractFactory("RewardCampaigns")).deploy(distributor, owner, bot, [manager]);
    token = await (await ethers.getContractFactory("CollateralToken")).deploy();
    await token.mint(manager, 10_000n);
    await token.connect(manager).approve(registry, 10_000n);
  });

  const create = async (perSecond: bigint, budget = 1000n, signer = manager) =>
    registry.connect(signer).createCampaign(POOL_ID, token, perSecond, budget, 60, [7n]);

  const rates = async (id = 0) =>
    (await registry.getCampaign(id)).rates.map((rate) => [Number(rate.from), rate.perSecond]);

  it("creates a campaign starting in its block and takes its budget from the caller", async function () {
    await expect(create(1n, 1000n, other)).to.be.revertedWith("Only a manager");
    await expect(create(0n)).to.be.revertedWith("Missing rate");
    await expect(create(1n, 0n)).to.be.revertedWith("Missing budget");
    await create(5n, 1000n);
    const createdAt = await time.latest();

    const campaign = await registry.getCampaign(0);
    expect(campaign.poolId).to.equal(POOL_ID);
    expect(campaign.budget).to.equal(1000n);
    expect(campaign.minWidthTicks).to.equal(60);
    expect(campaign.excludedTokenIds).to.deep.equal([7n]);
    expect(await rates()).to.deep.equal([[createdAt, 5n]]);
    expect(await token.balanceOf(registry)).to.equal(1000n);
    expect(await token.balanceOf(manager)).to.equal(9000n);
  });

  it("adds deposits to the budget", async function () {
    await create(5n, 1000n);
    await registry.connect(manager).increaseBudget(0, 250n);
    expect((await registry.getCampaign(0)).budget).to.equal(1250n);
    expect(await token.balanceOf(registry)).to.equal(1250n);
    await expect(registry.connect(other).increaseBudget(0, 1n)).to.be.revertedWith("Only a manager");
  });

  it("appends each rate change from its block and keeps the earlier rates", async function () {
    await create(5n);
    const start = await time.latest();
    await time.increase(DAY);
    await registry.connect(manager).setRate(0, 3n);
    const changed = await time.latest();
    await time.increase(DAY);
    await registry.connect(manager).setRate(0, 0n);
    const ended = await time.latest();

    expect(await rates()).to.deep.equal([
      [start, 5n],
      [changed, 3n],
      [ended, 0n],
    ]);
    await expect(registry.connect(other).setRate(0, 1n)).to.be.revertedWith("Only a manager");
    await expect(registry.connect(manager).setRate(1, 1n)).to.be.revertedWith("Unknown campaign");
  });

  it("replaces a rate set earlier in the same block, so rates stay strictly increasing", async function () {
    await network.provider.send("evm_setAutomine", [false]);
    // Fixed gas limits: estimating against the last mined block would see no campaign yet.
    const created = await registry
      .connect(manager)
      .createCampaign(POOL_ID, token, 5n, 1000n, 60, [], { gasLimit: 500_000 });
    const changed = await registry.connect(manager).setRate(0, 9n, { gasLimit: 200_000 });
    await network.provider.send("evm_mine");
    await network.provider.send("evm_setAutomine", [true]);

    const [a, b] = await Promise.all([created.wait(), changed.wait()]);
    expect(b!.blockNumber).to.equal(a!.blockNumber);
    expect(await rates()).to.deep.equal([[await time.latest(), 9n]]);
  });

  it("releases only the newly emitted amount to the distributor, never above the budget", async function () {
    await create(5n, 1000n);
    const cutoff = (await time.latest()) + DAY;
    await time.increaseTo(cutoff + 3600);

    await expect(registry.connect(other).release([0], [300n], cutoff)).to.be.revertedWith("Only the releaser");
    await expect(registry.connect(bot).release([0], [1001n], cutoff)).to.be.revertedWith("Over budget");
    await expect(registry.connect(bot).release([0], [1n], cutoff + 7200)).to.be.revertedWith("Cutoff in the future");

    await registry.connect(bot).release([0], [300n], cutoff);
    // Repeating the same week, or a lower total, sends nothing more.
    await registry.connect(bot).release([0], [300n], cutoff);
    await registry.connect(bot).release([0], [200n], cutoff);
    expect(await token.balanceOf(distributor)).to.equal(300n);

    await registry.connect(bot).release([0], [450n], cutoff);
    expect(await token.balanceOf(distributor)).to.equal(450n);
    expect(await token.balanceOf(registry)).to.equal(550n);
    const [r] = await registry.getReleases();
    expect([r.released, Number(r.upTo)]).to.deep.equal([450n, cutoff]);
  });

  it("credits what an ended campaign did not emit to its depositor once its final week is released", async function () {
    await create(5n, 1000n);
    await time.increase(DAY);
    await expect(registry.connect(manager).settleRefund(0)).to.be.revertedWith("Campaign not ended");
    await registry.connect(manager).setRate(0, 0n);
    const end = await time.latest();

    // A week released with a cutoff before the end may still be followed by more emission.
    await registry.connect(bot).release([0], [400n], end - 1);
    await expect(registry.connect(manager).settleRefund(0)).to.be.revertedWith("Final week not released");

    await time.increase(DAY);
    await registry.connect(bot).release([0], [420n], end + DAY);
    // Anyone may settle: the credit only goes to the depositor, and nothing moves until it withdraws.
    await expect(registry.connect(other).settleRefund(0))
      .to.emit(registry, "RefundCredited")
      .withArgs(0, manager.address, 580n);
    expect(await token.balanceOf(manager)).to.equal(9000n);
    expect(await registry.refundable(token, manager)).to.equal(580n);
    expect((await registry.getCampaign(0)).budget).to.equal(420n);
    expect(await registry.getDeposits(0)).to.deep.equal([]);

    // A second settle credits nothing more.
    await registry.connect(other).settleRefund(0);
    expect(await registry.refundable(token, manager)).to.equal(580n);

    await expect(registry.connect(other).withdrawRefund(token)).to.be.revertedWith("Nothing to withdraw");
    await registry.connect(manager).withdrawRefund(token);
    expect(await token.balanceOf(manager)).to.equal(9580n);
    expect(await token.balanceOf(registry)).to.equal(0n);
    expect(await registry.refundable(token, manager)).to.equal(0n);
    await expect(registry.connect(manager).withdrawRefund(token)).to.be.revertedWith("Nothing to withdraw");
  });

  it("splits a refund among depositors in proportion to their deposits, each withdrawing its own", async function () {
    await token.mint(owner, 3000n);
    await token.connect(owner).approve(registry, 3000n);
    await create(5n, 1000n);
    await registry.connect(owner).increaseBudget(0, 3000n);
    await registry.connect(manager).increaseBudget(0, 1n);
    expect((await registry.getDeposits(0)).map((d) => [d.depositor, d.amount])).to.deep.equal([
      [manager.address, 1001n],
      [owner.address, 3000n],
    ]);
    // A manager who is removed still gets their deposit back.
    await registry.setManager(manager, false);
    await registry.setRate(0, 0n);
    const end = await time.latest();
    await time.increase(DAY);
    await registry.connect(bot).release([0], [2001n], end + 1);
    await registry.connect(other).settleRefund(0);

    // 2000 unspent of 4001 deposited: floor(2000 * 1001 / 4001) = 500, then floor(2000 * 4001 / 4001) - 500.
    expect(await registry.refundable(token, manager)).to.equal(500n);
    expect(await registry.refundable(token, owner)).to.equal(1500n);

    // One depositor withdrawing leaves the other's credit in place.
    await registry.connect(manager).withdrawRefund(token);
    expect(await token.balanceOf(manager)).to.equal(9000n - 1n + 500n);
    expect(await token.balanceOf(registry)).to.equal(1500n);
    const before = await token.balanceOf(owner);
    await registry.connect(owner).withdrawRefund(token);
    expect((await token.balanceOf(owner)) - before).to.equal(1500n);
    expect(await token.balanceOf(registry)).to.equal(0n);
  });

  it("never credits a depositor more than it deposited when the shares round", async function () {
    await registry.setManager(other, true);
    for (const signer of [owner, other]) {
      await token.mint(signer, 100n);
      await token.connect(signer).approve(registry, 100n);
    }
    await create(5n, 100n);
    await registry.connect(owner).increaseBudget(0, 100n);
    await registry.connect(other).increaseBudget(0, 1n);
    await registry.connect(manager).setRate(0, 0n);
    const end = await time.latest();
    await time.increase(DAY);
    await registry.connect(bot).release([0], [1n], end + 1);
    await registry.connect(other).settleRefund(0);

    // 200 unspent of 201 deposited, split by floored cumulative shares: 99, 199 - 99 and 200 - 199.
    expect(await registry.refundable(token, manager)).to.equal(99n);
    expect(await registry.refundable(token, owner)).to.equal(100n);
    expect(await registry.refundable(token, other)).to.equal(1n);
  });

  it("does not let a token callback settle a campaign in the middle of a deposit", async function () {
    const hooked: CallbackToken = await (await ethers.getContractFactory("CallbackToken")).deploy();
    await hooked.mint(manager, 2000n);
    await hooked.connect(manager).approve(registry, 2000n);
    await registry.connect(manager).createCampaign(POOL_ID, hooked, 5n, 1000n, 0, []);
    await registry.connect(manager).setRate(0, 0n);
    const end = await time.latest();
    await time.increase(DAY);
    await registry.connect(bot).release([0], [100n], end + 1);

    // Settling inside the transfer would see the new budget before the deposit that funds it is recorded.
    await hooked.setCallback(registry, registry.interface.encodeFunctionData("settleRefund", [0]));
    await expect(registry.connect(manager).increaseBudget(0, 500n)).to.be.revertedWithCustomError(
      registry,
      "ReentrancyGuardReentrantCall",
    );
  });

  it("adds up a depositor's credits across campaigns of the same token", async function () {
    await create(5n, 1000n);
    await create(5n, 500n);
    await registry.connect(manager).setRate(0, 0n);
    await registry.connect(manager).setRate(1, 0n);
    const end = await time.latest();
    await time.increase(DAY);
    await registry.connect(bot).release([0, 1], [100n, 50n], end + 1);
    await registry.connect(other).settleRefund(0);
    await registry.connect(other).settleRefund(1);

    expect(await registry.refundable(token, manager)).to.equal(1350n);
    await registry.connect(manager).withdrawRefund(token);
    expect(await token.balanceOf(manager)).to.equal(10_000n - 1500n + 1350n);
  });

  it("refunds a restart only to the wallets that funded it", async function () {
    await token.mint(other, 500n);
    await token.connect(other).approve(registry, 500n);
    await registry.setManager(other, true);
    await create(5n, 1000n);
    await registry.connect(manager).setRate(0, 0n);
    let end = await time.latest();
    await registry.connect(bot).release([0], [1000n], end + 1);
    await time.increase(DAY);
    await registry.connect(manager).settleRefund(0);

    // Restarted with new funds from another wallet, of which 200 are emitted.
    await registry.connect(other).increaseBudget(0, 500n);
    await registry.connect(other).setRate(0, 5n);
    await time.increase(DAY);
    await registry.connect(other).setRate(0, 0n);
    end = await time.latest();
    await time.increase(DAY);
    await registry.connect(bot).release([0], [1200n], end + 1);
    await registry.connect(manager).settleRefund(0);

    expect(await registry.refundable(token, other)).to.equal(300n);
    expect(await registry.refundable(token, manager)).to.equal(0n);
  });

  it("keeps each campaign's escrow apart", async function () {
    await create(5n, 1000n);
    await create(5n, 500n);
    await registry.connect(manager).setRate(1, 0n);
    const end = await time.latest();
    await time.increase(DAY);
    await registry.connect(bot).release([0, 1], [900n, 100n], end + 1);
    await registry.connect(other).settleRefund(1);
    await registry.connect(manager).withdrawRefund(token);
    // Campaign 0 still holds what it has not emitted.
    expect(await token.balanceOf(registry)).to.equal(100n);
    expect(await token.balanceOf(distributor)).to.equal(1000n);
  });

  it("updates the settings and emits the whole campaign on every change", async function () {
    await create(1n);
    await expect(registry.connect(manager).updateSettings(0, 0, [1n, 2n]))
      .to.emit(registry, "CampaignSet")
      .withArgs(0, (campaign: { minWidthTicks: bigint; excludedTokenIds: bigint[] }) => {
        return campaign.minWidthTicks === 0n && campaign.excludedTokenIds.join() === "1,2";
      });
    await expect(registry.connect(other).updateSettings(0, 0, [])).to.be.revertedWith("Only a manager");
    await expect(registry.connect(manager).updateSettings(1, 0, [])).to.be.revertedWith("Unknown campaign");
  });

  it("lets only the owner manage managers, the releaser and ownership", async function () {
    await expect(registry.connect(manager).setManager(other, true)).to.be.revertedWith("Only the owner");
    await expect(registry.connect(manager).setReleaser(other)).to.be.revertedWith("Only the owner");
    await registry.setReleaser(other);
    expect(await registry.releaser()).to.equal(other.address);
    await registry.setManager(manager, false);
    expect(await registry.isManager(manager)).to.equal(false);
    await registry.setOwner(other);
    expect(await registry.owner()).to.equal(other.address);
    await expect(registry.setManager(manager, true)).to.be.revertedWith("Only the owner");
  });
});

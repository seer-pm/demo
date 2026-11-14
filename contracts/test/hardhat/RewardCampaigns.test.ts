import { time } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import type { ContractTransactionResponse } from "ethers";
import { ethers, network } from "hardhat";
import { CollateralToken, RewardCampaigns } from "../../typechain-types";

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
    registry.connect(signer).createCampaign(POOL_ID, token, perSecond, budget, 60);

  const rates = async (id = 0) =>
    (await registry.getCampaign(id)).rates.map((rate) => [Number(rate.from), rate.perSecond]);

  // The network also mines empty blocks on an interval, so the latest block can be later than `tx`'s.
  const minedAt = async (tx: ContractTransactionResponse) =>
    (await ethers.provider.getBlock((await tx.wait())!.blockNumber))!.timestamp;

  it("creates a campaign starting in its block and takes its budget from the caller", async function () {
    await expect(create(1n, 1000n, other)).to.be.revertedWith("Only a manager");
    await expect(create(0n)).to.be.revertedWith("Missing rate");
    await expect(create(1n, 0n)).to.be.revertedWith("Missing budget");
    const createdAt = await minedAt(await create(5n, 1000n));

    const campaign = await registry.getCampaign(0);
    expect(campaign.poolId).to.equal(POOL_ID);
    expect(campaign.budget).to.equal(1000n);
    expect(campaign.minWidthTicks).to.equal(60);
    expect(await rates()).to.deep.equal([[createdAt, 5n]]);
    expect(await token.balanceOf(registry)).to.equal(1000n);
    expect(await token.balanceOf(manager)).to.equal(9000n);
    expect(await registry.getFunders()).to.deep.equal([manager.address]);
  });

  it("accepts a minimum width up to the full V4 tick range and no wider", async function () {
    // MAX_TICK - MIN_TICK = 887272 - (-887272): no position can be wider.
    await expect(
      registry.connect(manager).createCampaign(POOL_ID, token, 1n, 1000n, 1_774_545),
    ).to.be.revertedWith("Width too wide");
    await registry.connect(manager).createCampaign(POOL_ID, token, 1n, 1000n, 1_774_544);
    expect((await registry.getCampaign(0)).minWidthTicks).to.equal(1_774_544);
  });

  it("appends each rate change from its block and keeps the earlier rates", async function () {
    const start = await minedAt(await create(5n));
    await time.increase(DAY);
    const change = await registry.connect(manager).setRate(0, 3n);
    // The bot rebuilds campaigns from these events, so each change emits the whole campaign.
    await expect(change)
      .to.emit(registry, "CampaignSet")
      .withArgs(0, (campaign: { rates: { perSecond: bigint }[] }) =>
        campaign.rates.map((r) => r.perSecond).join() === "5,3",
      );
    const changed = await minedAt(change);
    await time.increase(DAY);
    const ended = await minedAt(await registry.connect(manager).setRate(0, 0n));

    expect(await rates()).to.deep.equal([
      [start, 5n],
      [changed, 3n],
      [ended, 0n],
    ]);
    // An ended campaign stays ended: more rewards for the pool are a new campaign.
    await expect(registry.connect(manager).setRate(0, 1n)).to.be.revertedWith("Campaign ended");
    await expect(registry.connect(manager).setRate(1, 1n)).to.be.revertedWith("Unknown campaign");
  });

  it("lets only the funder or the owner change a campaign", async function () {
    await registry.setManager(other, true);
    await create(5n);
    await expect(registry.connect(other).setRate(0, 1n)).to.be.revertedWith("Only the funder or the owner");
    await registry.connect(owner).setRate(0, 2n);
    // A funder removed as manager keeps control of what it funded.
    await registry.setManager(manager, false);
    await registry.connect(manager).setRate(0, 3n);
    expect((await rates()).map(([, perSecond]) => perSecond)).to.deep.equal([5n, 2n, 3n]);
  });

  it("replaces a rate set earlier in the same block, so rates stay strictly increasing", async function () {
    // Interval mining could otherwise mine a block between the two transactions.
    await network.provider.send("evm_setIntervalMining", [0]);
    await network.provider.send("evm_setAutomine", [false]);
    // Fixed gas limits: estimating against the last mined block would see no campaign yet.
    const created = await registry
      .connect(manager)
      .createCampaign(POOL_ID, token, 5n, 1000n, 60, { gasLimit: 500_000 });
    const changed = await registry.connect(manager).setRate(0, 9n, { gasLimit: 200_000 });
    await network.provider.send("evm_mine");
    await network.provider.send("evm_setAutomine", [true]);
    await network.provider.send("evm_setIntervalMining", [100]);

    const [a, b] = await Promise.all([created.wait(), changed.wait()]);
    expect(b!.blockNumber).to.equal(a!.blockNumber);
    const block = await ethers.provider.getBlock(a!.blockNumber);
    expect(await rates()).to.deep.equal([[block!.timestamp, 9n]]);
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

  it("refunds at once what an ended campaign cannot have emitted, and the rest once its final week is released", async function () {
    const start = await minedAt(await create(1n, 1000n));
    await time.increase(99);
    await expect(registry.connect(manager).settleRefund(0)).to.be.revertedWith("Campaign not ended");
    const end = await minedAt(await registry.connect(manager).setRate(0, 0n));
    // Nothing is released yet, and at 1 per second the campaign emitted at most `end - start`.
    const held = BigInt(end - start);

    // Anyone may settle, since the tokens only go to the funder, even one that is no longer a manager.
    await registry.setManager(manager, false);
    await expect(registry.connect(other).settleRefund(0))
      .to.emit(registry, "Refunded")
      .withArgs(0, manager.address, 1000n - held);
    expect((await registry.getCampaign(0)).budget).to.equal(held);
    expect(await token.balanceOf(manager)).to.equal(10_000n - held);
    await expect(registry.connect(other).settleRefund(0)).to.be.revertedWith("Nothing to refund");

    // The pool was out of range part of the time, so the bot released less than the most it could emit.
    await time.increase(DAY);
    await registry.connect(bot).release([0], [60n], end + DAY);
    await expect(registry.connect(other).settleRefund(0))
      .to.emit(registry, "Refunded")
      .withArgs(0, manager.address, held - 60n);
    expect((await registry.getCampaign(0)).budget).to.equal(60n);
    expect(await token.balanceOf(manager)).to.equal(10_000n - 60n);
    expect(await token.balanceOf(registry)).to.equal(0n);
    await expect(registry.connect(other).settleRefund(0)).to.be.revertedWith("Nothing to refund");
  });

  it("holds only what the rates since the last release can emit, which the final release always fits in", async function () {
    const start = await minedAt(await create(2n, 1000n));
    await time.increase(50);
    const cutoff = start + 40;
    await registry.connect(bot).release([0], [80n], cutoff);
    const changed = await minedAt(await registry.connect(manager).setRate(0, 3n));
    await time.increase(20);
    const end = await minedAt(await registry.connect(manager).setRate(0, 0n));
    // 2 per second from the cutoff to the rate change, then 3 per second until the end.
    const max = BigInt(2 * (changed - cutoff) + 3 * (end - changed));

    await registry.connect(other).settleRefund(0);
    expect(await token.balanceOf(manager)).to.equal(9000n + 1000n - 80n - max);
    // Liquidity was in range all along, so the campaign emitted the whole maximum and nothing more comes back.
    await registry.connect(bot).release([0], [80n + max], end);
    expect(await token.balanceOf(distributor)).to.equal(80n + max);
    expect(await token.balanceOf(registry)).to.equal(0n);
    await expect(registry.connect(other).settleRefund(0)).to.be.revertedWith("Nothing to refund");
  });

  it("refunds nothing while the whole budget may still be owed", async function () {
    await create(5n, 100n);
    await time.increase(DAY);
    await registry.connect(manager).setRate(0, 0n);
    await expect(registry.connect(other).settleRefund(0)).to.be.revertedWith("Nothing to refund");
    const end = await time.latest();
    await registry.connect(bot).release([0], [70n], end);
    await registry.connect(other).settleRefund(0);
    expect(await token.balanceOf(manager)).to.equal(10_000n - 70n);
  });

  it("keeps each campaign's escrow apart", async function () {
    await create(5n, 1000n);
    await create(5n, 500n);
    const end = await minedAt(await registry.connect(manager).setRate(1, 0n));
    await time.increase(DAY);
    await registry.connect(bot).release([0, 1], [900n, 100n], end + 1);
    await registry.connect(other).settleRefund(1);
    expect(await token.balanceOf(manager)).to.equal(10_000n - 1500n + 400n);
    // Campaign 0 still holds what it has not emitted.
    expect(await token.balanceOf(registry)).to.equal(100n);
    expect(await token.balanceOf(distributor)).to.equal(1000n);
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

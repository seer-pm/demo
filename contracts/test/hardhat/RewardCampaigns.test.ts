import { time } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { rewardCampaignsAbi } from "@seer-pm/rewards/claims";
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
    await expect(create(1001n, 1000n)).to.be.revertedWith("Rate over budget");
    // A rate is at most the budget, so a 128-bit budget keeps rate × time within 256 bits.
    await expect(create(1n, 2n ** 128n)).to.be.revertedWith("Budget too large");
    const createdAt = await minedAt(await create(5n, 1000n));

    const campaign = await registry.getCampaign(0);
    expect(campaign.poolId).to.equal(POOL_ID);
    expect(campaign.budget).to.equal(1000n);
    expect(campaign.minWidthTicks).to.equal(60);
    expect(await rates()).to.deep.equal([[createdAt, 5n]]);
    expect(await token.balanceOf(registry)).to.equal(1000n);
    expect(await token.balanceOf(manager)).to.equal(9000n);
    expect(campaign.funder).to.equal(manager.address);
    expect(campaign.released).to.equal(0n);
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

  it("lets only the funder change a campaign", async function () {
    await registry.setManager(other, true);
    await create(5n);
    await expect(registry.connect(other).setRate(0, 1n)).to.be.revertedWith("Only the funder");
    await expect(registry.connect(manager).setRate(0, 1001n)).to.be.revertedWith("Rate over budget");
    await expect(registry.connect(owner).setRate(0, 2n)).to.be.revertedWith("Only the funder");
    await expect(create(1n, 1000n, owner)).to.be.revertedWith("Only a manager");
    // A funder removed as manager keeps control of what it funded.
    await registry.setManager(manager, false);
    await registry.connect(manager).setRate(0, 3n);
    expect((await rates()).map(([, perSecond]) => perSecond)).to.deep.equal([5n, 3n]);
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

    await expect(registry.connect(other).release([0], [300n], cutoff)).to.be.revertedWith(
      "Only the releaser",
    );
    await expect(registry.connect(bot).release([0], [1001n], cutoff)).to.be.revertedWith("Over budget");
    await expect(registry.connect(bot).release([0], [1n], cutoff + 7200)).to.be.revertedWith("Cutoff in the future");

    await registry.connect(bot).release([0], [300n], cutoff);
    // Repeating the same week, or a lower total, sends nothing more.
    await registry.connect(bot).release([0], [300n], cutoff);
    await registry.connect(bot).release([0], [200n], cutoff);
    expect(await token.balanceOf(distributor)).to.equal(300n);

    await registry.connect(bot).release([0], [450n], cutoff + 1800);
    expect(await token.balanceOf(distributor)).to.equal(450n);
    expect(await token.balanceOf(registry)).to.equal(550n);
    // A correction pays only the difference and records its own cutoff, not the latest cutoff.
    const correction = await registry.connect(bot).release([0], [451n], cutoff);
    await expect(correction).to.emit(registry, "Released").withArgs(0, 1n, 451n, cutoff);
    expect((await registry.getCampaigns())[0].released).to.equal(451n);
    const snapshots = await registry.queryFilter(registry.filters.CampaignSet());
    expect(snapshots).to.have.length(1); // Weekly payments do not change the bot's earning history.
    const botInterface = new ethers.Interface(rewardCampaignsAbi);
    const snapshot = botInterface.parseLog(snapshots[0])!.args.campaign;
    expect([snapshot.poolId, snapshot.rewardToken, snapshot.funder, snapshot.budget, snapshot.released,
      snapshot.minWidthTicks, snapshot.rates[0].perSecond]).to.deep.equal([
      POOL_ID, await token.getAddress(), manager.address, 1000n, 0n, 60n, 5n,
    ]);
  });

  it("bounds cumulative releases by all rate tiers through the cutoff", async function () {
    const start = await minedAt(await create(2n, 1000n));
    await time.increase(10);
    const changed = await minedAt(await registry.connect(manager).setRate(0, 3n));
    await time.increase(30);
    const first = changed + 5;
    // 2 per second until the rate change, then 3 per second up to the cutoff.
    const max = BigInt(2 * (changed - start) + 3 * 5);

    await expect(registry.connect(bot).release([0], [1000n], await time.latest())).to.be.revertedWith("Over rate");
    await expect(registry.connect(bot).release([0], [max + 1n], first)).to.be.revertedWith("Over rate");
    await registry.connect(bot).release([0], [max], first);

    // Ten more seconds at rate 3 add exactly 30 to the cumulative cap.
    const second = first + 10;
    await expect(registry.connect(bot).release([0], [max + 31n], second)).to.be.revertedWith("Over rate");
    await registry.connect(bot).release([0], [max + 30n], second);
    expect(await token.balanceOf(distributor)).to.equal(max + 30n);
    expect((await registry.getCampaign(0)).released).to.equal(max + 30n);
  });

  for (const closeFirst of [true, false]) {
    it(`pays earned rewards and refunds only the surplus (close first: ${closeFirst})`, async function () {
      const urd = await (await ethers.getContractFactory("RewardsRootMock")).deploy();
      registry = await (await ethers.getContractFactory("RewardCampaigns")).deploy(urd, owner, bot, [manager]);
      await token.connect(manager).approve(registry, 10000n);
      const start = await minedAt(await create(1n));
      await create(1n);
      await time.increase(100);
      const pay = () => registry.connect(bot).release([0, 1], [60n, 30n], start + 100);
      if (!closeFirst) await pay();
      await registry.setManager(manager, false);
      const end = await minedAt(await registry.connect(manager).setRate(0, 0));
      expect((await registry.getCampaign(0)).budget).to.equal(BigInt(end - start));
      expect(await token.balanceOf(manager)).to.equal(9000n - BigInt(end - start));
      if (closeFirst) await pay();
      const chain = (await ethers.provider.getNetwork()).chainId;
      const leaf = ethers.keccak256(ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address", "uint256", "uint64", "uint256"], [chain, await registry.getAddress(), 0, end, 70],
      )));
      const sibling = ethers.id("other leaf");
      const root = ethers.keccak256(ethers.concat([leaf, sibling].sort()));
      const settle = () => registry.connect(other).settleRefund(0, 70n, [sibling]);
      await expect(registry.settleRefund(0, 60n, [sibling])).to.be.revertedWith("Invalid settlement proof");
      await urd.accept(root);
      await expect(settle()).to.be.revertedWith("Not released");
      await registry.connect(bot).release([0], [70n], end);
      await expect(registry.settleRefund(0, 69n, [sibling])).to.be.revertedWith("Invalid settlement proof");
      await settle();
      await settle();
      expect(await token.balanceOf(manager)).to.equal(8930n);
      expect(await token.balanceOf(urd)).to.equal(100n);
      expect(await token.balanceOf(registry)).to.equal(970n);
    });
  }

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

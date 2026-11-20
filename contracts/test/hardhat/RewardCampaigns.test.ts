import { time } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { SimpleMerkleTree } from "@openzeppelin/merkle-tree";
import { rewardCampaignsAbi } from "@seer-pm/rewards/claims";
import { expect } from "chai";
import type { ContractTransactionResponse } from "ethers";
import { ethers, network } from "hardhat";
import { CollateralToken, RewardCampaigns, RewardsRootMock } from "../../typechain-types";

const POOL_ID = `0x${"ab".repeat(32)}`;
const DAY = 86400;

describe("RewardCampaigns", function () {
  let registry: RewardCampaigns;
  let token: CollateralToken;
  let urd: RewardsRootMock;
  let owner: HardhatEthersSigner;
  let manager: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  beforeEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);
    [owner, manager, other] = await ethers.getSigners();
    urd = await (await ethers.getContractFactory("RewardsRootMock")).deploy();
    registry = await (await ethers.getContractFactory("RewardCampaigns")).deploy(urd, owner, [manager]);
    token = await (await ethers.getContractFactory("CollateralToken")).deploy();
    await token.mint(manager, 10_000n);
    await token.connect(manager).approve(registry, 10_000n);
  });

  const create = async (perSecond: bigint, budget = 1000n, signer = manager) =>
    registry.connect(signer).createCampaign(POOL_ID, token, perSecond, budget, 60);

  const rates = async (id = 0) =>
    (await registry.getCampaign(id)).rates.map((rate) => [Number(rate.from), rate.perSecond]);

  const coder = ethers.AbiCoder.defaultAbiCoder();
  const leaf = (types: string[], values: unknown[]) => ethers.keccak256(ethers.keccak256(coder.encode(types, values)));
  const chainId = async () => (await ethers.provider.getNetwork()).chainId;
  const releaseLeaf = async (id: number, upTo: number, emitted: bigint) =>
    leaf(
      ["string", "uint256", "address", "uint256", "uint64", "uint256"],
      ["release", await chainId(), await registry.getAddress(), id, upTo, emitted],
    );
  const settlementLeaf = async (id: number, end: number, emitted: bigint) =>
    leaf(
      ["uint256", "address", "uint256", "uint64", "uint256"],
      [await chainId(), await registry.getAddress(), id, end, emitted],
    );
  // A root with what the bot publishes for `upTo`: one release leaf per campaign, plus any other leaves.
  const publish = async (upTo: number, totals: [number, bigint][], extra: string[] = []) => {
    const leaves = [...(await Promise.all(totals.map(([id, e]) => releaseLeaf(id, upTo, e)))), ...extra];
    const tree = SimpleMerkleTree.of(leaves);
    return {
      root: tree.root,
      proofs: totals.map((_, i) => tree.getProof(i)),
      proof: (i: number) => tree.getProof(totals.length + i),
    };
  };
  // Accepts a root proving `totals` at `upTo` and releases them from an account with no role.
  const release = async (upTo: number, totals: [number, bigint][]) => {
    const { root, proofs } = await publish(upTo, totals);
    await urd.accept(root);
    return registry.connect(other).release(
      totals.map(([id]) => id),
      totals.map(([, e]) => e),
      upTo,
      proofs,
    );
  };

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

    await expect(release(cutoff, [[0, 1001n]])).to.be.revertedWith("Over budget");
    await expect(release(cutoff + 7200, [[0, 1n]])).to.be.revertedWith("Cutoff in the future");
    await expect(registry.release([0], [300n], cutoff, [])).to.be.revertedWith("Length mismatch");

    await release(cutoff, [[0, 300n]]);
    // Repeating the same week, or a lower total, sends nothing more.
    await release(cutoff, [[0, 300n]]);
    await release(cutoff, [[0, 200n]]);
    expect(await token.balanceOf(urd)).to.equal(300n);

    await release(cutoff + 1800, [[0, 450n]]);
    expect(await token.balanceOf(urd)).to.equal(450n);
    expect(await token.balanceOf(registry)).to.equal(550n);
    // A correction pays only the difference and records its own cutoff, not the latest cutoff.
    const correction = await release(cutoff, [[0, 451n]]);
    await expect(correction).to.emit(registry, "Released").withArgs(0, 1n, 451n, cutoff);
    expect((await registry.getCampaigns(0, 1))[0].released).to.equal(451n);
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

    // Even a total the accepted root proves is capped by the rates.
    await expect(release(await time.latest(), [[0, 1000n]])).to.be.revertedWith("Over rate");
    await expect(release(first, [[0, max + 1n]])).to.be.revertedWith("Over rate");
    await release(first, [[0, max]]);

    // Ten more seconds at rate 3 add exactly 30 to the cumulative cap.
    const second = first + 10;
    await expect(release(second, [[0, max + 31n]])).to.be.revertedWith("Over rate");
    await release(second, [[0, max + 30n]]);
    expect(await token.balanceOf(urd)).to.equal(max + 30n);
    expect((await registry.getCampaign(0)).released).to.equal(max + 30n);
  });

  it("releases only a total the distributor's accepted root proves for that campaign and cutoff", async function () {
    await create(5n, 1000n);
    await create(5n, 1000n);
    const cutoff = (await time.latest()) + 10;
    await time.increaseTo(cutoff + 10);
    const { root, proofs } = await publish(cutoff, [
      [0, 30n],
      [1, 20n],
    ]);
    const send = (id: number, emitted: bigint, upTo = cutoff, proof = proofs[id]) =>
      registry.connect(other).release([id], [emitted], upTo, [proof]);

    // A root that is only pending, or was never submitted, pays nothing.
    await expect(send(0, 30n)).to.be.revertedWith("Invalid release proof");
    await urd.accept(root);
    await expect(send(0, 31n)).to.be.revertedWith("Invalid release proof");
    await expect(send(0, 30n, cutoff - 1)).to.be.revertedWith("Invalid release proof");
    await expect(send(1, 30n, cutoff, proofs[0])).to.be.revertedWith("Invalid release proof");
    // A settlement leaf of the same words is not a release leaf.
    const settlement = await settlementLeaf(0, cutoff, 30n);
    const mixed = SimpleMerkleTree.of([settlement, ethers.id("other leaf")]);
    await urd.accept(mixed.root);
    await expect(send(0, 30n, cutoff, mixed.getProof(0))).to.be.revertedWith("Invalid release proof");

    await urd.accept(root);
    await send(0, 30n);
    await send(1, 20n);
    expect(await token.balanceOf(urd)).to.equal(50n);
  });

  it("keeps each campaign's escrow apart", async function () {
    const start = await minedAt(await create(1n, 1000n));
    await create(1n, 500n);
    await time.increase(100);
    const end = await minedAt(await registry.connect(manager).setRate(1, 0n));
    const { root, proofs, proof } = await publish(
      end,
      [
        [0, 50n],
        [1, 60n],
      ],
      [await settlementLeaf(1, end, 60n)],
    );
    expect(end - start).to.be.greaterThan(50);
    await urd.accept(root);
    await registry.connect(other).release([0, 1], [50n, 60n], end, proofs);
    await registry.connect(other).settleRefund(1, 60n, proof(0));
    expect((await registry.getCampaign(1)).budget).to.equal(60n);
    expect(await token.balanceOf(manager)).to.equal(10_000n - 1500n + 440n);
    // Campaign 0 still holds what it has not emitted.
    expect((await registry.getCampaign(0)).budget).to.equal(1000n);
    expect(await token.balanceOf(registry)).to.equal(950n);
    expect(await token.balanceOf(urd)).to.equal(110n);
  });

  it("settles no refund for a campaign that has not ended", async function () {
    const start = await minedAt(await create(1n, 1000n));
    await time.increase(10);
    const { root, proof } = await publish(start + 5, [[0, 5n]], [await settlementLeaf(0, start, 5n)]);
    await urd.accept(root);
    await expect(registry.settleRefund(0, 5n, proof(0))).to.be.revertedWith("Campaign not ended");
  });

  for (const closeFirst of [true, false]) {
    it(`pays earned rewards and refunds only the surplus (close first: ${closeFirst})`, async function () {
      const start = await minedAt(await create(1n));
      await create(1n);
      await time.increase(100);
      const pay = () =>
        release(start + 100, [
          [0, 60n],
          [1, 30n],
        ]);
      if (!closeFirst) await pay();
      await registry.setManager(manager, false);
      const end = await minedAt(await registry.connect(manager).setRate(0, 0));
      expect((await registry.getCampaign(0)).budget).to.equal(BigInt(end - start));
      expect(await token.balanceOf(manager)).to.equal(9000n - BigInt(end - start));
      if (closeFirst) await pay();
      // The final week's root proves both the release of the final total and the settlement on it.
      const final = await publish(end, [[0, 70n]], [await settlementLeaf(0, end, 70n)]);
      const settle = () => registry.connect(other).settleRefund(0, 70n, final.proof(0));
      // Until the final root is accepted, the root proves only the earlier release.
      await expect(registry.settleRefund(0, 60n, final.proof(0))).to.be.revertedWith("Invalid settlement proof");
      await urd.accept(final.root);
      await expect(settle()).to.be.revertedWith("Not released");
      await registry.connect(other).release([0], [70n], end, final.proofs);
      await expect(registry.settleRefund(0, 69n, final.proof(0))).to.be.revertedWith("Invalid settlement proof");
      await settle();
      await settle();
      expect(await token.balanceOf(manager)).to.equal(8930n);
      expect(await token.balanceOf(urd)).to.equal(100n);
      expect(await token.balanceOf(registry)).to.equal(970n);
    });
  }

  it("pages campaigns by id, stopping at the last one", async function () {
    for (const budget of [100n, 200n, 300n]) await create(1n, budget);
    const budgets = async (from: number, to: bigint | number) =>
      (await registry.getCampaigns(from, to)).map((c) => c.budget);
    expect(await budgets(0, 3)).to.deep.equal([100n, 200n, 300n]);
    expect(await budgets(1, 2)).to.deep.equal([200n]);
    // A page past the last campaign is cut short, and a range with nothing in it is empty rather than a revert.
    expect(await budgets(2, 100)).to.deep.equal([300n]);
    expect(await budgets(1, ethers.MaxUint256)).to.deep.equal([200n, 300n]);
    expect(await budgets(3, 100)).to.deep.equal([]);
    expect(await budgets(2, 1)).to.deep.equal([]);
  });

  it("lets only the owner manage managers and ownership", async function () {
    await expect(registry.connect(manager).setManager(other, true)).to.be.revertedWith("Only the owner");
    await registry.setManager(manager, false);
    expect(await registry.isManager(manager)).to.equal(false);
    await registry.setOwner(other);
    expect(await registry.owner()).to.equal(other.address);
    await expect(registry.setManager(manager, true)).to.be.revertedWith("Only the owner");
  });
});

// SPDX-License-Identifier: MIT
import { expect } from "chai";
import { ethers, network } from "hardhat";

import {
  FutarchyFactory,
  FutarchyRouter,
  FutarchyProposal,
  IERC20,
  RealityETH_v3_0,
} from "../../typechain-types";
import { Addressable, Signer } from "ethers";

describe("FutarchyFactory Simple Tests", function () {
  let futarchyFactory: FutarchyFactory,
    futarchyRouter: FutarchyRouter,
    realitio: RealityETH_v3_0,
    collateralToken1: IERC20,
    collateralToken2: IERC20;

  const MIN_BOND = 1e16;
  const PROPOSAL_APPROVED = ethers.zeroPadBytes("0x", 32);

  const WHALE = "0xba12222222228d8ba445958a75a0704d566bf2c8";

  before(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: "https://gnosis-pokt.nodies.app",
          },
        },
      ],
    });
    await network.provider.send("evm_setAutomine", [true]);

    collateralToken1 = (await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb"
    )) as unknown as IERC20;
    collateralToken2 = (await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1"
    )) as unknown as IERC20;

    const proposal: FutarchyProposal = await (
      await ethers.getContractFactory("FutarchyProposal")
    ).deploy();

    futarchyFactory = await (
      await ethers.getContractFactory("FutarchyFactory")
    ).deploy(
      proposal.target,
      "0xe40DD83a262da3f56976038F1554Fe541Fa75ecd", // arbitrator
      "0xE78996A233895bE74a66F451f1019cA9734205cc", // realitio
      "0xD194319D1804C1051DD21Ba1Dc931cA72410B79f", // wrapped1155Factory
      "0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce", // conditionalTokens
      "0x03E1fCfE3F1edc5833001588fb6377cB50A61cfc", // realityProxy
      1.5 * 24 * 60 * 60 // questionTimeout
    );

    futarchyRouter = await (
      await ethers.getContractFactory("FutarchyRouter")
    ).deploy(
      "0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce", // conditionalTokens
      "0xD194319D1804C1051DD21Ba1Dc931cA72410B79f" // wrapped1155Factory
    );

    realitio = await ethers.getContractAt(
      "RealityETH_v3_0",
      "0xE78996A233895bE74a66F451f1019cA9734205cc"
    );
  });

  it("should create, split, merge and redeem a proposal", async function () {
    const amountSplit1 = BigInt(10e18); // 10 GNO

    // create a proposal
    const tx = await futarchyFactory.createProposal({
      marketName:
        "Will proposal 'Use Seer Futarchy for Governance' be accepted by 2024-12-12 00:00:00?",
      collateralToken1: collateralToken1.target,
      collateralToken2: collateralToken2.target,
      category: "technology",
      lang: "en_US",
      minBond: String(MIN_BOND),
      openingTime: Math.floor(Date.now() / 1000) + 60,
    });
    const receipt = await tx.wait();

    // read proposal address from event logs
    const event = receipt?.logs.find(
      (log) => log?.fragment?.name === "NewProposal"
    );
    const proposalAddress = event?.args?.[0];

    const proposal: FutarchyProposal = await ethers.getContractAt(
      "FutarchyProposal",
      proposalAddress
    );

    // impersonate whale
    const signer = await ethers.getImpersonatedSigner(WHALE);

    // approve tokens
    await collateralToken1
      .connect(signer)
      .approve(futarchyRouter.target, amountSplit1);

    // split
    await futarchyRouter
      .connect(signer)
      .splitPosition(proposal.target, collateralToken1.target, amountSplit1);

    // approve merge half token collateral (5 GNO)
    await approveWrappedTokens(
      signer,
      futarchyRouter.target,
      proposal,
      amountSplit1 / 2n,
      0n
    );

    // merge
    const preMergeBalance1 = await collateralToken1.balanceOf(
      await signer.getAddress()
    );
    await futarchyRouter
      .connect(signer)
      .mergePositions(
        proposal.target,
        collateralToken1.target,
        amountSplit1 / 2n
      );
    const postMergeBalance1 = await collateralToken1.balanceOf(
      await signer.getAddress()
    );
    // Assert balances
    expect(postMergeBalance1 - preMergeBalance1).to.equal(BigInt(5e18));

    // skip opening timestamp
    await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 2]);

    // submit answer
    await realitio
      .connect(signer)
      .submitAnswer(await proposal.questionId(), PROPOSAL_APPROVED, 0n, {
        value: String(MIN_BOND),
      });

    // skip question timeout
    await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 2]);

    // resolve market
    await proposal.resolve();

    // redeem remaining tokens
    await approveWrappedTokens(
      signer,
      futarchyRouter.target,
      proposal,
      amountSplit1 / 2n,
      0n
    );

    const preRedeemBalance1 = await collateralToken1.balanceOf(
      await signer.getAddress()
    );
    const preRedeemBalance2 = await collateralToken2.balanceOf(
      await signer.getAddress()
    );

    await futarchyRouter
      .connect(signer)
      .redeemProposal(proposal.target, amountSplit1 / 2n, 0);

    const postRedeemBalance1 = await collateralToken1.balanceOf(
      await signer.getAddress()
    );
    const postRedeemBalance2 = await collateralToken2.balanceOf(
      await signer.getAddress()
    );

    // Assert balances
    expect(postRedeemBalance1 - preRedeemBalance1).to.equal(BigInt(5e18));
    expect(postRedeemBalance2 - preRedeemBalance2).to.equal(0n);
  });

  async function approveWrappedTokens(
    signer: Signer,
    spender: Addressable | string,
    proposal: FutarchyProposal,
    amount1: bigint,
    amount2: bigint
  ) {
    for (let i = 0; i < 4; i++) {
      const [wrapped1155Address] = await proposal.wrappedOutcome(i);
      const wrapped1155 = (await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
        wrapped1155Address
      )) as unknown as IERC20;
      await wrapped1155
        .connect(signer)
        .approve(spender, i < 2 ? amount1 : amount2);
    }
  }
});

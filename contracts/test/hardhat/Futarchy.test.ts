// SPDX-License-Identifier: MIT
import { expect } from "chai";
import { ethers, network } from "hardhat";

// Import contract types generated from our smart contracts
import {
  FutarchyFactory,
  FutarchyRouter,
  FutarchyProposal,
  IERC20,
  RealityETH_v3_0,
} from "../../typechain-types";
import { Addressable, Signer } from "ethers";

// Test suite for the price-based futarchy markets
describe("FutarchyFactory Simple Tests", function () {
  // Declare contract instances we'll use throughout the tests
  let futarchyFactory: FutarchyFactory,
    futarchyRouter: FutarchyRouter,
    realitio: RealityETH_v3_0,
    collateralToken1: IERC20,
    collateralToken2: IERC20;

  // Constants used in tests
  const MIN_BOND = 1e16; // Minimum bond required for reality.eth questions
  const PROPOSAL_APPROVED = ethers.zeroPadBytes("0x", 32); // Represents "Yes" answer in reality.eth

  // Account with lots of tokens used as a test
  const WHALE = "0xba12222222228d8ba445958a75a0704d566bf2c8";

  // Setup before running tests
  before(async function () {
    // Fork Gnosis Chain for testing
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

    // Get instances of existing tokens on Gnosis Chain
    // GNO token
    collateralToken1 = (await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb"
    )) as unknown as IERC20;
    // wstETH token
    collateralToken2 = (await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      "0x6c76971f98945ae98dd7d4dfca8711ebea946ea6"
    )) as unknown as IERC20;

    // Deploy a new FutarchyProposal implementation contract
    const proposal: FutarchyProposal = await (
      await ethers.getContractFactory("FutarchyProposal")
    ).deploy();

    // Deploy FutarchyFactory with required dependencies
    futarchyFactory = await (
      await ethers.getContractFactory("FutarchyFactory")
    ).deploy(
      proposal.target,
      "0xe40DD83a262da3f56976038F1554Fe541Fa75ecd", // arbitrator
      "0xE78996A233895bE74a66F451f1019cA9734205cc", // realitio
      "0xD194319D1804C1051DD21Ba1Dc931cA72410B79f", // wrapped1155Factory
      "0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce", // conditionalTokens
      "0x03E1fCfE3F1edc5833001588fb6377cB50A61cfc", // realityProxy
      1.5 * 24 * 60 * 60 // questionTimeout (1.5 days)
    );

    // Deploy FutarchyRouter which handles token operations
    futarchyRouter = await (
      await ethers.getContractFactory("FutarchyRouter")
    ).deploy(
      "0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce", // conditionalTokens
      "0xD194319D1804C1051DD21Ba1Dc931cA72410B79f" // wrapped1155Factory
    );

    // Get instance of reality.eth contract
    realitio = await ethers.getContractAt(
      "RealityETH_v3_0",
      "0xE78996A233895bE74a66F451f1019cA9734205cc"
    );
  });

  // Main test case that walks through the entire futarchy process
  it("should create, split, merge and redeem a proposal", async function () {
    const amountSplit1 = BigInt(10e18); // Amount to split: 10 GNO tokens

    // Create a new futarchy proposal
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

    // Extract the new proposal's address from event logs
    const event = receipt?.logs.find(
      (log) => log?.fragment?.name === "NewProposal"
    );
    const proposalAddress = event?.args?.[0];

    const proposal: FutarchyProposal = await ethers.getContractAt(
      "FutarchyProposal",
      proposalAddress
    );

    // Impersonate a whale account to have enough tokens for testing
    const signer = await ethers.getImpersonatedSigner(WHALE);

    // Approve router to spend tokens
    await collateralToken1
      .connect(signer)
      .approve(futarchyRouter.target, amountSplit1);

    // Split tokens into conditional tokens (creates YES/NO tokens)
    await futarchyRouter
      .connect(signer)
      .splitPosition(proposal.target, collateralToken1.target, amountSplit1);

    // Approve router to merge half of the conditional tokens
    await approveWrappedTokens(
      signer,
      futarchyRouter.target,
      proposal,
      amountSplit1 / 2n,
      0n
    );

    // Merge half of the conditional tokens back to original tokens
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
    // Verify merged amount
    expect(postMergeBalance1 - preMergeBalance1).to.equal(BigInt(5e18));

    // Fast forward time past the opening timestamp
    await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 2]);

    // Submit a "YES" answer to the reality.eth question
    await realitio
      .connect(signer)
      .submitAnswer(await proposal.questionId(), PROPOSAL_APPROVED, 0n, {
        value: String(MIN_BOND),
      });

    // Fast forward past the question timeout
    await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 2]);

    // Resolve the market based on reality.eth answer
    await proposal.resolve();

    // Approve router to redeem remaining conditional tokens
    await approveWrappedTokens(
      signer,
      futarchyRouter.target,
      proposal,
      amountSplit1 / 2n,
      0n
    );

    // Track balances before redemption
    const preRedeemBalance1 = await collateralToken1.balanceOf(
      await signer.getAddress()
    );
    const preRedeemBalance2 = await collateralToken2.balanceOf(
      await signer.getAddress()
    );

    // Redeem remaining conditional tokens
    await futarchyRouter
      .connect(signer)
      .redeemProposal(proposal.target, amountSplit1 / 2n, 0);

    // Track balances after redemption
    const postRedeemBalance1 = await collateralToken1.balanceOf(
      await signer.getAddress()
    );
    const postRedeemBalance2 = await collateralToken2.balanceOf(
      await signer.getAddress()
    );

    // Verify redeemed amounts
    expect(postRedeemBalance1 - preRedeemBalance1).to.equal(BigInt(5e18));
    expect(postRedeemBalance2 - preRedeemBalance2).to.equal(0n);
  });

  // Helper function to approve the router to spend wrapped tokens
  async function approveWrappedTokens(
    signer: Signer,
    spender: Addressable | string,
    proposal: FutarchyProposal,
    amount1: bigint,
    amount2: bigint
  ) {
    // Approve all 4 conditional tokens (YES/NO for each collateral token)
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

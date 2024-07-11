import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import {
  ConditionalTokens,
  GnosisRouter,
  ISavingsXDai,
  MarketFactory,
  RealityETH_v3_0,
  RealityProxy,
  WrappedERC20Factory,
} from "../../typechain-types";
import {
  GnosisAddress,
  MIN_BOND,
  OPENING_TS,
  PARENT_COLLECTION_ID,
  SPLIT_AMOUNT,
  QUESTION_TIMEOUT,
  categoricalMarketParams,
  MERGE_AMOUNT,
} from "./helpers/constants";
import { marketFactoryDeployFixture } from "./helpers/fixtures";
import { getBitMaskDecimal } from "./helpers/utils";

describe("GnosisRouter", function () {
  let marketFactory: MarketFactory;
  let conditionalTokens: ConditionalTokens;
  let realityProxy: RealityProxy;
  let gnosisRouter: GnosisRouter;
  let wrappedERC20Factory: WrappedERC20Factory;
  let realitio: RealityETH_v3_0;
  let sDAI: ISavingsXDai;

  async function createMarketAndSplitPosition() {
    // first need to create a market to create outcome tokens
    const currentBlockTime = await time.latest();
    await marketFactory.createCategoricalMarket({
      ...categoricalMarketParams,
      openingTime: currentBlockTime + OPENING_TS,
    });
    const outcomeSlotCount = categoricalMarketParams.outcomes.length + 1;
    const marketAddress = (await marketFactory.allMarkets())[0];
    const market = await ethers.getContractAt("Market", marketAddress);
    const questionId = await market.questionId();
    const oracleAddress = await realityProxy.getAddress();
    const conditionId = await conditionalTokens.getConditionId(
      oracleAddress,
      questionId,
      outcomeSlotCount
    );
    const partition = Array(outcomeSlotCount)
      .fill(0)
      .map((_, index) => getBitMaskDecimal([index], outcomeSlotCount));

    // approve gnosisRouter to transfer user token to the contract
    await sDAI.approve(gnosisRouter, ethers.parseEther(SPLIT_AMOUNT));

    // split collateral token to outcome tokens
    await gnosisRouter.splitFromBase(
      PARENT_COLLECTION_ID,
      conditionId,
      partition,
      { value: ethers.parseEther(SPLIT_AMOUNT) }
    );
    return { outcomeSlotCount, conditionId, questionId, market };
  }

  beforeEach(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: GnosisAddress.RPC_URL,
          },
        },
      ],
    });
    await network.provider.send("evm_setAutomine", [true]);

    sDAI = await ethers.getContractAt("ISavingsXDai", GnosisAddress.S_DAI);

    const sDAIMarketFactoryDeployFixture = async () =>
      marketFactoryDeployFixture(sDAI);
    const {
      marketFactory: _marketFactory,
      conditionalTokens: _conditionalTokens,
      realityProxy: _realityProxy,
      wrappedERC20Factory: _wrappedERC20Factory,
      realitio: _realitio,
    } = await loadFixture(sDAIMarketFactoryDeployFixture);

    marketFactory = _marketFactory;
    conditionalTokens = _conditionalTokens;
    realityProxy = _realityProxy;
    wrappedERC20Factory = _wrappedERC20Factory;
    realitio = _realitio;

    gnosisRouter = await (
      await ethers.getContractFactory("GnosisRouter")
    ).deploy(conditionalTokens, wrappedERC20Factory);
  });

  describe("splitPosition", function () {
    it("splits position and send outcome tokens to user", async function () {
      const [owner] = await ethers.getSigners();
      const amountInSDai = await sDAI.convertToShares(
        ethers.parseEther(SPLIT_AMOUNT)
      );
      const { outcomeSlotCount, conditionId } =
        await createMarketAndSplitPosition();
      for (let i = 0; i < outcomeSlotCount; i++) {
        const tokenId = await gnosisRouter.getTokenId(
          sDAI,
          PARENT_COLLECTION_ID,
          conditionId,
          getBitMaskDecimal([i], outcomeSlotCount)
        );
        const token = await ethers.getContractAt(
          "Wrapped1155",
          await wrappedERC20Factory.tokens(tokenId)
        );
        expect(await token.balanceOf(owner)).to.equal(amountInSDai);
      }
      expect(await sDAI.balanceOf(conditionalTokens)).to.equal(amountInSDai);
    });
  });
  describe("mergePositions", function () {
    it("merges positions and send collateral tokens to user", async function () {
      const [owner] = await ethers.getSigners();
      const splitAmountInSDai = await sDAI.convertToShares(
        ethers.parseEther(SPLIT_AMOUNT)
      );
      const mergeAmountInSDai = await sDAI.convertToShares(
        ethers.parseEther(MERGE_AMOUNT)
      );
      // split first
      const { outcomeSlotCount, conditionId } =
        await createMarketAndSplitPosition();

      // allow gnosisRouter to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const tokenId = await gnosisRouter.getTokenId(
          sDAI,
          PARENT_COLLECTION_ID,
          conditionId,
          getBitMaskDecimal([i], outcomeSlotCount)
        );
        const token = await ethers.getContractAt(
          "Wrapped1155",
          await wrappedERC20Factory.tokens(tokenId)
        );

        await token.approve(gnosisRouter, mergeAmountInSDai);
      }
      const balanceBeforeMerge = await ethers.provider.getBalance(owner);
      // merge positions
      const trx = await gnosisRouter.mergeToBase(
        PARENT_COLLECTION_ID,
        conditionId,
        Array(outcomeSlotCount)
          .fill(0)
          .map((_, index) => getBitMaskDecimal([index], outcomeSlotCount)),
        mergeAmountInSDai
      );

      const receipt = await trx.wait(1);
      const { gasPrice, gasUsed } = receipt ?? {};

      const balanceAfterMerge = await ethers.provider.getBalance(owner);

      expect(
        balanceBeforeMerge -
          (gasPrice ?? BigInt(0)) * (gasUsed ?? BigInt(0)) +
          ethers.parseEther(MERGE_AMOUNT)
      ).to.be.closeTo(balanceAfterMerge, BigInt(10));

      for (let i = 0; i < outcomeSlotCount; i++) {
        const tokenId = await gnosisRouter.getTokenId(
          sDAI,
          PARENT_COLLECTION_ID,
          conditionId,
          getBitMaskDecimal([i], outcomeSlotCount)
        );
        const token = await ethers.getContractAt(
          "Wrapped1155",
          await wrappedERC20Factory.tokens(tokenId)
        );
        expect(await token.balanceOf(owner)).to.equal(
          splitAmountInSDai - mergeAmountInSDai
        );
      }
      expect(await sDAI.balanceOf(conditionalTokens)).to.equal(
        splitAmountInSDai - mergeAmountInSDai
      );
    });
  });

  describe("redeemPositions", function () {
    it("redeems a winning position and send collateral tokens to user", async function () {
      const ANSWER = 1;
      const REDEEMED_POSITION = 1;
      const [owner] = await ethers.getSigners();
      const amountInSDai = await sDAI.convertToShares(
        ethers.parseEther(SPLIT_AMOUNT)
      );
      // split first
      const { outcomeSlotCount, conditionId, questionId, market } =
        await createMarketAndSplitPosition();

      // answer the question and resolve the market
      // past opening_ts
      await time.increase(OPENING_TS);

      // submit answer
      await realitio.submitAnswer(
        questionId,
        ethers.toBeHex(BigInt(ANSWER), 32),
        0,
        {
          value: ethers.parseEther(MIN_BOND),
        }
      );

      // past finalized_ts
      await time.increase(QUESTION_TIMEOUT);

      await realityProxy.resolve(market);

      // allow gnosisRouter to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const tokenId = await gnosisRouter.getTokenId(
          sDAI,
          PARENT_COLLECTION_ID,
          conditionId,
          getBitMaskDecimal([i], outcomeSlotCount)
        );
        const token = await ethers.getContractAt(
          "Wrapped1155",
          await wrappedERC20Factory.tokens(tokenId)
        );

        await token.approve(gnosisRouter, amountInSDai);
      }
      const balanceBeforeRedeem = await ethers.provider.getBalance(owner);
      // redeem winning position
      const trx = await gnosisRouter.redeemToBase(
        PARENT_COLLECTION_ID,
        conditionId,
        [getBitMaskDecimal([REDEEMED_POSITION], outcomeSlotCount)]
      );

      const receipt = await trx.wait(1);
      const { gasPrice, gasUsed } = receipt ?? {};

      const balanceAfterRedeem = await ethers.provider.getBalance(owner);

      expect(
        balanceBeforeRedeem -
          (gasPrice ?? BigInt(0)) * (gasUsed ?? BigInt(0)) +
          ethers.parseEther(SPLIT_AMOUNT)
      ).to.be.closeTo(balanceAfterRedeem, BigInt(10));

      for (let i = 0; i < outcomeSlotCount; i++) {
        const tokenId = await gnosisRouter.getTokenId(
          sDAI,
          PARENT_COLLECTION_ID,
          conditionId,
          getBitMaskDecimal([i], outcomeSlotCount)
        );
        const token = await ethers.getContractAt(
          "Wrapped1155",
          await wrappedERC20Factory.tokens(tokenId)
        );
        if (i === REDEEMED_POSITION) {
          expect(await token.balanceOf(owner)).to.equal("0");
        } else {
          expect(await token.balanceOf(owner)).to.equal(amountInSDai);
        }
      }
      expect(await sDAI.balanceOf(conditionalTokens)).to.equal("0");

      const winningOutcomes =
        await gnosisRouter.getWinningOutcomes(conditionId);
      expect(winningOutcomes[ANSWER]).to.equal(true);
    });

    it("redeems a losing position", async function () {
      const ANSWER = 1;
      const REDEEMED_POSITION = 0;
      const [owner] = await ethers.getSigners();
      const amountInSDai = await sDAI.convertToShares(
        ethers.parseEther(SPLIT_AMOUNT)
      );
      // split first
      const { outcomeSlotCount, conditionId, questionId, market } =
        await createMarketAndSplitPosition();

      // answer the question and resolve the market
      // past opening_ts
      await time.increase(OPENING_TS);
      // submit answer
      await realitio.submitAnswer(
        questionId,
        ethers.toBeHex(BigInt(ANSWER), 32),
        0,
        {
          value: ethers.parseEther(MIN_BOND),
        }
      );

      // past finalized_ts
      await time.increase(QUESTION_TIMEOUT);

      await realityProxy.resolve(market);

      // allow gnosisRouter to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const tokenId = await gnosisRouter.getTokenId(
          sDAI,
          PARENT_COLLECTION_ID,
          conditionId,
          getBitMaskDecimal([i], outcomeSlotCount)
        );
        const token = await ethers.getContractAt(
          "Wrapped1155",
          await wrappedERC20Factory.tokens(tokenId)
        );

        await token.approve(gnosisRouter, amountInSDai);
      }

      const balanceBeforeRedeem = await ethers.provider.getBalance(owner);
      // redeem losing position
      const trx = await gnosisRouter.redeemToBase(
        PARENT_COLLECTION_ID,
        conditionId,
        [getBitMaskDecimal([REDEEMED_POSITION], outcomeSlotCount)]
      );

      const receipt = await trx.wait(1);
      const { gasPrice, gasUsed } = receipt ?? {};

      const balanceAfterRedeem = await ethers.provider.getBalance(owner);

      expect(
        balanceBeforeRedeem - (gasPrice ?? BigInt(0)) * (gasUsed ?? BigInt(0))
      ).to.be.closeTo(balanceAfterRedeem, BigInt(10));

      for (let i = 0; i < outcomeSlotCount; i++) {
        const tokenId = await gnosisRouter.getTokenId(
          sDAI,
          PARENT_COLLECTION_ID,
          conditionId,
          getBitMaskDecimal([i], outcomeSlotCount)
        );
        const token = await ethers.getContractAt(
          "Wrapped1155",
          await wrappedERC20Factory.tokens(tokenId)
        );
        if (i === REDEEMED_POSITION) {
          expect(await token.balanceOf(owner)).to.equal("0");
        } else {
          expect(await token.balanceOf(owner)).to.equal(amountInSDai);
        }
      }
      expect(await sDAI.balanceOf(conditionalTokens)).to.equal(amountInSDai);
    });
  });
});

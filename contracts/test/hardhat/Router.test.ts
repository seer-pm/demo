import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import {
  CollateralToken,
  ConditionalTokens,
  IERC20,
  MarketFactory,
  RealityETH_v3_0,
  RealityProxy,
  Router,
  WrappedERC20Factory,
} from "../../typechain-types";
import {
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

describe("Router", function () {
  let marketFactory: MarketFactory;
  let collateralToken: CollateralToken;
  let conditionalTokens: ConditionalTokens;
  let realityProxy: RealityProxy;
  let router: Router;
  let wrappedERC20Factory: WrappedERC20Factory;
  let realitio: RealityETH_v3_0;

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
    const questionsIds = await market.getQuestionsIds();
    const oracleAddress = await realityProxy.getAddress();
    const conditionId = await conditionalTokens.getConditionId(
      oracleAddress,
      questionId,
      outcomeSlotCount
    );

    // approve router to transfer user token to the contract
    await collateralToken.approve(router, ethers.parseEther(SPLIT_AMOUNT));

    // split collateral token to outcome tokens
    await router.splitPosition(
      collateralToken,
      PARENT_COLLECTION_ID,
      conditionId,
      Array(outcomeSlotCount)
        .fill(0)
        .map((_, index) => getBitMaskDecimal([index], outcomeSlotCount)),
      ethers.parseEther(SPLIT_AMOUNT)
    );
    return { outcomeSlotCount, conditionId, questionsIds, market };
  }

  beforeEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);
    const {
      marketFactory: _marketFactory,
      collateralToken: _collateralToken,
      conditionalTokens: _conditionalTokens,
      realityProxy: _realityProxy,
      router: _router,
      wrappedERC20Factory: _wrappedERC20Factory,
      realitio: _realitio,
    } = await loadFixture(marketFactoryDeployFixture);

    marketFactory = _marketFactory;
    collateralToken = _collateralToken as CollateralToken;
    conditionalTokens = _conditionalTokens;
    realityProxy = _realityProxy;
    router = _router;
    wrappedERC20Factory = _wrappedERC20Factory;
    realitio = _realitio;

    const [owner] = await ethers.getSigners();
    // mint some collateral token
    collateralToken.mint(owner, ethers.parseEther(SPLIT_AMOUNT));
  });

  describe("splitPosition", function () {
    it("splits position and send outcome tokens to user", async function () {
      const [owner] = await ethers.getSigners();
      const previousCollateralTokenBalance =
        await collateralToken.balanceOf(owner);
      const { outcomeSlotCount, conditionId } =
        await createMarketAndSplitPosition();

      for (let i = 0; i < outcomeSlotCount; i++) {
        const tokenId = await router.getTokenId(
          collateralToken,
          PARENT_COLLECTION_ID,
          conditionId,
          getBitMaskDecimal([i], outcomeSlotCount)
        );
        const token = await ethers.getContractAt(
          "Wrapped1155",
          await wrappedERC20Factory.tokens(tokenId)
        );
        expect(await token.balanceOf(owner)).to.equal(
          ethers.parseEther(SPLIT_AMOUNT)
        );
      }
      expect(await collateralToken.balanceOf(conditionalTokens)).to.equal(
        ethers.parseEther(SPLIT_AMOUNT)
      );
      expect(await collateralToken.balanceOf(owner)).to.equal(
        previousCollateralTokenBalance - ethers.parseEther(SPLIT_AMOUNT)
      );
    });
  });

  describe("mergePositions", function () {
    it("merges positions and send collateral tokens to user", async function () {
      const [owner] = await ethers.getSigners();
      // split first
      const { outcomeSlotCount, conditionId } =
        await createMarketAndSplitPosition();

      const collateralTokenBalanceAfterSplit =
        await collateralToken.balanceOf(owner);

      // allow router to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const tokenId = await router.getTokenId(
          collateralToken,
          PARENT_COLLECTION_ID,
          conditionId,
          getBitMaskDecimal([i], outcomeSlotCount)
        );
        const token = await ethers.getContractAt(
          "Wrapped1155",
          await wrappedERC20Factory.tokens(tokenId)
        );

        await token.approve(router, ethers.parseEther(SPLIT_AMOUNT));
      }

      // merge positions
      await router.mergePositions(
        collateralToken,
        PARENT_COLLECTION_ID,
        conditionId,
        Array(outcomeSlotCount)
          .fill(0)
          .map((_, index) => getBitMaskDecimal([index], outcomeSlotCount)),
        ethers.parseEther(MERGE_AMOUNT)
      );

      for (let i = 0; i < outcomeSlotCount; i++) {
        const tokenId = await router.getTokenId(
          collateralToken,
          PARENT_COLLECTION_ID,
          conditionId,
          getBitMaskDecimal([i], outcomeSlotCount)
        );
        const token = await ethers.getContractAt(
          "Wrapped1155",
          await wrappedERC20Factory.tokens(tokenId)
        );
        expect(await token.balanceOf(owner)).to.equal(
          ethers.parseEther(SPLIT_AMOUNT) - ethers.parseEther(MERGE_AMOUNT)
        );
      }
      expect(await collateralToken.balanceOf(conditionalTokens)).to.equal(
        ethers.parseEther(SPLIT_AMOUNT) - ethers.parseEther(MERGE_AMOUNT)
      );
      expect(await collateralToken.balanceOf(owner)).to.equal(
        collateralTokenBalanceAfterSplit + ethers.parseEther(MERGE_AMOUNT)
      );
    });
  });

  describe("redeemPositions", function () {
    it("redeems a winning position and send collateral tokens to user", async function () {
      const ANSWER = 1;
      const REDEEMED_POSITION = 1;
      const [owner] = await ethers.getSigners();
      // split first
      const { outcomeSlotCount, conditionId, questionsIds, market } =
        await createMarketAndSplitPosition();

      // answer the question and resolve the market
      // past opening_ts
      await time.increase(OPENING_TS);
      // submit answer
      await realitio.submitAnswer(
        questionsIds[0],
        ethers.toBeHex(BigInt(ANSWER), 32),
        0,
        {
          value: ethers.parseEther(MIN_BOND),
        }
      );

      // past finalized_ts
      await time.increase(QUESTION_TIMEOUT);

      await realityProxy.resolve(market);

      const collateralTokenBalanceAfterSplit =
        await collateralToken.balanceOf(owner);

      // allow router to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const tokenId = await router.getTokenId(
          collateralToken,
          PARENT_COLLECTION_ID,
          conditionId,
          getBitMaskDecimal([i], outcomeSlotCount)
        );
        const token = await ethers.getContractAt(
          "Wrapped1155",
          await wrappedERC20Factory.tokens(tokenId)
        );

        await token.approve(router, ethers.parseEther(SPLIT_AMOUNT));
      }

      // redeem winning position
      await router.redeemPositions(
        collateralToken,
        PARENT_COLLECTION_ID,
        conditionId,
        [getBitMaskDecimal([REDEEMED_POSITION], outcomeSlotCount)]
      );

      for (let i = 0; i < outcomeSlotCount; i++) {
        const tokenId = await router.getTokenId(
          collateralToken,
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
          expect(await token.balanceOf(owner)).to.equal(
            ethers.parseEther(SPLIT_AMOUNT)
          );
        }
      }
      expect(await collateralToken.balanceOf(conditionalTokens)).to.equal("0");
      expect(await collateralToken.balanceOf(owner)).to.equal(
        collateralTokenBalanceAfterSplit + ethers.parseEther(SPLIT_AMOUNT)
      );
      // check winning outcomes
      const winningOutcomes = await router.getWinningOutcomes(conditionId);
      expect(winningOutcomes[ANSWER]).to.equal(true);
    });

    it("redeems a losing position", async function () {
      const ANSWER = 1;
      const REDEEMED_POSITION = 0;
      const [owner] = await ethers.getSigners();
      // split first
      const { outcomeSlotCount, conditionId, questionsIds, market } =
        await createMarketAndSplitPosition();

      // answer the question and resolve the market
      // past opening_ts
      await time.increase(OPENING_TS);
      // submit answer
      await realitio.submitAnswer(
        questionsIds[0],
        ethers.toBeHex(BigInt(ANSWER), 32),
        0,
        {
          value: ethers.parseEther(MIN_BOND),
        }
      );

      // past finalized_ts
      await time.increase(QUESTION_TIMEOUT);

      await realityProxy.resolve(market);

      const collateralTokenBalanceAfterSplit =
        await collateralToken.balanceOf(owner);

      // allow router to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const tokenId = await router.getTokenId(
          collateralToken,
          PARENT_COLLECTION_ID,
          conditionId,
          getBitMaskDecimal([i], outcomeSlotCount)
        );
        const token = await ethers.getContractAt(
          "Wrapped1155",
          await wrappedERC20Factory.tokens(tokenId)
        );

        await token.approve(router, ethers.parseEther(SPLIT_AMOUNT));
      }

      // redeem losing position
      await router.redeemPositions(
        collateralToken,
        PARENT_COLLECTION_ID,
        conditionId,
        [getBitMaskDecimal([REDEEMED_POSITION], outcomeSlotCount)]
      );

      for (let i = 0; i < outcomeSlotCount; i++) {
        const tokenId = await router.getTokenId(
          collateralToken,
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
          expect(await token.balanceOf(owner)).to.equal(
            ethers.parseEther(SPLIT_AMOUNT)
          );
        }
      }
      expect(await collateralToken.balanceOf(conditionalTokens)).to.equal(
        ethers.parseEther(SPLIT_AMOUNT)
      );
      expect(await collateralToken.balanceOf(owner)).to.equal(
        collateralTokenBalanceAfterSplit
      );
    });
  });
});

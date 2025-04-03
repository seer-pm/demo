import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import {
  CollateralToken,
  ConditionalRouter,
  ConditionalTokens,
  Market,
  MarketFactory,
  RealityETH_v3_0,
  RealityProxy,
  Router,
} from "../../typechain-types";
import {
  categoricalMarketParams,
  MERGE_AMOUNT,
  MIN_BOND,
  OPENING_TS,
  QUESTION_TIMEOUT,
  scalarMarketParams,
  SPLIT_AMOUNT,
  CONDITIONAL_SPLIT_AMOUNT,
} from "./helpers/constants";
import { marketFactoryDeployFixture } from "./helpers/fixtures";
import { getBitMaskDecimal, getRedeemAmounts } from "./helpers/utils";

describe("Router", function () {
  let marketFactory: MarketFactory;
  let collateralToken: CollateralToken;
  let conditionalTokens: ConditionalTokens;
  let realityProxy: RealityProxy;
  let router: Router;
  let conditionalRouter: ConditionalRouter;
  let realitio: RealityETH_v3_0;

  async function createMarketAndSplitPosition(splitPosition = true) {
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
    const questionsIds = await market.questionsIds();
    const oracleAddress = await realityProxy.getAddress();
    const conditionId = await conditionalTokens.getConditionId(oracleAddress, questionId, outcomeSlotCount);

    if (splitPosition) {
      // approve router to transfer user token to the contract
      await collateralToken.approve(router, ethers.parseEther(SPLIT_AMOUNT));

      // split collateral token to outcome tokens
      await router.splitPosition(collateralToken, market, ethers.parseEther(SPLIT_AMOUNT));
    }

    return { outcomeSlotCount, conditionId, questionsIds, market };
  }

  async function createConditionalMarketAndSplitPosition(parentMarket: Market, parentOutcome: number) {
    // create a conditional market and outcome tokens
    const currentBlockTime = await time.latest();
    const marketAddress = await marketFactory.createScalarMarket.staticCall({
      ...scalarMarketParams,
      openingTime: currentBlockTime + OPENING_TS,
      parentMarket,
      parentOutcome,
    });
    await marketFactory.createScalarMarket({
      ...scalarMarketParams,
      openingTime: currentBlockTime + OPENING_TS,
      parentMarket,
      parentOutcome,
    });
    const outcomeSlotCount = scalarMarketParams.outcomes.length + 1;
    const market = await ethers.getContractAt("Market", marketAddress);
    const questionId = await market.questionId();
    const questionsIds = await market.questionsIds();
    const oracleAddress = await realityProxy.getAddress();
    const conditionId = await conditionalTokens.getConditionId(oracleAddress, questionId, outcomeSlotCount);
    const parentCollectionId = await market.parentCollectionId();
    // split parent outcome tokens to conditional outcome tokens
    // approve router to transfer user token to the contract
    const [wrapped1155] = await market.parentWrappedOutcome();
    const parentToken = await ethers.getContractAt("Wrapped1155", wrapped1155);
    await parentToken.approve(router, ethers.parseEther(CONDITIONAL_SPLIT_AMOUNT));
    await router.splitPosition(collateralToken, market, ethers.parseEther(CONDITIONAL_SPLIT_AMOUNT));
    return { outcomeSlotCount, conditionId, questionsIds, market, parentCollectionId };
  }

  beforeEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);
    const {
      marketFactory: _marketFactory,
      collateralToken: _collateralToken,
      conditionalTokens: _conditionalTokens,
      realityProxy: _realityProxy,
      router: _router,
      realitio: _realitio,
      conditionalRouter: _conditionalRouter,
    } = await loadFixture(marketFactoryDeployFixture);

    marketFactory = _marketFactory;
    collateralToken = _collateralToken as CollateralToken;
    conditionalTokens = _conditionalTokens;
    realityProxy = _realityProxy;
    router = _router;
    conditionalRouter = _conditionalRouter;
    realitio = _realitio;

    const [owner] = await ethers.getSigners();
    // mint some collateral token
    collateralToken.mint(owner, ethers.parseEther(SPLIT_AMOUNT));
  });

  describe("splitPosition", function () {
    it("splits position and send outcome tokens to user", async function () {
      const [owner] = await ethers.getSigners();
      const previousCollateralTokenBalance = await collateralToken.balanceOf(owner);
      const { outcomeSlotCount, market } = await createMarketAndSplitPosition();

      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);
        expect(await token.balanceOf(owner)).to.equal(ethers.parseEther(SPLIT_AMOUNT));
      }
      expect(await collateralToken.balanceOf(conditionalTokens)).to.equal(ethers.parseEther(SPLIT_AMOUNT));
      expect(await collateralToken.balanceOf(owner)).to.equal(
        previousCollateralTokenBalance - ethers.parseEther(SPLIT_AMOUNT),
      );
    });
  });

  describe("mergePositions", function () {
    it("merges positions and send collateral tokens to user", async function () {
      const [owner] = await ethers.getSigners();
      // split first
      const { outcomeSlotCount, market } = await createMarketAndSplitPosition();

      const collateralTokenBalanceAfterSplit = await collateralToken.balanceOf(owner);

      // allow router to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);

        await token.approve(router, ethers.parseEther(SPLIT_AMOUNT));
      }

      // merge positions
      await router.mergePositions(collateralToken, market, ethers.parseEther(MERGE_AMOUNT));

      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", await wrapped1155);
        expect(await token.balanceOf(owner)).to.equal(
          ethers.parseEther(SPLIT_AMOUNT) - ethers.parseEther(MERGE_AMOUNT),
        );
      }
      expect(await collateralToken.balanceOf(conditionalTokens)).to.equal(
        ethers.parseEther(SPLIT_AMOUNT) - ethers.parseEther(MERGE_AMOUNT),
      );
      expect(await collateralToken.balanceOf(owner)).to.equal(
        collateralTokenBalanceAfterSplit + ethers.parseEther(MERGE_AMOUNT),
      );
    });
  });

  describe("redeemPositions", function () {
    it("redeems a winning position and send collateral tokens to user", async function () {
      const ANSWER = 1;
      const REDEEMED_POSITION = 1;
      const [owner] = await ethers.getSigners();
      // split first
      const { outcomeSlotCount, conditionId, questionsIds, market } = await createMarketAndSplitPosition();

      // answer the question and resolve the market
      // past opening_ts
      await time.increase(OPENING_TS);
      // submit answer
      await realitio.submitAnswer(questionsIds[0], ethers.toBeHex(BigInt(ANSWER), 32), 0, {
        value: ethers.parseEther(MIN_BOND),
      });

      // past finalized_ts
      await time.increase(QUESTION_TIMEOUT);

      await realityProxy.resolve(market);

      const collateralTokenBalanceAfterSplit = await collateralToken.balanceOf(owner);

      // allow router to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);

        await token.approve(router, ethers.parseEther(SPLIT_AMOUNT));
      }

      // redeem winning position
      await router.redeemPositions(
        collateralToken,
        market,
        [REDEEMED_POSITION],
        getRedeemAmounts(outcomeSlotCount, ethers.parseEther(SPLIT_AMOUNT)),
      );

      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);
        if (i === REDEEMED_POSITION) {
          expect(await token.balanceOf(owner)).to.equal("0");
        } else {
          expect(await token.balanceOf(owner)).to.equal(ethers.parseEther(SPLIT_AMOUNT));
        }
      }
      expect(await collateralToken.balanceOf(conditionalTokens)).to.equal("0");
      expect(await collateralToken.balanceOf(owner)).to.equal(
        collateralTokenBalanceAfterSplit + ethers.parseEther(SPLIT_AMOUNT),
      );
      // check winning outcomes
      const winningOutcomes = await router.getWinningOutcomes(conditionId);
      expect(winningOutcomes[REDEEMED_POSITION]).to.equal(true);
    });

    it("redeems a losing position", async function () {
      const ANSWER = 1;
      const REDEEMED_POSITION = 0;
      const [owner] = await ethers.getSigners();
      // split first
      const { outcomeSlotCount, questionsIds, market } = await createMarketAndSplitPosition();

      // answer the question and resolve the market
      // past opening_ts
      await time.increase(OPENING_TS);
      // submit answer
      await realitio.submitAnswer(questionsIds[0], ethers.toBeHex(BigInt(ANSWER), 32), 0, {
        value: ethers.parseEther(MIN_BOND),
      });

      // past finalized_ts
      await time.increase(QUESTION_TIMEOUT);

      await realityProxy.resolve(market);

      const collateralTokenBalanceAfterSplit = await collateralToken.balanceOf(owner);

      // allow router to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);

        await token.approve(router, ethers.parseEther(SPLIT_AMOUNT));
      }

      // redeem losing position
      await router.redeemPositions(
        collateralToken,
        market,
        [REDEEMED_POSITION],
        getRedeemAmounts(outcomeSlotCount, ethers.parseEther(SPLIT_AMOUNT)),
      );

      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);
        if (i === REDEEMED_POSITION) {
          expect(await token.balanceOf(owner)).to.equal("0");
        } else {
          expect(await token.balanceOf(owner)).to.equal(ethers.parseEther(SPLIT_AMOUNT));
        }
      }
      expect(await collateralToken.balanceOf(conditionalTokens)).to.equal(ethers.parseEther(SPLIT_AMOUNT));
      expect(await collateralToken.balanceOf(owner)).to.equal(collateralTokenBalanceAfterSplit);
    });
  });

  describe("Conditional market", function () {
    it("saves a correct parent collection id", async function () {
      const parentOutcome = 0;
      // create parent market
      const { market: parentMarket } = await createMarketAndSplitPosition(false);
      // create conditional market on outcome 0
      const marketAddress = await marketFactory.createScalarMarket.staticCall({
        ...scalarMarketParams,
        parentMarket,
        parentOutcome,
      });
      await marketFactory.createScalarMarket({
        ...scalarMarketParams,
        parentMarket,
        parentOutcome,
      });
      const market = await ethers.getContractAt("Market", marketAddress);

      // check parent collection id saved in market is equal the actual parent collection id
      expect(await market.parentCollectionId()).to.equal(
        await conditionalTokens.getCollectionId(
          await parentMarket.parentCollectionId(),
          await parentMarket.conditionId(),
          getBitMaskDecimal([parentOutcome], Number((await parentMarket.numOutcomes()) + 1n)),
        ),
      );
    });
    it("reverts if split conditional market without parent market outcome token", async function () {
      const parentOutcome = 0;
      // create parent market
      const { market: parentMarket } = await createMarketAndSplitPosition(false);
      // create conditional market on outcome 0
      const marketAddress = await marketFactory.createScalarMarket.staticCall({
        ...scalarMarketParams,
        parentMarket,
        parentOutcome,
      });
      await marketFactory.createScalarMarket({
        ...scalarMarketParams,
        parentMarket,
        parentOutcome,
      });
      const market = await ethers.getContractAt("Market", marketAddress);
      // approve router to transfer user token to the contract
      const [wrapped1155] = await market.parentWrappedOutcome();
      const parentToken = await ethers.getContractAt("Wrapped1155", wrapped1155);
      await parentToken.approve(router, ethers.parseEther(CONDITIONAL_SPLIT_AMOUNT));
      await expect(router.splitPosition(collateralToken, market, ethers.parseEther(CONDITIONAL_SPLIT_AMOUNT))).to.be
        .reverted;
    });
    it("reverts if split amount is higher than parent market outcome token", async function () {
      const parentOutcome = 0;
      // create parent market and split
      const { market: parentMarket } = await createMarketAndSplitPosition();
      // create conditional market on outcome 0
      const marketAddress = await marketFactory.createScalarMarket.staticCall({
        ...scalarMarketParams,
        parentMarket,
        parentOutcome,
      });
      await marketFactory.createScalarMarket({
        ...scalarMarketParams,
        parentMarket,
        parentOutcome,
      });
      const market = await ethers.getContractAt("Market", marketAddress);
      // approve router to transfer user token to the contract
      const [wrapped1155] = await market.parentWrappedOutcome();
      const parentToken = await ethers.getContractAt("Wrapped1155", wrapped1155);
      await parentToken.approve(router, ethers.parseEther(String(Number(SPLIT_AMOUNT) + 1)));

      await expect(router.splitPosition(collateralToken, market, ethers.parseEther(String(Number(SPLIT_AMOUNT) + 1))))
        .to.be.reverted;
    });
    it("splits to deeper positions", async function () {
      const parentOutcome = 1;
      const [owner] = await ethers.getSigners();
      const { market: parentMarket } = await createMarketAndSplitPosition();
      const previousCollateralTokenBalance = await collateralToken.balanceOf(owner);
      const [wrapped1155] = await parentMarket.wrappedOutcome(parentOutcome);
      const parentToken = await ethers.getContractAt("Wrapped1155", wrapped1155);
      const previousParentTokenBalance = await parentToken.balanceOf(owner);
      const { outcomeSlotCount, market } = await createConditionalMarketAndSplitPosition(parentMarket, parentOutcome);
      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);
        expect(await token.balanceOf(owner)).to.equal(ethers.parseEther(CONDITIONAL_SPLIT_AMOUNT));
      }

      expect(await collateralToken.balanceOf(owner)).to.equal(previousCollateralTokenBalance);
      expect(await parentToken.balanceOf(owner)).to.equal(
        previousParentTokenBalance - ethers.parseEther(CONDITIONAL_SPLIT_AMOUNT),
      );
    });
    it("merges to parent token", async function () {
      const parentOutcome = 1;
      const [owner] = await ethers.getSigners();
      const { market: parentMarket } = await createMarketAndSplitPosition();

      const { outcomeSlotCount, market } = await createConditionalMarketAndSplitPosition(parentMarket, parentOutcome);
      const mergeAmount = String(Number(CONDITIONAL_SPLIT_AMOUNT) / 2);
      // allow router to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);

        await token.approve(router, ethers.parseEther(mergeAmount));
      }
      const previousCollateralTokenBalance = await collateralToken.balanceOf(owner);
      const [wrapped1155] = await parentMarket.wrappedOutcome(parentOutcome);
      const parentToken = await ethers.getContractAt("Wrapped1155", wrapped1155);
      const previousParentTokenBalance = await parentToken.balanceOf(owner);
      // merge positions
      await router.mergePositions(collateralToken, market, ethers.parseEther(String(Number(mergeAmount))));

      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);
        expect(await token.balanceOf(owner)).to.equal(
          ethers.parseEther(CONDITIONAL_SPLIT_AMOUNT) - ethers.parseEther(mergeAmount),
        );
      }
      expect(await collateralToken.balanceOf(owner)).to.equal(previousCollateralTokenBalance);
      expect(await parentToken.balanceOf(owner)).to.equal(previousParentTokenBalance + ethers.parseEther(mergeAmount));
    });
    it("redeems a winning position", async function () {
      const ANSWER = 101; // > higherBound
      const REDEEMED_POSITION = 1;
      const parentOutcome = 1;
      const [owner] = await ethers.getSigners();
      // split first
      const { market: parentMarket } = await createMarketAndSplitPosition();
      const { outcomeSlotCount, conditionId, questionsIds, market } = await createConditionalMarketAndSplitPosition(
        parentMarket,
        parentOutcome,
      );
      // answer the question and resolve the market
      // past opening_ts
      await time.increase(OPENING_TS);
      // submit answer
      await realitio.submitAnswer(questionsIds[0], ethers.toBeHex(BigInt(ANSWER), 32), 0, {
        value: ethers.parseEther(MIN_BOND),
      });

      // past finalized_ts
      await time.increase(QUESTION_TIMEOUT);

      await realityProxy.resolve(market);

      const [wrapped1155] = await parentMarket.wrappedOutcome(parentOutcome);
      const parentToken = await ethers.getContractAt("Wrapped1155", wrapped1155);
      const previousCollateralTokenBalance = await collateralToken.balanceOf(owner);
      const previousParentTokenBalance = await parentToken.balanceOf(owner);
      // allow router to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);

        await token.approve(router, ethers.parseEther(CONDITIONAL_SPLIT_AMOUNT));
      }
      // redeem winning position
      await router.redeemPositions(
        collateralToken,
        market,
        [REDEEMED_POSITION],
        getRedeemAmounts(outcomeSlotCount, ethers.parseEther(CONDITIONAL_SPLIT_AMOUNT)),
      );
      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);
        if (i === REDEEMED_POSITION) {
          expect(await token.balanceOf(owner)).to.equal("0");
        } else {
          expect(await token.balanceOf(owner)).to.equal(ethers.parseEther(CONDITIONAL_SPLIT_AMOUNT));
        }
      }
      expect(await collateralToken.balanceOf(owner)).to.equal(previousCollateralTokenBalance);
      expect(await parentToken.balanceOf(owner)).to.equal(
        previousParentTokenBalance + ethers.parseEther(CONDITIONAL_SPLIT_AMOUNT),
      );
      // check winning outcomes
      const winningOutcomes = await router.getWinningOutcomes(conditionId);
      expect(winningOutcomes[REDEEMED_POSITION]).to.equal(true);
    });
    it("redeems a winning position to collateral", async function () {
      const ANSWER = 101; // > higherBound
      const REDEEMED_POSITION = 1;
      const parentOutcome = 1;
      const PARENT_ANSWER = 1; // winning parent
      const [owner] = await ethers.getSigners();
      // split first
      const { market: parentMarket, questionsIds: parentQuestionsIds } = await createMarketAndSplitPosition();
      const { outcomeSlotCount, conditionId, questionsIds, market } = await createConditionalMarketAndSplitPosition(
        parentMarket,
        parentOutcome,
      );
      // answer the question and resolve the market
      // past opening_ts
      await time.increase(OPENING_TS);
      // submit answer
      await realitio.submitAnswer(questionsIds[0], ethers.toBeHex(BigInt(ANSWER), 32), 0, {
        value: ethers.parseEther(MIN_BOND),
      });

      // submit parent answer
      await realitio.submitAnswer(parentQuestionsIds[0], ethers.toBeHex(BigInt(PARENT_ANSWER), 32), 0, {
        value: ethers.parseEther(MIN_BOND),
      });

      // past finalized_ts
      await time.increase(QUESTION_TIMEOUT);

      await realityProxy.resolve(market);
      await realityProxy.resolve(parentMarket);

      const [wrapped1155] = await parentMarket.wrappedOutcome(parentOutcome);
      const parentToken = await ethers.getContractAt("Wrapped1155", wrapped1155);
      const previousCollateralTokenBalance = await collateralToken.balanceOf(owner);
      const previousParentTokenBalance = await parentToken.balanceOf(owner);
      // allow router to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);

        await token.approve(conditionalRouter, ethers.parseEther(CONDITIONAL_SPLIT_AMOUNT));
      }
      // redeem winning position
      await conditionalRouter.redeemConditionalToCollateral(
        collateralToken,
        market,
        [REDEEMED_POSITION],
        [parentOutcome],
        getRedeemAmounts(outcomeSlotCount, ethers.parseEther(CONDITIONAL_SPLIT_AMOUNT)),
      );
      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);
        if (i === REDEEMED_POSITION) {
          expect(await token.balanceOf(owner)).to.equal("0");
        } else {
          expect(await token.balanceOf(owner)).to.equal(ethers.parseEther(CONDITIONAL_SPLIT_AMOUNT));
        }
      }
      expect(await collateralToken.balanceOf(owner)).to.equal(
        previousCollateralTokenBalance + ethers.parseEther(CONDITIONAL_SPLIT_AMOUNT),
      );
      expect(await parentToken.balanceOf(owner)).to.equal(previousParentTokenBalance);
    });
  });
});

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
} from "../../typechain-types";
import {
  categoricalMarketParams,
  GnosisAddress,
  MERGE_AMOUNT,
  MIN_BOND,
  OPENING_TS,
  QUESTION_TIMEOUT,
  SPLIT_AMOUNT,
} from "./helpers/constants";
import { marketFactoryDeployFixture } from "./helpers/fixtures";
import { getRedeemAmounts } from "./helpers/utils";

describe("GnosisRouter", function () {
  let marketFactory: MarketFactory;
  let conditionalTokens: ConditionalTokens;
  let realityProxy: RealityProxy;
  let gnosisRouter: GnosisRouter;
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
    const questionsIds = await market.questionsIds();
    const oracleAddress = await realityProxy.getAddress();
    const conditionId = await conditionalTokens.getConditionId(oracleAddress, questionId, outcomeSlotCount);

    // approve gnosisRouter to transfer user token to the contract
    await sDAI.approve(gnosisRouter, ethers.parseEther(SPLIT_AMOUNT));

    // split collateral token to outcome tokens
    await gnosisRouter.splitFromBase(market, {
      value: ethers.parseEther(SPLIT_AMOUNT),
    });
    return { outcomeSlotCount, conditionId, questionsIds, market };
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

    const sDAIMarketFactoryDeployFixture = async () => marketFactoryDeployFixture(sDAI);
    const {
      marketFactory: _marketFactory,
      conditionalTokens: _conditionalTokens,
      realityProxy: _realityProxy,
      wrapped1155Factory: _wrapped1155Factory,
      realitio: _realitio,
    } = await loadFixture(sDAIMarketFactoryDeployFixture);

    marketFactory = _marketFactory;
    conditionalTokens = _conditionalTokens;
    realityProxy = _realityProxy;
    realitio = _realitio;

    gnosisRouter = await (
      await ethers.getContractFactory("GnosisRouter")
    ).deploy(conditionalTokens, _wrapped1155Factory);
  });

  describe("splitPosition", function () {
    it("splits position and send outcome tokens to user", async function () {
      const [owner] = await ethers.getSigners();
      const amountInSDai = await sDAI.convertToShares(ethers.parseEther(SPLIT_AMOUNT));
      const { outcomeSlotCount, market } = await createMarketAndSplitPosition();
      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);
        expect(await token.balanceOf(owner)).to.equal(amountInSDai);
      }
      expect(await sDAI.balanceOf(conditionalTokens)).to.equal(amountInSDai);
    });
  });
  describe("mergePositions", function () {
    it("merges positions and send collateral tokens to user", async function () {
      const [owner] = await ethers.getSigners();
      const splitAmountInSDai = await sDAI.convertToShares(ethers.parseEther(SPLIT_AMOUNT));
      const mergeAmountInSDai = await sDAI.convertToShares(ethers.parseEther(MERGE_AMOUNT));
      // split first
      const { outcomeSlotCount, market } = await createMarketAndSplitPosition();

      // allow gnosisRouter to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);

        await token.approve(gnosisRouter, mergeAmountInSDai);
      }
      const balanceBeforeMerge = await ethers.provider.getBalance(owner);
      // merge positions
      const trx = await gnosisRouter.mergeToBase(
        market,
        mergeAmountInSDai,
      );

      const receipt = await trx.wait(1);
      const { gasPrice = 0n, gasUsed = 0n } = receipt ?? {};

      const balanceAfterMerge = await ethers.provider.getBalance(owner);

      expect(balanceBeforeMerge - gasPrice * gasUsed + ethers.parseEther(MERGE_AMOUNT)).to.be.closeTo(
        balanceAfterMerge,
        BigInt(10),
      );

      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);
        expect(await token.balanceOf(owner)).to.equal(splitAmountInSDai - mergeAmountInSDai);
      }
      expect(await sDAI.balanceOf(conditionalTokens)).to.equal(splitAmountInSDai - mergeAmountInSDai);
    });
  });

  describe("redeemPositions", function () {
    it("redeems a winning position and send collateral tokens to user", async function () {
      const ANSWER = 1;
      const REDEEMED_POSITION = 1;
      const [owner] = await ethers.getSigners();
      const amountInSDai = await sDAI.convertToShares(ethers.parseEther(SPLIT_AMOUNT));
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

      // allow gnosisRouter to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);

        await token.approve(gnosisRouter, amountInSDai);
      }
      const balanceBeforeRedeem = await ethers.provider.getBalance(owner);
      // redeem winning position
      const trx = await gnosisRouter.redeemToBase(market, [REDEEMED_POSITION], getRedeemAmounts(outcomeSlotCount, amountInSDai));

      const receipt = await trx.wait(1);
      const { gasPrice = 0n, gasUsed = 0n } = receipt ?? {};

      const balanceAfterRedeem = await ethers.provider.getBalance(owner);

      expect(balanceBeforeRedeem - gasPrice * gasUsed + ethers.parseEther(SPLIT_AMOUNT)).to.be.closeTo(
        balanceAfterRedeem,
        BigInt(10),
      );

      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);
        if (i === REDEEMED_POSITION) {
          expect(await token.balanceOf(owner)).to.equal("0");
        } else {
          expect(await token.balanceOf(owner)).to.equal(amountInSDai);
        }
      }
      expect(await sDAI.balanceOf(conditionalTokens)).to.equal("0");

      const winningOutcomes = await gnosisRouter.getWinningOutcomes(conditionId);
      expect(winningOutcomes[ANSWER]).to.equal(true);
    });

    it("redeems a losing position", async function () {
      const ANSWER = 1;
      const REDEEMED_POSITION = 0;
      const [owner] = await ethers.getSigners();
      const amountInSDai = await sDAI.convertToShares(ethers.parseEther(SPLIT_AMOUNT));
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

      // allow gnosisRouter to transfer position tokens to the contract
      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);

        await token.approve(gnosisRouter, amountInSDai);
      }

      const balanceBeforeRedeem = await ethers.provider.getBalance(owner);
      // redeem losing position
      const trx = await gnosisRouter.redeemToBase(market, [REDEEMED_POSITION], getRedeemAmounts(outcomeSlotCount, amountInSDai));

      const receipt = await trx.wait(1);
      const { gasPrice = 0n, gasUsed = 0n } = receipt ?? {};

      const balanceAfterRedeem = await ethers.provider.getBalance(owner);

      expect(balanceBeforeRedeem - gasPrice * gasUsed).to.be.closeTo(balanceAfterRedeem, BigInt(10));

      for (let i = 0; i < outcomeSlotCount; i++) {
        const [wrapped1155] = await market.wrappedOutcome(i);
        const token = await ethers.getContractAt("Wrapped1155", wrapped1155);
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

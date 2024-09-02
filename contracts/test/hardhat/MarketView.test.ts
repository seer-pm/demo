import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import {
  MarketFactory,
  MarketView,
  RealityETH_v3_0,
} from "../../typechain-types";
import {
  ANSWERED_TOO_SOON,
  MIN_BOND,
  OPENING_TS,
  QUESTION_TIMEOUT,
  categoricalMarketParams,
  multiCategoricalMarketParams,
  scalarMarketParams,
} from "./helpers/constants";
import { marketFactoryDeployFixture } from "./helpers/fixtures";

describe("MarketView", function () {
  let marketFactory: MarketFactory;
  let arbitrator: string;
  let marketView: MarketView;
  let realitio: RealityETH_v3_0;

  beforeEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);
    const {
      marketFactory: _marketFactory,
      realitio: _realitio,
      arbitrator: _arbitrator,
    } = await loadFixture(marketFactoryDeployFixture);

    marketFactory = _marketFactory;
    realitio = _realitio;
    arbitrator = _arbitrator;
    marketView = await ethers.deployContract("MarketView");
  });

  describe("getMarket", function () {
    it("returns market info correctly", async function () {
      await marketFactory.createCategoricalMarket(categoricalMarketParams);
      const marketAddress = (await marketFactory.allMarkets())[0];
      const market = await ethers.getContractAt("Market", marketAddress);
      const marketInfo = await marketView.getMarket(
        marketFactory,
        marketAddress
      );

      expect(marketInfo.id).to.equal(marketAddress);
      expect(marketInfo.marketName).to.equal(await market.marketName());
      expect(marketInfo.outcomes[0]).to.equal(await market.outcomes(0));
      expect(marketInfo.lowerBound).to.equal(await market.lowerBound());
      expect(marketInfo.upperBound).to.equal(await market.upperBound());
      expect(marketInfo.conditionId).to.equal(await market.conditionId());
      expect(marketInfo.questionId).to.equal(await market.questionId());
      expect(marketInfo.templateId).to.equal(await market.templateId());
      expect(marketInfo.encodedQuestions[0]).to.equal(
        await market.encodedQuestions(0)
      );
    });
  });

  describe("getMarkets", function () {
    it("returns an array of length count with default MarketInfo if no market", async function () {
      const COUNT = 2;
      const markets = await marketView.getMarkets(COUNT, marketFactory);
      expect(markets.length).to.equal(COUNT);
      expect(markets[0][0]).to.equal(ethers.ZeroAddress);
    });
    context("with 3 markets created", function () {
      let marketAddresses: string[];
      beforeEach(async function () {
        // Set up multiple markets
        await marketFactory.createCategoricalMarket(categoricalMarketParams);
        await marketFactory.createMultiCategoricalMarket(
          multiCategoricalMarketParams
        );
        await marketFactory.createScalarMarket(scalarMarketParams);
        marketAddresses = await marketFactory.allMarkets();
      });
      it("returns some markets info when count is lower than allMarkets length", async function () {
        const MARKET_COUNT = 1;
        const marketInfoList = await marketView.getMarkets(
          MARKET_COUNT,
          marketFactory
        );
        expect(marketInfoList.length).to.equal(1);
      });
      it("returns markets info correctly", async function () {
        const MARKET_COUNT = 3;
        const marketInfoList = await marketView.getMarkets(
          MARKET_COUNT,
          marketFactory
        );
        for (let i = 0; i < MARKET_COUNT; i++) {
          // the list from marketView is reversed
          const marketAddress = marketAddresses[i];
          const marketInfo = marketInfoList[MARKET_COUNT - 1 - i];
          const market = await ethers.getContractAt("Market", marketAddress);

          expect(marketInfo.id).to.equal(marketAddress);
          expect(marketInfo.marketName).to.equal(await market.marketName());
          expect(marketInfo.outcomes[0]).to.equal(await market.outcomes(0));
          expect(marketInfo.lowerBound).to.equal(await market.lowerBound());
          expect(marketInfo.upperBound).to.equal(await market.upperBound());
          expect(marketInfo.conditionId).to.equal(await market.conditionId());
          expect(marketInfo.questionId).to.equal(await market.questionId());
          expect(marketInfo.templateId).to.equal(await market.templateId());
          expect(marketInfo.encodedQuestions[0]).to.equal(
            await market.encodedQuestions(0)
          );
        }
      });
    });
  });

  describe("getQuestionId", function () {
    context("is finalized and ANSWERD_TOO_SOON", function () {
      let questionId: string;
      let openingTime: number;
      let templateId: BigInt;
      beforeEach(async function () {
        const currentBlockTime = await time.latest();
        openingTime = currentBlockTime + categoricalMarketParams.openingTime;
        await marketFactory.createCategoricalMarket({
          ...categoricalMarketParams,
          openingTime,
        });
        const marketAddress = (await marketFactory.allMarkets())[0];
        const market = await ethers.getContractAt("Market", marketAddress);
        questionId = (await market.questionsIds())[0];
        templateId = await market.templateId();

        // past opening_ts
        await time.increase(OPENING_TS);

        //submit an answered-too-soon
        await realitio.submitAnswer(questionId, ANSWERED_TOO_SOON, 0, {
          value: ethers.parseEther(MIN_BOND),
        });

        // past finalized_ts
        await time.increase(QUESTION_TIMEOUT);
      });
      it("returns the orignial question id if not reopened", async function () {
        expect(await marketView.getQuestionId(questionId, realitio)).to.equal(
          questionId
        );
      });
      it("returns a replacement question id if reopened", async function () {
        // reopen question
        const NONCE = 1;
        const trx = await realitio.reopenQuestion(
          templateId.toString(),
          categoricalMarketParams.encodedQuestions[0],
          arbitrator,
          QUESTION_TIMEOUT,
          openingTime,
          NONCE,
          ethers.parseEther(MIN_BOND),
          questionId
        );
        const receipt = await trx.wait(1);
        const events = await realitio.queryFilter(
          realitio.filters.LogReopenQuestion,
          receipt?.blockNumber
        );
        const reopenedQuestionId = events[0].args[0];
        expect(await marketView.getQuestionId(questionId, realitio)).to.equal(
          reopenedQuestionId
        );
      });
    });
  });
});

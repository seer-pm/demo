import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { MarketFactory, QuestionsFactory, RealityETH_v3_0, Wrapped1155Factory } from "../../typechain-types";
import { REALITY_UINT_TEMPLATE, SHORT_QUESTION_TIMEOUT, type MarketParams } from "./helpers/constants";
import { marketFactoryDeployFixture } from "./helpers/fixtures";

describe("QuestionsFactory", function () {
  let marketFactory: MarketFactory;
  let questionsFactory: QuestionsFactory;
  let wrapped1155Factory: Wrapped1155Factory;
  let realitio: RealityETH_v3_0;

  let categoricalMarketParams: MarketParams;
  let multiScalarMarketParams: MarketParams;

  beforeEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);
    const {
      marketFactory: _marketFactory,
      questionsFactory: _questionsFactory,
      wrapped1155Factory: _wrapped1155Factory,
      realitio: _realitio,
      marketParams: _marketParams,
    } = await loadFixture(marketFactoryDeployFixture);

    marketFactory = _marketFactory;
    questionsFactory = _questionsFactory;
    wrapped1155Factory = _wrapped1155Factory;
    realitio = _realitio;
    categoricalMarketParams = _marketParams.categoricalMarketParams;
    multiScalarMarketParams = _marketParams.multiScalarMarketParams;
  });

  it("computes the question id MarketFactory asks for a custom timeout", async function () {
    const params = { ...categoricalMarketParams, questionTimeout: SHORT_QUESTION_TIMEOUT };
    const expectedQuestionId = await questionsFactory.calculateRealityQuestionId(
      categoricalMarketParams.encodedQuestions[0],
      2,
      params.openingTime,
      params.minBond,
      params.questionTimeout,
    );

    const marketAddress = await marketFactory.createCategoricalMarket.staticCall(params);
    await marketFactory.createCategoricalMarket(params);
    const market = await ethers.getContractAt("Market", marketAddress);

    expect((await market.questionsIds())[0]).to.equal(expectedQuestionId);
  });

  it("pre-deploys the outcome tokens MarketFactory later finds, for a custom collateral", async function () {
    const collateral = await ethers.deployContract("CollateralToken6");
    const params = {
      ...multiScalarMarketParams,
      collateralToken: await collateral.getAddress(),
      questionTimeout: SHORT_QUESTION_TIMEOUT,
    };

    // outcomes 0 and 1 in one batch, the invalid outcome is always deployed
    const trx = await questionsFactory.createMultiScalarMarket(params, 0, 2, false, true);
    const receipt = await trx.wait(1);
    const preDeployed = (
      await wrapped1155Factory.queryFilter(wrapped1155Factory.filters.Wrapped1155Creation, receipt?.blockNumber)
    ).map((event) => event.args[2]);
    expect(preDeployed.length).to.equal(3);

    const marketAddress = await marketFactory.createMultiScalarMarket.staticCall(params);
    await marketFactory.createMultiScalarMarket(params);
    const market = await ethers.getContractAt("Market", marketAddress);

    for (let i = 0; i < 3; i++) {
      const [marketWrapped] = await market.wrappedOutcome(i);
      const token = await ethers.getContractAt("Wrapped1155", marketWrapped);
      expect(await token.decimals()).to.equal(6);
      expect(preDeployed).to.include(marketWrapped);
    }
  });

  it("pre-asks the questions MarketFactory later finds", async function () {
    const params = { ...multiScalarMarketParams, questionTimeout: SHORT_QUESTION_TIMEOUT };
    const expectedQuestionsIds = await Promise.all(
      params.encodedQuestions.map((encodedQuestion) =>
        questionsFactory.calculateRealityQuestionId(
          encodedQuestion,
          REALITY_UINT_TEMPLATE,
          params.openingTime,
          params.minBond,
          params.questionTimeout,
        ),
      ),
    );

    // one question per batch
    for (let i = 0; i < expectedQuestionsIds.length; i++) {
      const trx = await questionsFactory.createMultiScalarMarket(params, i, i + 1, true, false);
      const receipt = await trx.wait(1);
      const asked = (await realitio.queryFilter(realitio.filters.LogNewQuestion, receipt?.blockNumber)).map(
        (event) => event.args[0],
      );
      expect(asked).to.deep.equal([expectedQuestionsIds[i]]);
      expect(await realitio.getTimeout(expectedQuestionsIds[i])).to.equal(SHORT_QUESTION_TIMEOUT);
    }

    const marketAddress = await marketFactory.createMultiScalarMarket.staticCall(params);
    const trx = await marketFactory.createMultiScalarMarket(params);
    const receipt = await trx.wait(1);
    const market = await ethers.getContractAt("Market", marketAddress);

    expect(await market.questionsIds()).to.deep.equal(expectedQuestionsIds);
    // the factory reuses the questions instead of asking them again
    expect(await realitio.queryFilter(realitio.filters.LogNewQuestion, receipt?.blockNumber)).to.have.length(0);
  });

  it("rejects a questions range past the encoded questions", async function () {
    await expect(
      questionsFactory.createMultiScalarMarket(
        multiScalarMarketParams,
        0,
        multiScalarMarketParams.encodedQuestions.length + 1,
        true,
        false,
      ),
    ).to.be.revertedWith("to exceeds encodedQuestions length");
    await expect(questionsFactory.createCategoricalMarket(categoricalMarketParams, 1, 0, true, false)).to.be.revertedWith(
      "from must be <= to",
    );
  });
});

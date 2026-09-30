import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { MarketFactory, QuestionsFactory, Wrapped1155Factory } from "../../typechain-types";
import { SHORT_QUESTION_TIMEOUT, type MarketParams } from "./helpers/constants";
import { marketFactoryDeployFixture } from "./helpers/fixtures";

describe("QuestionsFactory", function () {
  let marketFactory: MarketFactory;
  let questionsFactory: QuestionsFactory;
  let wrapped1155Factory: Wrapped1155Factory;

  let categoricalMarketParams: MarketParams;
  let multiScalarMarketParams: MarketParams;

  beforeEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);
    const {
      marketFactory: _marketFactory,
      questionsFactory: _questionsFactory,
      wrapped1155Factory: _wrapped1155Factory,
      marketParams: _marketParams,
    } = await loadFixture(marketFactoryDeployFixture);

    marketFactory = _marketFactory;
    questionsFactory = _questionsFactory;
    wrapped1155Factory = _wrapped1155Factory;
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

  it("rejects question creation", async function () {
    await expect(
      questionsFactory.createCategoricalMarket(categoricalMarketParams, 0, 1, true, false),
    ).to.be.revertedWith("Question creation is not supported by MarketFactory");
  });
});

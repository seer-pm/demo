import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Market, RealityProxy } from "../../typechain-types";
import { getQuestionId } from "./helpers/utils";

describe("Market", function () {
  let market: Market;
  let realityProxy: RealityProxy;

  beforeEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);

    const conditionalTokens = await ethers.deployContract("ConditionalTokens");
    const realitio = await ethers.deployContract("RealityETH_v3_0");

    realityProxy = await (await ethers.getContractFactory("RealityProxy")).deploy(conditionalTokens, realitio);

    market = await ethers.deployContract("Market");
  });

  describe("Initialization", function () {
    it("initializes the contract correctly", async function () {
      const marketName = "Test Market";
      const outcomes = ["Outcome1", "Outcome2"];
      const lowerBound = 0;
      const upperBound = 100;
      const conditionId = ethers.hexlify(ethers.randomBytes(32));
      const wrapped1155 = [ethers.ZeroAddress, ethers.ZeroAddress];
      const data = [ethers.hexlify(ethers.randomBytes(32)), ethers.hexlify(ethers.randomBytes(32))];
      const questionsIds = [ethers.hexlify(ethers.randomBytes(32)), ethers.hexlify(ethers.randomBytes(32))];
      const templateId = 1;
      const encodedQuestions = ["encoded1", "encoded2"];

      const questionId = getQuestionId(questionsIds, outcomes.length + 1, templateId, lowerBound, upperBound);

      await market.initialize(
        marketName,
        outcomes,
        lowerBound,
        upperBound,
        {
          conditionId,
          parentCollectionId: ethers.hexlify(ethers.randomBytes(32)),
          parentOutcome: 0,
          parentMarket: ethers.ZeroAddress,
          questionId,
          wrapped1155,
          data,
        },
        {
          questionsIds,
          templateId,
          encodedQuestions,
        },
        realityProxy,
      );

      expect(await market.initialized()).to.equal(true);
      expect(await market.marketName()).to.equal(marketName);
      expect(await market.outcomes(0)).to.equal(outcomes[0]);
      expect(await market.outcomes(1)).to.equal(outcomes[1]);
      expect(await market.lowerBound()).to.equal(lowerBound);
      expect(await market.upperBound()).to.equal(upperBound);
      expect(await market.conditionId()).to.equal(conditionId);
      expect(await market.questionId()).to.equal(questionId);
      expect(await market.questionsIds()).to.deep.equal(questionsIds);
      expect(await market.templateId()).to.equal(templateId);
      expect(await market.encodedQuestions(0)).to.equal(encodedQuestions[0]);
      expect(await market.encodedQuestions(1)).to.equal(encodedQuestions[1]);
      expect(await market.realityProxy()).to.equal(realityProxy);
    });

    it("reverts if already initialized", async function () {
      await market.initialize(
        "Test Market",
        ["Outcome1"],
        0,
        100,
        {
          conditionId: ethers.hexlify(ethers.randomBytes(32)),
          parentCollectionId: ethers.hexlify(ethers.randomBytes(32)),
          parentOutcome: 0,
          parentMarket: ethers.ZeroAddress,
          questionId: ethers.hexlify(ethers.randomBytes(32)),
          wrapped1155: [ethers.ZeroAddress, ethers.ZeroAddress],
          data: [ethers.hexlify(ethers.randomBytes(32)), ethers.hexlify(ethers.randomBytes(32))],
        },
        {
          questionsIds: [ethers.hexlify(ethers.randomBytes(32))],
          templateId: 1,
          encodedQuestions: ["encoded1"],
        },
        realityProxy,
      );

      await expect(
        market.initialize(
          "Another Market",
          ["Outcome2"],
          0,
          100,
          {
            conditionId: ethers.hexlify(ethers.randomBytes(32)),
            parentCollectionId: ethers.hexlify(ethers.randomBytes(32)),
            parentOutcome: 0,
            parentMarket: ethers.ZeroAddress,
            questionId: ethers.hexlify(ethers.randomBytes(32)),
            wrapped1155: [],
            data: [],
          },
          {
            questionsIds: [ethers.hexlify(ethers.randomBytes(32))],
            templateId: 1,
            encodedQuestions: ["encoded2"],
          },
          realityProxy,
        ),
      ).to.be.revertedWith("Already initialized.");
    });
  });

  describe("Getters", function () {
    beforeEach(async function () {
      await market.initialize(
        "Test Market",
        ["Outcome1", "Outcome2", "Outcome3"],
        0,
        100,
        {
          conditionId: ethers.hexlify(ethers.randomBytes(32)),
          parentCollectionId: ethers.hexlify(ethers.randomBytes(32)),
          parentOutcome: 0,
          parentMarket: ethers.ZeroAddress,
          questionId: ethers.hexlify(ethers.randomBytes(32)),
          wrapped1155: [ethers.ZeroAddress, ethers.ZeroAddress],
          data: [ethers.hexlify(ethers.randomBytes(32)), ethers.hexlify(ethers.randomBytes(32))],
        },
        {
          questionsIds: [ethers.hexlify(ethers.randomBytes(32)), ethers.hexlify(ethers.randomBytes(32))],
          templateId: 1,
          encodedQuestions: ["encoded1", "encoded2"],
        },
        realityProxy,
      );
    });

    it("returns the correct number of outcomes", async function () {
      expect(await market.numOutcomes()).to.equal(3);
    });

    it("return zero values when there is no parent market", async function () {
      // Get the parent wrapped outcome
      const [parentWrapped1155, parentData] = await market.parentWrappedOutcome();

      // Check if the returned values are the default zero values
      expect(parentWrapped1155).to.equal(ethers.ZeroAddress);
      expect(parentData).to.equal("0x");
    });
  });
  describe("Parent Market", function () {
    it("returns the correct parent wrapped outcome", async function () {
      // Deploy a parent market
      const parentMarket = await ethers.deployContract("Market");

      // Initialize the parent market
      await parentMarket.initialize(
        "Parent Market",
        ["ParentOutcome1", "ParentOutcome2"],
        0,
        100,
        {
          conditionId: ethers.hexlify(ethers.randomBytes(32)),
          parentCollectionId: ethers.hexlify(ethers.randomBytes(32)),
          parentOutcome: 0,
          parentMarket: ethers.ZeroAddress,
          questionId: ethers.hexlify(ethers.randomBytes(32)),
          wrapped1155: [ethers.ZeroAddress, ethers.ZeroAddress],
          data: [ethers.hexlify(ethers.randomBytes(32)), ethers.hexlify(ethers.randomBytes(32))],
        },
        {
          questionsIds: [ethers.hexlify(ethers.randomBytes(32)), ethers.hexlify(ethers.randomBytes(32))],
          templateId: 1,
          encodedQuestions: ["encodedParent1", "encodedParent2"],
        },
        realityProxy,
      );

      // Initialize the child market with a parent
      const parentOutcome = 1; // Using the second outcome of the parent market
      await market.initialize(
        "Child Market",
        ["ChildOutcome1", "ChildOutcome2"],
        0,
        100,
        {
          conditionId: ethers.hexlify(ethers.randomBytes(32)),
          parentCollectionId: ethers.hexlify(ethers.randomBytes(32)),
          parentOutcome: parentOutcome,
          parentMarket: await parentMarket.getAddress(),
          questionId: ethers.hexlify(ethers.randomBytes(32)),
          wrapped1155: [ethers.ZeroAddress, ethers.ZeroAddress],
          data: [ethers.hexlify(ethers.randomBytes(32)), ethers.hexlify(ethers.randomBytes(32))],
        },
        {
          questionsIds: [ethers.hexlify(ethers.randomBytes(32)), ethers.hexlify(ethers.randomBytes(32))],
          templateId: 1,
          encodedQuestions: ["encodedChild1", "encodedChild2"],
        },
        realityProxy,
      );

      // Get the parent wrapped outcome
      const [parentWrapped1155, parentData] = await market.parentWrappedOutcome();

      // Get the expected wrapped1155 and data from the parent market
      const [expectedWrapped1155, expectedData] = await parentMarket.wrappedOutcome(parentOutcome);

      // Check if the returned values match the expected values
      expect(parentWrapped1155).to.equal(expectedWrapped1155);
      expect(parentData).to.equal(expectedData);
    });
  });
});

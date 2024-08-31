import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Market, RealityProxy } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { getQuestionId } from "./helpers/utils";

describe("Market", function () {
  let market: Market;
  let realityProxy: RealityProxy;

  beforeEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);

    const conditionalTokens = await ethers.deployContract("ConditionalTokens");
    const realitio = await ethers.deployContract("RealityETH_v3_0");

    realityProxy = await (
      await ethers.getContractFactory("RealityProxy")
    ).deploy(conditionalTokens, realitio);

    market = await ethers.deployContract("Market");
  });

  describe("Initialization", function () {
    it("initializes the contract correctly", async function () {
      const marketName = "Test Market";
      const outcomes = ["Outcome1", "Outcome2"];
      const lowerBound = 0;
      const upperBound = 100;
      const conditionId = ethers.hexlify(ethers.randomBytes(32));
      const questionsIds = [
        ethers.hexlify(ethers.randomBytes(32)),
        ethers.hexlify(ethers.randomBytes(32)),
      ];
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
          questionId,
        },
        {
          questionsIds,
          templateId,
          encodedQuestions
        },
        realityProxy
      );

      expect(await market.initialized()).to.equal(true);
      expect(await market.marketName()).to.equal(marketName);
      expect(await market.outcomes(0)).to.equal(outcomes[0]);
      expect(await market.outcomes(1)).to.equal(outcomes[1]);
      expect(await market.lowerBound()).to.equal(lowerBound);
      expect(await market.upperBound()).to.equal(upperBound);
      expect(await market.conditionId()).to.equal(conditionId);
      expect(await market.questionId()).to.equal(questionId);
      expect(await market.questionsIds(0)).to.equal(questionsIds[0]);
      expect(await market.questionsIds(1)).to.equal(questionsIds[1]);
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
          questionId: ethers.hexlify(ethers.randomBytes(32)),
        },
        {
          questionsIds: [
            ethers.hexlify(ethers.randomBytes(32)),
          ],
          templateId: 1,
          encodedQuestions: ["encoded1"]
        },
        realityProxy
      );

      await expect(
        market.initialize(
          "Another Market",
          ["Outcome2"],
          0,
          100,
          {
            conditionId: ethers.hexlify(ethers.randomBytes(32)),
            questionId: ethers.hexlify(ethers.randomBytes(32)),
          },
          {
            questionsIds: [
              ethers.hexlify(ethers.randomBytes(32)),
            ],
            templateId: 1,
            encodedQuestions: ["encoded2"]
          },
          realityProxy
        )
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
          questionId: ethers.hexlify(ethers.randomBytes(32)),
        },
        {
          questionsIds: [
            ethers.hexlify(ethers.randomBytes(32)),
            ethers.hexlify(ethers.randomBytes(32)),
          ],
          templateId: 1,
          encodedQuestions: ["encoded1", "encoded2"]
        },
        realityProxy
      );
    });

    it("returns the correct number of outcomes", async function () {
      expect(await market.numOutcomes()).to.equal(3);
    });
  });
});

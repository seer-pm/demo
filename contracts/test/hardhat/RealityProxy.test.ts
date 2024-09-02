import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import {
  ConditionalTokens,
  MarketFactory,
  RealityETH_v3_0,
  RealityProxy,
} from "../../typechain-types";
import {
  INVALID_RESULT,
  MIN_BOND,
  OPENING_TS,
  QUESTION_TIMEOUT,
  categoricalMarketParams,
  multiCategoricalMarketParams,
  multiScalarMarketParams,
  scalarMarketParams,
} from "./helpers/constants";
import { marketFactoryDeployFixture } from "./helpers/fixtures";
import { getBitMaskDecimal } from "./helpers/utils";

describe("RealityProxy", function () {
  let marketFactory: MarketFactory;
  let conditionalTokens: ConditionalTokens;
  let realitio: RealityETH_v3_0;
  let realityProxy: RealityProxy;

  beforeEach(async function () {
    await network.provider.send("evm_setAutomine", [true]);
    const {
      marketFactory: _marketFactory,
      realitio: _realitio,
      conditionalTokens: _conditionalTokens,
      realityProxy: _realityProxy,
    } = await loadFixture(marketFactoryDeployFixture);

    marketFactory = _marketFactory;
    realitio = _realitio;
    conditionalTokens = _conditionalTokens;
    realityProxy = _realityProxy;
  });

  describe("resolve", function () {
    context("resolving a categorical market", function () {
      async function resolveCategoricalMarket(answer: number | string) {
        const currentBlockTime = await time.latest();
        await marketFactory.createCategoricalMarket({
          ...categoricalMarketParams,
          openingTime: currentBlockTime + OPENING_TS,
        });
        const marketAddress = (await marketFactory.allMarkets())[0];
        const market = await ethers.getContractAt("Market", marketAddress);
        const questionId = await market.questionId();
        const oracleAddress = await realityProxy.getAddress();
        const conditionId = await conditionalTokens.getConditionId(
          oracleAddress,
          questionId,
          categoricalMarketParams.outcomes.length + 1
        );
        // past opening_ts
        await time.increase(OPENING_TS);
        // submit answer
        await realitio.submitAnswer(
          (await market.questionsIds())[0],
          ethers.toBeHex(BigInt(answer), 32),
          0,
          {
            value: ethers.parseEther(MIN_BOND),
          }
        );

        // past finalized_ts
        await time.increase(QUESTION_TIMEOUT);

        const trx = await realityProxy.resolve(market);
        const receipt = await trx.wait(1);
        const events = await conditionalTokens.queryFilter(
          conditionalTokens.filters.ConditionResolution,
          receipt?.blockNumber
        );
        return {
          eventArgs: events[0].args,
          conditionId,
          questionId,
          oracleAddress,
        };
      }
      it("sets last payout to 1 if INVALID_RESULT", async function () {
        const { eventArgs } = await resolveCategoricalMarket(INVALID_RESULT);
        const eventPayouts = eventArgs[4];
        expect([0, 0, 1]).to.deep.equal(eventPayouts.map(Number));
      });
      it("sets last payout to 1 if answer is equal to or higher than outcomes length", async function () {
        const ANSWER = 2;
        const { eventArgs } = await resolveCategoricalMarket(ANSWER);
        const eventPayouts = eventArgs[4];
        expect([0, 0, 1]).to.deep.equal(eventPayouts.map(Number));
      });
      it("resolves the market", async function () {
        const ANSWER = 1;
        const { eventArgs, conditionId, questionId, oracleAddress } =
          await resolveCategoricalMarket(ANSWER);
        const [
          eventConditionId,
          sender,
          eventQuestionId,
          eventOutcomeSlotCount,
          eventPayouts,
        ] = eventArgs;
        expect(eventConditionId).to.equal(conditionId);
        expect(sender).to.equal(oracleAddress);
        expect(eventQuestionId).to.equal(questionId);
        expect(Number(eventOutcomeSlotCount)).to.equal(
          categoricalMarketParams.outcomes.length + 1
        );
        expect(
          Array(categoricalMarketParams.outcomes.length + 1)
            .fill(0)
            .map((_, index) => (index === ANSWER ? 1 : 0))
        ).to.deep.equal(eventPayouts.map(Number));
      });
    });

    context("resolving a multi categorical market", function () {
      async function resolveMultiCategoricalMarket(answer: number | string) {
        const currentBlockTime = await time.latest();
        await marketFactory.createMultiCategoricalMarket({
          ...multiCategoricalMarketParams,
          openingTime: currentBlockTime + OPENING_TS,
        });

        const marketAddress = (await marketFactory.allMarkets())[0];
        const market = await ethers.getContractAt("Market", marketAddress);
        const questionId = await market.questionId();
        const oracleAddress = await realityProxy.getAddress();
        const conditionId = await conditionalTokens.getConditionId(
          oracleAddress,
          questionId,
          multiCategoricalMarketParams.outcomes.length + 1
        );
        // past opening_ts
        await time.increase(OPENING_TS);
        // submit answer
        await realitio.submitAnswer(
          (await market.questionsIds())[0],
          ethers.toBeHex(BigInt(answer), 32),
          0,
          {
            value: ethers.parseEther(MIN_BOND),
          }
        );

        // past finalized_ts
        await time.increase(QUESTION_TIMEOUT);

        const trx = await realityProxy.resolve(market);
        const receipt = await trx.wait(1);
        const events = await conditionalTokens.queryFilter(
          conditionalTokens.filters.ConditionResolution,
          receipt?.blockNumber
        );
        return {
          eventArgs: events[0].args,
          conditionId,
          questionId,
          oracleAddress,
        };
      }
      it("sets last payout to 1 if INVALID_RESULT", async function () {
        const { eventArgs } =
          await resolveMultiCategoricalMarket(INVALID_RESULT);
        const eventPayouts = eventArgs[4];
        expect([0, 0, 0, 1]).to.deep.equal(eventPayouts.map(Number));
      });
      it("sets last payout to 1 if all answers are 0", async function () {
        const ANSWER: number[] = [];
        const { eventArgs } = await resolveMultiCategoricalMarket(
          getBitMaskDecimal(
            ANSWER,
            multiCategoricalMarketParams.outcomes.length
          )
        );
        const eventPayouts = eventArgs[4];
        expect([0, 0, 0, 1]).to.deep.equal(eventPayouts.map(Number));
      });
      it("resolves a multi categorical market", async function () {
        const ANSWER = [0, 2];
        const { eventArgs, conditionId, questionId, oracleAddress } =
          await resolveMultiCategoricalMarket(
            getBitMaskDecimal(
              ANSWER,
              multiCategoricalMarketParams.outcomes.length
            )
          );
        const [
          eventConditionId,
          sender,
          eventQuestionId,
          eventOutcomeSlotCount,
          eventPayouts,
        ] = eventArgs;
        expect(eventConditionId).to.equal(conditionId);
        expect(sender).to.equal(oracleAddress);
        expect(eventQuestionId).to.equal(questionId);
        expect(Number(eventOutcomeSlotCount)).to.equal(
          multiCategoricalMarketParams.outcomes.length + 1
        );
        expect(
          Array(multiCategoricalMarketParams.outcomes.length + 1)
            .fill(0)
            .map((_, index) => (ANSWER.includes(index) ? 1 : 0))
        ).to.deep.equal(eventPayouts.map(Number));
      });
    });

    context("resolving a scalar market", function () {
      async function resolveScalarMarket(answer: number | string) {
        const currentBlockTime = await time.latest();
        await marketFactory.createScalarMarket({
          ...scalarMarketParams,
          openingTime: currentBlockTime + OPENING_TS,
        });
        await marketFactory.createScalarMarket(scalarMarketParams);
        const marketAddress = (await marketFactory.allMarkets())[0];
        const market = await ethers.getContractAt("Market", marketAddress);
        const questionId = await market.questionId();
        const oracleAddress = await realityProxy.getAddress();
        const conditionId = await conditionalTokens.getConditionId(
          oracleAddress,
          questionId,
          scalarMarketParams.outcomes.length + 1
        );
        // past opening_ts
        await time.increase(OPENING_TS);
        // submit answer
        await realitio.submitAnswer(
          (await market.questionsIds())[0],
          ethers.toBeHex(BigInt(answer), 32),
          0,
          {
            value: ethers.parseEther(MIN_BOND),
          }
        );

        // past finalized_ts
        await time.increase(QUESTION_TIMEOUT);

        const trx = await realityProxy.resolve(market);
        const receipt = await trx.wait(1);
        const events = await conditionalTokens.queryFilter(
          conditionalTokens.filters.ConditionResolution,
          receipt?.blockNumber
        );

        return {
          eventArgs: events[0].args,
          conditionId,
          questionId,
          oracleAddress,
        };
      }
      it("sets last payout to 1 if INVALID_RESULT", async function () {
        const { eventArgs } = await resolveScalarMarket(INVALID_RESULT);
        const eventPayouts = eventArgs[4];
        expect([0, 0, 1]).to.deep.equal(eventPayouts.map(Number));
      });
      it("sets first payout to 1 if answer is lower than low", async function () {
        const ANSWER = 10; //lowerBound is 20
        const { eventArgs } = await resolveScalarMarket(ANSWER);
        const eventPayouts = eventArgs[4];
        expect([1, 0, 0]).to.deep.equal(eventPayouts.map(Number));
      });
      it("sets second payout to 1 if answer is higher than high", async function () {
        const ANSWER = 120;
        const { eventArgs } = await resolveScalarMarket(ANSWER);
        const eventPayouts = eventArgs[4];
        expect([0, 1, 0]).to.deep.equal(eventPayouts.map(Number));
      });
      it("set payouts equal to the equation and resolves the market if answer is between high and low", async function () {
        const ANSWER = 80;
        const { eventArgs, conditionId, questionId, oracleAddress } =
          await resolveScalarMarket(ANSWER);
        const [
          eventConditionId,
          sender,
          eventQuestionId,
          eventOutcomeSlotCount,
          eventPayouts,
        ] = eventArgs;
        expect(eventConditionId).to.equal(conditionId);
        expect(sender).to.equal(oracleAddress);
        expect(eventQuestionId).to.equal(questionId);
        expect(Number(eventOutcomeSlotCount)).to.equal(
          scalarMarketParams.outcomes.length + 1
        );
        expect([
          scalarMarketParams.upperBound - ANSWER,
          ANSWER - scalarMarketParams.lowerBound,
          0,
        ]).to.deep.equal(eventPayouts.map(Number));
      });
    });

    context("resolving a multi scalar market", function () {
      async function resolveMultiScalarMarket(
        answers: (number | string | bigint)[]
      ) {
        const currentBlockTime = await time.latest();
        await marketFactory.createMultiScalarMarket({
          ...multiScalarMarketParams,
          openingTime: currentBlockTime + OPENING_TS,
        });
        const marketAddress = (await marketFactory.allMarkets())[0];
        const market = await ethers.getContractAt("Market", marketAddress);
        const questionId = await market.questionId();
        const oracleAddress = await realityProxy.getAddress();
        const conditionId = await conditionalTokens.getConditionId(
          oracleAddress,
          questionId,
          multiScalarMarketParams.outcomes.length + 1
        );
        const questionsIds = await market.questionsIds();

        // past opening_ts
        await time.increase(OPENING_TS);
        // submit answers
        for (let i = 0; i < questionsIds.length; i++) {
          await realitio.submitAnswer(
            questionsIds[i],
            ethers.toBeHex(BigInt(answers[i]), 32),
            0,
            {
              value: ethers.parseEther(MIN_BOND),
            }
          );
        }

        // past finalized_ts
        await time.increase(QUESTION_TIMEOUT);

        const trx = await realityProxy.resolve(market);
        const receipt = await trx.wait(1);
        const events = await conditionalTokens.queryFilter(
          conditionalTokens.filters.ConditionResolution,
          receipt?.blockNumber
        );
        return {
          eventArgs: events[0].args,
          conditionId,
          questionId,
          oracleAddress,
        };
      }
      it("sets payout to 0 if INVALID_RESULT", async function () {
        const ANSWERS = [30, INVALID_RESULT];
        const { eventArgs } = await resolveMultiScalarMarket(ANSWERS);
        const eventPayouts = eventArgs[4];
        expect(eventPayouts[1]).to.equal(BigInt(0));
      });
      it("sets payout to maxPayout if higher", async function () {
        const maxPayout = BigInt(2) ** BigInt(256 / 2) - BigInt(1);
        const ANSWERS = [30, maxPayout + BigInt(1000)];
        const { eventArgs } = await resolveMultiScalarMarket(ANSWERS);
        const eventPayouts = eventArgs[4];
        expect(eventPayouts[1]).to.equal(maxPayout);
      });
      it("sets last payout to 1 if all payouts are zero", async function () {
        const ANSWERS = [0, 0];
        const { eventArgs } = await resolveMultiScalarMarket(ANSWERS);
        const eventPayouts = eventArgs[4];
        expect(eventPayouts[2]).to.equal(BigInt(1));
      });
      it("sets payouts equal to answers and resolves the market", async function () {
        const ANSWERS = [30, 45];
        const { eventArgs, conditionId, questionId, oracleAddress } =
          await resolveMultiScalarMarket(ANSWERS);
        const [
          eventConditionId,
          sender,
          eventQuestionId,
          eventOutcomeSlotCount,
          eventPayouts,
        ] = eventArgs;
        expect(eventConditionId).to.equal(conditionId);
        expect(sender).to.equal(oracleAddress);
        expect(eventQuestionId).to.equal(questionId);
        expect(Number(eventOutcomeSlotCount)).to.equal(
          multiScalarMarketParams.outcomes.length + 1
        );
        expect([...ANSWERS, 0]).to.deep.equal(eventPayouts.map(Number));
      });
    });
  });
});

import { BigInt } from "@graphprotocol/graph-ts";
import {
  MarketFactory,
  NewMarket as NewMarketEvent,
} from "../generated/MarketFactory/MarketFactory";
import { Reality } from "../generated/Reality/Reality";
import {
  Condition,
  Market,
  MarketQuestion,
  MarketsCount,
  Question,
} from "../generated/schema";
import { DEFAULT_FINALIZE_TS } from "./reality";

function getNextMarketIndex(): BigInt {
  let marketsCount = MarketsCount.load("markets-count");
  if (!marketsCount) {
    marketsCount = new MarketsCount("markets-count");
    marketsCount.count = BigInt.fromI32(0);
  }

  marketsCount.count = marketsCount.count.plus(BigInt.fromI32(1));
  marketsCount.save();
  return marketsCount.count;
}

export function handleNewMarket(event: NewMarketEvent): void {
  const marketFactory = MarketFactory.bind(event.address);
  const market = new Market(event.params.market.toHexString());
  market.creator = event.transaction.from;
  market.marketName = event.params.marketName;
  market.outcomes = event.params.outcomes;
  market.outcomesSupply = BigInt.fromI32(0);
  market.lowerBound = event.params.lowerBound;
  market.upperBound = event.params.upperBound;
  market.conditionId = event.params.conditionId;
  market.questionId = event.params.questionId;
  market.questionsIds = event.params.questionsIds;
  market.templateId = event.params.templateId;
  market.encodedQuestions = event.params.encodedQuestions;
  market.payoutReported = false;
  market.openingTs = BigInt.fromI32(0);
  market.finalizeTs = DEFAULT_FINALIZE_TS;
  market.questionsInArbitration = BigInt.fromI32(0);
  market.hasAnswers = false;
  market.index = getNextMarketIndex();

  const reality = Reality.bind(marketFactory.realitio());

  for (let i = 0; i < market.questionsIds.length; i++) {
    const questionResult = reality.questions(market.questionsIds[i]);

    if (i === 0) {
      // all the questions have the same opening_ts
      market.openingTs = questionResult.getOpening_ts();
    }

    const question = new Question(market.questionsIds[i].toHexString());
    question.index = i;
    question.arbitrator = questionResult.getArbitrator();
    question.opening_ts = questionResult.getOpening_ts();
    question.timeout = questionResult.getTimeout();
    question.finalize_ts = questionResult.getFinalize_ts();
    question.is_pending_arbitration =
      questionResult.getIs_pending_arbitration();
    question.best_answer = questionResult.getBest_answer();
    question.bond = questionResult.getBond();
    question.min_bond = questionResult.getMin_bond();
    question.arbitration_occurred = false;
    question.save();

    const marketQuestion = new MarketQuestion(
      market.id.concat(market.questionsIds[i].toHexString()).concat(i.toString())
    );
    marketQuestion.market = market.id;
    marketQuestion.question = question.id;
    marketQuestion.index = i;
    marketQuestion.save();
  }

  market.blockNumber = event.block.number;
  market.blockTimestamp = event.block.timestamp;
  market.transactionHash = event.transaction.hash;

  market.save();

  const condition = new Condition(market.conditionId.toHexString());
  condition.market = market.id;
  condition.save();
}

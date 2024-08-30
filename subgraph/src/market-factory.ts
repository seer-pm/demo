import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  NewMarket as NewMarketEvent,
} from "../generated/MarketFactory/MarketFactory";
import {
  MarketView,
} from "../generated/MarketFactory/MarketView";
import {
  Condition,
  Market,
  MarketQuestion,
  MarketsCount,
  Question,
} from "../generated/schema";
import { DEFAULT_FINALIZE_TS } from "./reality";

const MARKET_VIEW_ADDRESS = '0xe81c8B6e1Cf8bC89d362770Ba7C4c5038F162568';

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
  const marketView = MarketView.bind(Address.fromString(MARKET_VIEW_ADDRESS));

  const market = new Market(event.params.market.toHexString());

  const data = marketView.getMarket(event.address, Address.fromString(market.id));

  market.factory = event.address;
  market.creator = event.transaction.from;
  market.marketName = event.params.marketName;
  market.rules = event.params.rules;
  market.outcomes = data.outcomes;
  market.outcomesSupply = BigInt.fromI32(0);
  market.lowerBound = data.lowerBound;
  market.upperBound = data.upperBound;
  market.parentConditionId = data.parentCollectionId;
  market.parentOutcome = data.parentOutcome;
  market.parentMarket = event.params.parentMarket;
  market.conditionId = event.params.conditionId;
  market.questionId = event.params.questionId;
  market.questionsIds = event.params.questionsIds;
  market.templateId = data.templateId;
  market.encodedQuestions = data.encodedQuestions;
  market.payoutReported = false;
  market.openingTs = BigInt.fromI32(0);
  market.finalizeTs = DEFAULT_FINALIZE_TS;
  market.questionsInArbitration = BigInt.fromI32(0);
  market.hasAnswers = false;
  market.index = getNextMarketIndex();

  for (let i = 0; i < market.questionsIds.length; i++) {
    const questionResult = data.questions[i];

    if (i === 0) {
      // all the questions have the same opening_ts
      market.openingTs = questionResult.opening_ts;
    }

    const question = new Question(market.questionsIds[i].toHexString());
    question.index = i;
    question.arbitrator = questionResult.arbitrator;
    question.opening_ts = questionResult.opening_ts;
    question.timeout = questionResult.timeout;
    question.finalize_ts = questionResult.finalize_ts;
    question.is_pending_arbitration =
      questionResult.is_pending_arbitration;
    question.best_answer = questionResult.best_answer;
    question.bond = questionResult.bond;
    question.min_bond = questionResult.min_bond;
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

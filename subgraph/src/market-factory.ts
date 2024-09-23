import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { MarketFactory, NewMarket as NewMarketEvent } from "../generated/MarketFactory/MarketFactory";
import { MarketView } from "../generated/MarketFactory/MarketView";
import {
  Condition,
  Market,
  MarketQuestion,
  MarketsCount,
  Position,
  Question,
} from "../generated/schema";
import { DEFAULT_FINALIZE_TS } from "./reality";
import { ConditionalTokens } from "../generated/ConditionalTokens/ConditionalTokens";

const MARKET_VIEW_ADDRESS = "0x995dC9c89B6605a1E8cc028B37cb8e568e27626f";

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

class MarketDataQuestion {
  public opening_ts: BigInt;
  public arbitrator: Address;
  public timeout: BigInt;
  public finalize_ts: BigInt;
  public is_pending_arbitration: boolean;
  public best_answer: Bytes;
  public bond: BigInt;
  public min_bond: BigInt;
}

class MarketData {
  public id: string;
  public marketName: string;
  public outcomes: string[];
  public lowerBound: BigInt;
  public upperBound: BigInt;
  public parentCollectionId: Bytes;
  public parentOutcome: BigInt;
  public parentMarket: Address;
  public conditionId: Bytes;
  public questionId: Bytes;
  public questionsIds: Bytes[];
  public templateId: BigInt;
  public encodedQuestions: string[];
  public questions: MarketDataQuestion[];
}

export function handleNewMarket(event: NewMarketEvent): void {
  const marketFactory = MarketFactory.bind(event.address);
  const marketView = MarketView.bind(Address.fromString(MARKET_VIEW_ADDRESS));

  const data = marketView.getMarket(
    event.address,
    Address.fromString(event.params.market.toHexString())
  );

  processMarket(
    event,
    {
      id: event.params.market.toHexString(),
      marketName: data.marketName,
      outcomes: data.outcomes,
      lowerBound: data.lowerBound,
      upperBound: data.upperBound,
      parentCollectionId: data.parentCollectionId,
      parentOutcome: data.parentOutcome,
      parentMarket: data.parentMarket,
      conditionId: data.conditionId,
      questionId: data.questionId,
      questionsIds: data.questionsIds,
      templateId: data.templateId,
      encodedQuestions: data.encodedQuestions,
      questions: data.questions.map<MarketDataQuestion>((q) => ({
        opening_ts: q.opening_ts,
        arbitrator: q.arbitrator,
        timeout: q.timeout,
        finalize_ts: q.finalize_ts,
        is_pending_arbitration: q.is_pending_arbitration,
        best_answer: q.best_answer,
        bond: q.bond,
        min_bond: q.min_bond,
      })),
    },
    marketFactory.conditionalTokens(),
    marketFactory.collateralToken()
  );
}

function processMarket(
  event: ethereum.Event,
  data: MarketData,
  conditionalTokensAddress: Address,
  collateralToken: Address
): void {
  const market = new Market(data.id);

  market.factory = event.address;
  market.creator = event.transaction.from;
  market.marketName = data.marketName;
  market.outcomes = data.outcomes;
  market.outcomesSupply = BigInt.fromI32(0);
  market.lowerBound = data.lowerBound;
  market.upperBound = data.upperBound;
  market.parentCollectionId = data.parentCollectionId;
  market.parentOutcome = data.parentOutcome;
  market.parentMarket = data.parentMarket;
  market.conditionId = data.conditionId;
  market.questionId = data.questionId;
  market.questionsIds = data.questionsIds;
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
    question.is_pending_arbitration = questionResult.is_pending_arbitration;
    question.best_answer = questionResult.best_answer;
    question.bond = questionResult.bond;
    question.min_bond = questionResult.min_bond;
    question.arbitration_occurred = false;
    question.save();

    const marketQuestion = new MarketQuestion(
      market.id
        .concat(market.questionsIds[i].toHexString())
        .concat(i.toString())
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

  const conditionalTokens = ConditionalTokens.bind(conditionalTokensAddress);
  // we only need to track the first position
  const collectionId = conditionalTokens.getCollectionId(
    data.parentCollectionId,
    data.conditionId,
    BigInt.fromI32(1 << 0)
  );
  const position = new Position(
    conditionalTokens.getPositionId(collateralToken, collectionId).toHexString()
  );
  position.market = market.id;
  position.save();
}

import {
  Address,
  BigInt,
  Bytes,
  dataSource,
  ethereum,
} from "@graphprotocol/graph-ts";
import {
  NewMarket as NewMarketEvent,
} from "../generated/MarketFactory/MarketFactory";
import { MarketView } from "../generated/MarketFactory/MarketView";
import {
  Condition,
  Market,
  MarketQuestion,
  MarketsCount,
  Question,
} from "../generated/schema";
import { DEFAULT_FINALIZE_TS } from "./reality";

const MARKET_VIEW_ADDRESS =
  dataSource.network() == "mainnet"
    ? "0xAb797C4C6022A401c31543E316D3cd04c67a87fC"
    : "0x995dC9c89B6605a1E8cc028B37cb8e568e27626f";

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
  public wrappedTokens: Address[];
  public conditionId: Bytes;
  public questionId: Bytes;
  public questionsIds: Bytes[];
  public templateId: BigInt;
  public encodedQuestions: string[];
  public questions: MarketDataQuestion[];
}

export function handleNewMarket(event: NewMarketEvent): void {
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
      wrappedTokens: data.wrappedTokens,
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
    }
  );
}

function processMarket(
  event: ethereum.Event,
  data: MarketData
): void {
  const market = new Market(data.id);

  const condition = new Condition(data.conditionId.toHexString());
  condition.save();

  market.factory = event.address;
  market.creator = event.transaction.from;
  market.marketName = data.marketName;
  market.outcomes = data.outcomes;
  market.outcomesSupply = BigInt.fromI32(0);
  market.lowerBound = data.lowerBound;
  market.upperBound = data.upperBound;
  market.parentCollectionId = data.parentCollectionId;
  market.parentOutcome = data.parentOutcome;
  market.wrappedTokens = changetype<Bytes[]>(data.wrappedTokens);
  market.parentMarket = data.parentMarket;
  market.conditionId = data.conditionId;
  market.ctfCondition = condition.id;
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
}

import {
  Address,
  BigInt,
  Bytes,
  dataSource,
  ethereum,
} from "@graphprotocol/graph-ts";
import {
  MarketFactory,
  NewMarket as NewMarketEvent,
} from "../generated/MarketFactory/MarketFactory";
import {
  FutarchyFactory,
  NewProposal as NewProposalEvent,
} from "../generated/FutarchyFactory/FutarchyFactory";
import { FutarchyProposal } from "../generated/FutarchyFactory/FutarchyProposal";
import { Reality } from "../generated/FutarchyFactory/Reality";
import { MarketView } from "../generated/MarketFactory/MarketView";
import {
  Condition,
  Market,
  MarketQuestion,
  MarketsCount,
  Question,
} from "../generated/schema";
import { DEFAULT_FINALIZE_TS } from "./reality";

function getMarketViewAddress(network: string): string {
  if (network == "sepolia") {
    return "0x03d03464BF9Eb20059Ca6eF6391E9C5d79d5E012";
  }

  if (network == "mainnet") {
    return "0xAb797C4C6022A401c31543E316D3cd04c67a87fC";
  }

  if (network == "optimism") {
    return "0x1F728c2fD6a3008935c1446a965a313E657b7904";
  }

  if (network == "base") {
    return "0x1F728c2fD6a3008935c1446a965a313E657b7904";
  }

  return "0x995dC9c89B6605a1E8cc028B37cb8e568e27626f";
}

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

export class MarketDataQuestion {
  public opening_ts!: BigInt;
  public arbitrator!: Address;
  public timeout!: BigInt;
  public finalize_ts!: BigInt;
  public is_pending_arbitration: boolean;
  public best_answer!: Bytes;
  public bond!: BigInt;
  public min_bond!: BigInt;
}

class MarketData {
  public id: string;
  public type: string;
  public marketName: string;
  public outcomes: string[];
  public lowerBound: BigInt;
  public upperBound: BigInt;
  public parentCollectionId: Bytes;
  public parentOutcome: BigInt;
  public parentMarket: Address;
  public collateralToken1: Address;
  public collateralToken2: Address;
  public wrappedTokens: Address[];
  public conditionId: Bytes;
  public questionId: Bytes;
  public questionsIds: Bytes[];
  public templateId: BigInt;
  public encodedQuestions: string[];
  public questions: MarketDataQuestion[];
}

export function handleNewMarket(event: NewMarketEvent): void {
  const marketView = MarketView.bind(
    Address.fromString(getMarketViewAddress(dataSource.network()))
  );

  const data = marketView.getMarket(
    event.address,
    Address.fromString(event.params.market.toHexString())
  );

  processMarket(
    event,
    {
      id: event.params.market.toHexString(),
      type: "Generic",
      marketName: data.marketName,
      outcomes: data.outcomes,
      lowerBound: data.lowerBound,
      upperBound: data.upperBound,
      collateralToken1: Address.zero(),
      collateralToken2: Address.zero(),
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
    },
    MarketFactory.bind(event.address).collateralToken()
  );
}

export function handleNewProposal(event: NewProposalEvent): void {
  const proposal = FutarchyProposal.bind(event.params.proposal);
  const futarchyFactory = FutarchyFactory.bind(event.address);
  const reality = Reality.bind(futarchyFactory.realitio());

  const wrappedTokens: Address[] = [];
  const outcomes: string[] = [];
  for (let i = 0; i < 4; i++) {
    const outcome = proposal.outcomes(BigInt.fromI32(i));
    outcomes.push(outcome);
    const result = proposal.wrappedOutcome(BigInt.fromI32(i));
    wrappedTokens.push(result.getWrapped1155());
  }

  const question = reality.questions(event.params.questionId);

  processMarket(
    event,
    {
      id: event.params.proposal.toHexString(),
      type: "Futarchy",
      marketName: event.params.marketName,
      outcomes: outcomes,
      lowerBound: BigInt.fromI32(0),
      upperBound: BigInt.fromI32(0),
      collateralToken1: proposal.collateralToken1(),
      collateralToken2: proposal.collateralToken2(),
      parentCollectionId: proposal.parentCollectionId(),
      parentOutcome: proposal.parentOutcome(),
      parentMarket: proposal.parentMarket(),
      wrappedTokens: wrappedTokens,
      conditionId: event.params.conditionId,
      questionId: event.params.questionId,
      questionsIds: [event.params.questionId],
      templateId: BigInt.fromI32(2),
      encodedQuestions: [proposal.encodedQuestion()],
      questions: [
        {
          opening_ts: question.getOpening_ts(),
          arbitrator: question.getArbitrator(),
          timeout: question.getTimeout(),
          finalize_ts: question.getFinalize_ts(),
          is_pending_arbitration: question.getIs_pending_arbitration(),
          best_answer: question.getBest_answer(),
          bond: question.getBond(),
          min_bond: question.getMin_bond(),
        },
      ],
    },
    Address.zero()
  );
}

function getCollateralToken(
  parentMarket: Address,
  parentOutcome: BigInt,
  collateralToken: Address
): Bytes {
  if (parentMarket.equals(Address.zero())) {
    return collateralToken;
  }

  const market = Market.load(parentMarket.toHexString());

  if (!market) {
    return collateralToken;
  }

  return market.wrappedTokens[parentOutcome.toI32()];
}

export function processMarket(
  event: ethereum.Event,
  data: MarketData,
  collateralToken: Address
): void {
  const market = new Market(data.id);

  const condition = new Condition(data.conditionId.toHexString());
  condition.save();

  market.factory = event.address;
  market.type = data.type;
  market.creator = event.transaction.from;
  market.marketName = data.marketName;
  market.outcomes = data.outcomes;
  market.outcomesSupply = BigInt.fromI32(0);
  market.lowerBound = data.lowerBound;
  market.upperBound = data.upperBound;
  market.parentCollectionId = data.parentCollectionId;
  market.parentOutcome = data.parentOutcome;
  market.wrappedTokens = changetype<Bytes[]>(data.wrappedTokens);
  market.parentMarket = data.parentMarket.toHexString();
  market.collateralToken = getCollateralToken(
    data.parentMarket,
    data.parentOutcome,
    collateralToken
  );
  market.collateralToken1 = data.collateralToken1;
  market.collateralToken2 = data.collateralToken2;
  market.conditionId = data.conditionId;
  market.ctfCondition = condition.id;
  market.questionId = data.questionId;
  market.templateId = data.templateId;
  market.encodedQuestions = data.encodedQuestions;
  market.payoutReported = false;
  market.payoutNumerators = data.outcomes.map<BigInt>(() => BigInt.fromI32(0));
  market.openingTs = BigInt.fromI32(0);
  market.finalizeTs = DEFAULT_FINALIZE_TS;
  market.questionsInArbitration = BigInt.fromI32(0);
  market.hasAnswers = false;
  market.index = getNextMarketIndex();

  for (let i = 0; i < data.questionsIds.length; i++) {
    const questionResult = data.questions[i];

    if (i === 0) {
      // all the questions have the same opening_ts
      market.openingTs = questionResult.opening_ts;
    }

    const question = new Question(data.questionsIds[i].toHexString());
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
      market.id.concat(data.questionsIds[i].toHexString()).concat(i.toString())
    );
    marketQuestion.market = market.id;
    marketQuestion.baseQuestion = question.id;
    marketQuestion.question = question.id;
    marketQuestion.index = i;
    marketQuestion.save();
  }

  market.blockNumber = event.block.number;
  market.blockTimestamp = event.block.timestamp;
  market.transactionHash = event.transaction.hash;

  market.save();
}

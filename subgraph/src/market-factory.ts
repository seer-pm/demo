import { BigInt } from "@graphprotocol/graph-ts"
import { MarketFactory, NewMarket as NewMarketEvent } from "../generated/MarketFactory/MarketFactory"
import { Reality } from "../generated/Reality/Reality"
import { Market, Question } from "../generated/schema"

export function handleNewMarket(event: NewMarketEvent): void {
  let marketFactory = MarketFactory.bind(event.address)
  let market = new Market(
    event.params.market
  )
  market.marketName = event.params.marketName
  market.outcomes = event.params.outcomes
  market.lowerBound = event.params.lowerBound
  market.upperBound = event.params.upperBound
  market.conditionId = event.params.conditionId
  market.questionId = event.params.questionId
  market.questionsIds = event.params.questionsIds
  market.questions = []
  market.templateId = event.params.templateId
  market.encodedQuestions = event.params.encodedQuestions
  market.payoutReported = false
  market.openingTs = BigInt.fromI32(0)
  market.finalizeTs = BigInt.fromI32(0)
  market.questionsInArbitration = BigInt.fromI32(0)
  market.hasAnswers = false

  const reality = Reality.bind(marketFactory.realitio())

  const questions = market.questions;

  for (let i = 0; i < market.questionsIds.length; i++) {
    let questionResult = reality.questions(market.questionsIds[i])

    if (i === 0) {
      // all the questions have the same opening_ts
      market.openingTs = questionResult.getOpening_ts()
    }

    let question = new Question(market.questionsIds[i].toHexString())
    question.arbitrator = questionResult.getArbitrator()
    question.opening_ts = questionResult.getOpening_ts()
    question.timeout = questionResult.getTimeout()
    question.finalize_ts = questionResult.getFinalize_ts()
    question.is_pending_arbitration = questionResult.getIs_pending_arbitration()
    question.best_answer = questionResult.getBest_answer()
    question.bond = questionResult.getBond()
    question.min_bond = questionResult.getMin_bond()
    question.arbitration_occurred = false
    question.save()

    questions.push(question.id)
  }

  market.questions = questions

  market.blockNumber = event.block.number
  market.blockTimestamp = event.block.timestamp
  market.transactionHash = event.transaction.hash

  market.save()
}

import { newMockEvent } from "matchstick-as"
import { ethereum, Address, Bytes } from "@graphprotocol/graph-ts"
import { NewMarket } from "../generated/MarketFactory/MarketFactory"
import { LogReopenQuestion } from "../generated/Reality/Reality"

export function createNewMarketEvent(
  market: Address,
  marketName: string,
  parentMarket: Bytes,
  conditionId: Bytes,
  questionId: Bytes,
  questionsIds: Array<Bytes>,
): NewMarket {
  let newMarketEvent = changetype<NewMarket>(newMockEvent())

  newMarketEvent.parameters = new Array()

  newMarketEvent.parameters.push(
    new ethereum.EventParam("market", ethereum.Value.fromAddress(market))
  )
  newMarketEvent.parameters.push(
    new ethereum.EventParam("marketName", ethereum.Value.fromString(marketName))
  )
  newMarketEvent.parameters.push(
    new ethereum.EventParam(
      "parentMarket",
      ethereum.Value.fromFixedBytes(parentMarket)
    )
  )
  newMarketEvent.parameters.push(
    new ethereum.EventParam(
      "conditionId",
      ethereum.Value.fromFixedBytes(conditionId)
    )
  )
  newMarketEvent.parameters.push(
    new ethereum.EventParam(
      "questionId",
      ethereum.Value.fromFixedBytes(questionId)
    )
  )
  newMarketEvent.parameters.push(
    new ethereum.EventParam(
      "questionsIds",
      ethereum.Value.fromFixedBytesArray(questionsIds)
    )
  )

  return newMarketEvent
}

export function createNewReopenQuestionEvent(
  question_id: Bytes,
  reopened_question_id: Bytes
): LogReopenQuestion {
  let logReopenQuestion = changetype<LogReopenQuestion>(newMockEvent())

  logReopenQuestion.parameters = new Array()

  logReopenQuestion.parameters.push(
    new ethereum.EventParam("question_id", ethereum.Value.fromBytes(question_id))
  )
  logReopenQuestion.parameters.push(
    new ethereum.EventParam("reopened_question_id", ethereum.Value.fromBytes(reopened_question_id))
  )

  return logReopenQuestion
}
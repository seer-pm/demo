import { BigInt } from "@graphprotocol/graph-ts";
import {
  LogCancelArbitration,
  LogFinalize,
  LogNewAnswer,
  LogNotifyOfArbitrationRequest,
  LogReopenQuestion,
} from "../generated/Reality/Reality";
import { Question, Market } from "../generated/schema";

export const DEFAULT_FINALIZE_TS = BigInt.fromI64(33260976000);

function getFinalizeTs(market: Market): BigInt {
  const questions = market.questions.load();
  let finalizeTs = BigInt.fromI32(0)

  for (let j = 0; j < questions.length; j++) {
    const question = Question.load(questions[j].question)!;
    if (question.finalize_ts.equals(BigInt.fromI32(0))) {
      return DEFAULT_FINALIZE_TS;
    }
    if (question.finalize_ts.gt(finalizeTs)) {
      finalizeTs = question.finalize_ts;
    }
  }

  return finalizeTs;
}

export function handleNewAnswer(evt: LogNewAnswer): void {
  let question = Question.load(evt.params.question_id.toHexString());
  if (question === null) {
    return;
  }

  question.finalize_ts = question.arbitration_occurred
    ? evt.params.ts
    : evt.params.ts.plus(question.timeout);
  question.best_answer = evt.params.answer;
  question.bond = evt.params.bond;
  question.save();

  const markets = question.markets.load();
  for (let i = 0; i < markets.length; i++) {
    const market = Market.load(markets[i].market)!;

    market.hasAnswers = true;
    market.finalizeTs = getFinalizeTs(market)
    market.save();
  }
}

export function handleArbitrationRequest(
  evt: LogNotifyOfArbitrationRequest
): void {
  const question = Question.load(evt.params.question_id.toHexString());
  if (question === null) {
    return;
  }

  question.is_pending_arbitration = true;
  question.save();

  const markets = question.markets.load();
  for (let i = 0; i < markets.length; i++) {
    const market = Market.load(markets[i].market)!;
    market.questionsInArbitration = market.questionsInArbitration.plus(
      BigInt.fromI32(1)
    );
    market.save();
  }
}

export function handleCancelArbitration(evt: LogCancelArbitration): void {
  const question = Question.load(evt.params.question_id.toHexString());
  if (question === null) {
    return;
  }

  question.is_pending_arbitration = false;
  question.save();

  const markets = question.markets.load();
  for (let i = 0; i < markets.length; i++) {
    const market = Market.load(markets[i].market)!;
    market.questionsInArbitration = market.questionsInArbitration.minus(
      BigInt.fromI32(1)
    );
    market.save();
  }
}

export function handleFinalize(evt: LogFinalize): void {
  const question = Question.load(evt.params.question_id.toHexString());
  if (question === null) {
    return;
  }

  question.best_answer = evt.params.answer;
  question.is_pending_arbitration = false;
  question.arbitration_occurred = true;
  question.save();

  const markets = question.markets.load();
  for (let i = 0; i < markets.length; i++) {
    const market = Market.load(markets[i].market)!;
    market.questionsInArbitration = market.questionsInArbitration.minus(
      BigInt.fromI32(1)
    );
    market.save();
  }
}

export function handleReopenQuestion(event: LogReopenQuestion): void {
  // TODO
}

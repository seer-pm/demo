import { BigInt, store, Bytes, log } from "@graphprotocol/graph-ts";
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
  let finalizeTs = BigInt.fromI32(0);

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

  const marketsQuestions = question.marketQuestions.load();
  for (let i = 0; i < marketsQuestions.length; i++) {
    const market = Market.load(marketsQuestions[i].market)!;

    market.hasAnswers = true;
    market.finalizeTs = getFinalizeTs(market);
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

  const marketsQuestions = question.marketQuestions.load();
  for (let i = 0; i < marketsQuestions.length; i++) {
    const market = Market.load(marketsQuestions[i].market)!;
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

  const marketsQuestions = question.marketQuestions.load();
  for (let i = 0; i < marketsQuestions.length; i++) {
    const market = Market.load(marketsQuestions[i].market)!;
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

  const marketsQuestions = question.marketQuestions.load();
  for (let i = 0; i < marketsQuestions.length; i++) {
    const market = Market.load(marketsQuestions[i].market)!;
    market.questionsInArbitration = market.questionsInArbitration.minus(
      BigInt.fromI32(1)
    );
    market.save();
  }
}

export function processReopenedQuestion(
  oldQuestion: Question,
  newQuestionId: string
): Question {
  let newQuestion = new Question(newQuestionId);
  newQuestion.index = oldQuestion.index;
  newQuestion.arbitrator = oldQuestion.arbitrator;
  newQuestion.opening_ts = oldQuestion.opening_ts;
  newQuestion.timeout = oldQuestion.timeout;
  newQuestion.finalize_ts = BigInt.zero();
  newQuestion.is_pending_arbitration = false;
  newQuestion.best_answer = Bytes.empty();
  newQuestion.bond = BigInt.zero();
  newQuestion.min_bond = oldQuestion.min_bond;
  newQuestion.arbitration_occurred = false;

  // save new question
  newQuestion.save();

  const marketQuestions = oldQuestion.marketQuestions.load();
  for (let i = 0; i < marketQuestions.length; i++) {
    // replace with new question
    marketQuestions[i].question = newQuestion.id;
    marketQuestions[i].save();

    const market = Market.load(marketQuestions[i].market)!;
    market.finalizeTs = getFinalizeTs(market);
    market.save();
  }

  // remove old question
  store.remove("Question", oldQuestion.id);

  return newQuestion;
}

export function handleReopenQuestion(event: LogReopenQuestion): void {
  let oldQuestion = Question.load(
    event.params.reopened_question_id.toHexString()
  );
  if (oldQuestion === null) {
    return;
  }

  processReopenedQuestion(oldQuestion, event.params.question_id.toHexString());

  // TODO: recalculate market.hasAnswers
}

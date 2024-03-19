
import { BigInt } from '@graphprotocol/graph-ts';
import { LogCancelArbitration, LogFinalize, LogNewAnswer, LogNotifyOfArbitrationRequest, LogReopenQuestion } from "../generated/Reality/Reality";
import { Question } from "../generated/schema";

export function handleNewAnswer(evt: LogNewAnswer): void {
    let question = Question.load(evt.params.question_id.toHexString());
    if (question === null) {
        return
    }

    question.finalize_ts = question.arbitration_occurred ? evt.params.ts : evt.params.ts.plus(question.timeout);
    question.best_answer = evt.params.answer
    question.bond = evt.params.bond;
    question.save();

    const markets = question.markets.load()
    for (let i = 0; i < markets.length; i++) {
        markets[i].hasAnswers = true
        if (question.finalize_ts.gt(markets[i].finalizeTs)) {
            markets[i].finalizeTs = question.finalize_ts
        }
        markets[i].save()
    }
}

export function handleArbitrationRequest(evt: LogNotifyOfArbitrationRequest): void {
    const question = Question.load(evt.params.question_id.toHexString());
    if (question === null) {
        return
    }

    question.is_pending_arbitration = true;
    question.save();

    const markets = question.markets.load()
    for (let i = 0; i < markets.length; i++) {
        markets[i].questionsInArbitration = markets[i].questionsInArbitration.plus(BigInt.fromI32(1));
        markets[i].save()
    }
}

export function handleCancelArbitration(evt: LogCancelArbitration): void {
    const question = Question.load(evt.params.question_id.toHexString());
    if (question === null) {
        return
    }

    question.is_pending_arbitration = false;
    question.save();

    const markets = question.markets.load()
    for (let i = 0; i < markets.length; i++) {
        markets[i].questionsInArbitration = markets[i].questionsInArbitration.minus(BigInt.fromI32(1));
        markets[i].save()
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

    const markets = question.markets.load()
    for (let i = 0; i < markets.length; i++) {
        markets[i].questionsInArbitration = markets[i].questionsInArbitration.minus(BigInt.fromI32(1));
        markets[i].save()
    }
}

export function handleReopenQuestion(event: LogReopenQuestion): void {
    // TODO
}
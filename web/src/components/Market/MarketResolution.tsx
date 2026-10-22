import Button from "@/components/Form/Button";
import { useArbitrationRequest } from "@/hooks/useArbitrationRequest";
import { useModal } from "@/hooks/useModal";
import { useReopenQuestion } from "@/hooks/useReopenQuestion";
import { useResolveMarket } from "@/hooks/useResolveMarket";
import { mainnet } from "@/lib/chains";
import { formatDate, getTimeLeft } from "@/lib/date";
import { paths } from "@/lib/paths";
import type { SupportedChain } from "@seer-pm/sdk";
import {
  ANSWERED_TOO_SOON,
  Market,
  MarketStatus,
  Question,
  decodeQuestion,
  getAnswerTextFromMarket,
  getQuestionStatus,
  getRealityLink,
  isFinalized,
} from "@seer-pm/sdk";
import clsx from "clsx";
import { useState } from "react";
import { AnswerForm } from "./AnswerForm";
import { OutcomeImage } from "./OutcomeImage";
import { RaiseDisputeForm } from "./RaiseDisputeForm";

type Tone = "muted" | "open" | "reported" | "dispute" | "final";

/** The Modal renders its title as HTML, so an outcome name has to be escaped before it goes in. */
function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M6 3.5h6.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 3.5 4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function StatusChip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={clsx("event-resolution-chip", `is-${tone}`)}>{children}</span>;
}

function KlerosCaseLink({ questionId, chainId }: { questionId: `0x${string}`; chainId: SupportedChain }) {
  const { data: arbitrationRequest } = useArbitrationRequest(questionId, chainId);
  const disputeId = arbitrationRequest?.disputeId || 0n;

  if (!disputeId) {
    return null;
  }

  return (
    <a
      className="event-resolution-textlink"
      href={paths.klerosDispute(disputeId, mainnet.id)}
      target="_blank"
      rel="noreferrer"
    >
      View case on Kleros Court
      <ExternalIcon />
    </a>
  );
}

function describeQuestion(question: Question, marketStatus: MarketStatus): { tone: Tone; label: string } {
  const status = getQuestionStatus(question);

  if (status === MarketStatus.NOT_OPEN) {
    return { tone: "muted", label: "Not open yet" };
  }
  if (status === MarketStatus.OPEN) {
    return { tone: "open", label: "Open for answers" };
  }
  if (status === MarketStatus.IN_DISPUTE) {
    return { tone: "dispute", label: "In dispute" };
  }
  if (status === MarketStatus.ANSWER_NOT_FINAL && !isFinalized(question)) {
    return { tone: "reported", label: "Answer reported" };
  }
  if (marketStatus === MarketStatus.PENDING_EXECUTION && question.best_answer === ANSWERED_TOO_SOON) {
    return { tone: "muted", label: "Answered too soon" };
  }
  return { tone: "final", label: "Final" };
}

function ResolutionRow({
  market,
  marketStatus,
  question,
  index,
  showOutcome,
  onAnswer,
  onReopen,
}: {
  market: Market;
  marketStatus: MarketStatus;
  question: Question;
  index: number;
  showOutcome: boolean;
  onAnswer: (question: Question) => void;
  onReopen: (index: number) => void;
}) {
  const status = getQuestionStatus(question);
  const { tone, label } = describeQuestion(question, marketStatus);
  const outcome = market.outcomes[index];
  const hasAnswer = question.finalize_ts > 0;
  const canCorrect = status === MarketStatus.ANSWER_NOT_FINAL && !isFinalized(question);
  const correctionWindow = canCorrect ? getTimeLeft(question.finalize_ts) : false;
  const needsReopen = marketStatus === MarketStatus.PENDING_EXECUTION && question.best_answer === ANSWERED_TOO_SOON;
  const forOutcome = showOutcome ? ` for ${outcome}` : "";
  const realityName = showOutcome ? `Open the ${outcome} question on Reality.eth` : "Open the question on Reality.eth";

  return (
    <li className={clsx("event-resolution-row", showOutcome && "has-outcome")}>
      {showOutcome && (
        <span className="event-resolution-avatar">
          <OutcomeImage
            image={market.images?.outcomes?.[index]}
            isInvalidOutcome={false}
            title={outcome}
            className="w-[28px] h-[28px] rounded-full dark:bg-neutral"
          />
        </span>
      )}
      <div className="event-resolution-main">
        <div className="event-resolution-label">
          {showOutcome && <strong>{outcome}</strong>}
          <StatusChip tone={tone}>{label}</StatusChip>
        </div>
        {hasAnswer && !needsReopen && (
          <p className="event-resolution-answer">
            <span>{getAnswerTextFromMarket(question, market)}</span>
            {correctionWindow && <small>Can be corrected for {correctionWindow}</small>}
          </p>
        )}
        {status === MarketStatus.IN_DISPUTE && <KlerosCaseLink questionId={question.id} chainId={market.chainId} />}
      </div>
      <div className="event-resolution-actions">
        {status === MarketStatus.OPEN && (
          <Button
            size="small"
            variant="secondary"
            text="Report answer"
            aria-label={`Report answer${forOutcome}`}
            onClick={() => onAnswer(question)}
          />
        )}
        {canCorrect && (
          <Button
            size="small"
            variant="secondary"
            text="Correct answer"
            aria-label={`Correct answer${forOutcome}`}
            onClick={() => onAnswer(question)}
          />
        )}
        {needsReopen && (
          <Button
            size="small"
            variant="secondary"
            text="Reopen question"
            aria-label={showOutcome ? `Reopen the ${outcome} question` : "Reopen question"}
            onClick={() => onReopen(index)}
          />
        )}
        <a
          className="event-resolution-external"
          href={getRealityLink(market.chainId, question.id)}
          target="_blank"
          rel="noreferrer"
          aria-label={realityName}
          title="Open on Reality.eth"
        >
          <ExternalIcon />
        </a>
      </div>
    </li>
  );
}

function openedOn(market: Market) {
  if (!market.blockTimestamp) {
    return null;
  }
  return new Date(market.blockTimestamp * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function MarketResolution({ market, marketStatus }: { market: Market; marketStatus: MarketStatus }) {
  const { Modal: AnswerModal, openModal: openAnswerModal, closeModal: closeAnswerModal } = useModal("answer-modal");
  const {
    Modal: RaiseDisputeModal,
    openModal: openRaiseDisputeModal,
    closeModal: closeRaiseDisputeModal,
  } = useModal("raise-dispute-modal");
  const [modalQuestion, setModalQuestion] = useState<Question | undefined>();
  const resolveMarket = useResolveMarket();
  const reopenQuestion = useReopenQuestion();

  const questions = market.questions;
  const showOutcome = questions.length > 1;
  const tooSoon = (question: Question) =>
    marketStatus === MarketStatus.PENDING_EXECUTION && question.best_answer === ANSWERED_TOO_SOON;
  const finalCount = questions.filter(
    (question) => (getQuestionStatus(question) === MarketStatus.CLOSED || isFinalized(question)) && !tooSoon(question),
  ).length;
  const reopenCount = questions.filter(tooSoon).length;
  const canResolve = marketStatus === MarketStatus.PENDING_EXECUTION && reopenCount === 0;
  const opened = openedOn(market);

  const answer = (question: Question) => {
    setModalQuestion(question);
    openAnswerModal();
  };

  const reopen = (index: number) => {
    reopenQuestion.mutateAsync({
      question: questions[index],
      templateId: market.templateId,
      encodedQuestion: market.encodedQuestions[index],
      chainId: market.chainId,
    });
  };

  return (
    <div className="event-resolution">
      <header className="event-resolution-head">
        <img src="/assets/reality-icon.jpg" alt="" />
        <div className="event-resolution-title">
          <strong>Settled by Reality.eth</strong>
          <span>
            {opened && <>Market opened {opened}. </>}
            {marketStatus === MarketStatus.NOT_OPEN
              ? `Answers open ${formatDate(questions[0].opening_ts)} UTC. `
              : "The full resolution criteria live on the oracle question. "}
            <a
              className="event-resolution-textlink"
              href={getRealityLink(market.chainId, questions[0].id)}
              target="_blank"
              rel="noreferrer"
            >
              Open on Reality.eth
              <ExternalIcon />
            </a>
          </span>
        </div>
        {showOutcome && (
          <span className="event-resolution-count">
            {finalCount} of {questions.length} final
          </span>
        )}
      </header>
      <ul className="event-resolution-rows">
        {questions.map((question, index) => (
          <ResolutionRow
            key={question.id}
            market={market}
            marketStatus={marketStatus}
            question={question}
            index={index}
            showOutcome={showOutcome}
            onAnswer={answer}
            onReopen={reopen}
          />
        ))}
      </ul>
      {reopenCount > 0 && (
        <footer className="event-resolution-foot">
          <span>
            {reopenCount === 1
              ? "This question was answered before the event settled. Reopen it to accept a new answer."
              : `${reopenCount === questions.length ? "These" : `${reopenCount} of these`} questions were answered before the event settled. Reopen them to accept new answers.`}
          </span>
        </footer>
      )}
      {canResolve && (
        <footer className="event-resolution-foot">
          <span>Every answer is final. Anyone can settle the market on chain.</span>
          <Button
            size="small"
            text="Resolve market"
            isLoading={resolveMarket.isPending}
            onClick={() => resolveMarket.mutateAsync({ market })}
          />
        </footer>
      )}
      {modalQuestion && (
        <RaiseDisputeModal
          title="Raise a Dispute"
          content={
            <RaiseDisputeForm question={modalQuestion} closeModal={closeRaiseDisputeModal} chainId={market.chainId} />
          }
        />
      )}
      {modalQuestion && (
        <AnswerModal
          title={
            showOutcome
              ? `Report answer: ${escapeHtml(market.outcomes[questions.indexOf(modalQuestion)])}`
              : "Report answer"
          }
          content={
            <>
              <p className="event-answer-question">
                <small>{showOutcome ? market.outcomes[questions.indexOf(modalQuestion)] : "Question"}</small>
                {decodeQuestion(market.encodedQuestions[questions.indexOf(modalQuestion)]).question}
              </p>
              <AnswerForm
                market={market}
                marketStatus={marketStatus}
                question={modalQuestion}
                closeModal={closeAnswerModal}
                raiseDispute={() => {
                  closeAnswerModal();
                  openRaiseDisputeModal();
                }}
              />
            </>
          }
        />
      )}
    </div>
  );
}

import { useArbitrationRequest } from "@/hooks/useArbitrationRequest";
import { Market, Question } from "@/hooks/useMarket";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { useReopenQuestion } from "@/hooks/useReopenQuestion";
import { useResolveMarket } from "@/hooks/useResolveMarket";
import { SupportedChain, mainnet } from "@/lib/chains";
import { CheckCircleIcon, HourGlassIcon, RightArrow } from "@/lib/icons";
import { MarketTypes } from "@/lib/market";
import { paths } from "@/lib/paths";
import { ANSWERED_TOO_SOON, getAnswerText, getQuestionStatus, getRealityLink, isFinalized } from "@/lib/reality";
import { getTimeLeft } from "@/lib/utils";
import clsx from "clsx";
import { COLORS } from "./index.tsx";

function AnswerColumn({
  marketStatus,
  marketType,
  question,
  questionStatus,
  questionIndex,
  market,
  isPreview,
}: {
  marketStatus: MarketStatus;
  marketType: MarketTypes;
  question: Question;
  questionStatus: MarketStatus;
  questionIndex: number;
  market: Market;
  isPreview: boolean;
}) {
  return (
    <div className={clsx("flex items-center space-x-2", isPreview && "max-w-[50%]")}>
      {(marketStatus === MarketStatus.PENDING_EXECUTION || questionStatus === MarketStatus.IN_DISPUTE) && (
        <HourGlassIcon />
      )}
      {questionStatus === MarketStatus.ANSWER_NOT_FINAL &&
        (isFinalized(question) ? <CheckCircleIcon className="text-success-primary" /> : <HourGlassIcon />)}
      {marketType === MarketTypes.MULTI_SCALAR && (
        <>
          <div>{market.outcomes[questionIndex]}</div>
          <div className="text-black-medium">|</div>
        </>
      )}
      {questionStatus === MarketStatus.CLOSED && marketStatus !== MarketStatus.PENDING_EXECUTION && <CheckCircleIcon />}
      {question.finalize_ts > 0 && (
        <div className="whitespace-nowrap text-ellipsis overflow-hidden">
          Answer: {getAnswerText(question, market.outcomes, market.templateId)}
        </div>
      )}
    </div>
  );
}

function RealityLink({ chainId, questionId }: { chainId: SupportedChain; questionId: `0x${string}` }) {
  return (
    <>
      <a className="text-purple-primary flex items-center" href={getRealityLink(chainId, questionId)} target="_blank" rel="noreferrer">
        Check it on Reality.eth
        <span className="ml-2"> <RightArrow /></span>
      </a>
     
    </>
  );
}

function DisputeLink({ questionId, chainId }: { questionId: `0x${string}`; chainId: SupportedChain }) {
  const { data: arbitrationRequest } = useArbitrationRequest(questionId, chainId);

  const disputeId = arbitrationRequest?.disputeId || 0n;

  if (!disputeId) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <a
        className="text-purple-primary flex items-center"
        href={paths.klerosDispute(disputeId, mainnet.id)}
        target="_blank"
        rel="noreferrer"
      >
        Check the case on Kleros Court
        <span className="ml-2"> <RightArrow /></span>
      </a>
    </div>
  );
}

function ExecuteActions({
  question,
  questionIndex,
  market,
  isMultiScalar,
  isMultiScalarReadyToExecute,
}: {
  question: Question;
  questionIndex: number;
  market: Market;
  isMultiScalar: boolean;
  isMultiScalarReadyToExecute: boolean;
}) {
  const resolveMarket = useResolveMarket();

  const resolveHandler = async () => {
    resolveMarket.mutateAsync({
      marketId: market.id,
    });
  };

  const reopenQuestion = useReopenQuestion();
  const reopenHandler = (questionIndex: number) => {
    return async () => {
      reopenQuestion.mutateAsync({
        question: market.questions[questionIndex],
        templateId: market.templateId,
        encodedQuestion: market.encodedQuestions[questionIndex],
      });
    };
  };

  return (
    <>
      {question.best_answer === ANSWERED_TOO_SOON && (
        <>
          <button className="text-purple-primary" type="button" onClick={reopenHandler(questionIndex)}>
            Reopen question
          </button>
          <RightArrow />
        </>
      )}
      {question.best_answer !== ANSWERED_TOO_SOON &&
        (!isMultiScalar || (isMultiScalarReadyToExecute && questionIndex === 0)) && (
          <>
            <button className="text-purple-primary" type="button" onClick={resolveHandler}>
              {isMultiScalar ? "Report Answers" : "Report Answer"}
            </button>
            <RightArrow />
          </>
        )}
    </>
  );
}

export function QuestionLine({
  question,
  questionIndex,
  openAnswerModal,
  market,
  marketType,
  marketStatus,
  chainId,
  isPreview,
}: {
  question: Question;
  questionIndex: number;
  openAnswerModal: (question: Question) => void;
  market: Market;
  marketType: MarketTypes;
  marketStatus: MarketStatus;
  chainId: SupportedChain;
  isPreview: boolean;
}) {
  const questionStatus = getQuestionStatus(question);

  if (questionStatus === MarketStatus.NOT_OPEN) {
    // this will never happen
    return null;
  }

  if (questionStatus === MarketStatus.OPEN) {
    return (
      <div className={clsx("flex items-center space-x-[12px]", COLORS[questionStatus]?.text)}>
        {marketType === MarketTypes.MULTI_SCALAR && (
          <>
            <div>{market.outcomes[questionIndex]}</div>
            <div className="text-black-medium">|</div>
          </>
        )}
        <button type="button" className="text-purple-primary flex items-center" onClick={() => openAnswerModal(question)}>
          Answer on Reality.eth! 
          <span className="ml-2"> <RightArrow /></span>
        </button>
      </div>
    );
  }

  if (questionStatus === MarketStatus.IN_DISPUTE) {
    return (
      <div className={clsx("flex flex-wrap items-center space-x-[12px]", COLORS[questionStatus]?.text)}>
        <AnswerColumn {...{ marketStatus, marketType, question, questionStatus, questionIndex, market, isPreview }} />

        <div className="text-black-medium">|</div>
        <div className="flex items-center space-x-2">
          <RealityLink chainId={chainId} questionId={question.id} />
        </div>
        <div className="text-black-medium">|</div>
        <DisputeLink questionId={question.id} chainId={chainId} />
      </div>
    );
  }

  if (questionStatus === MarketStatus.ANSWER_NOT_FINAL) {
    const isPreviewWithMultiQuestions = isPreview && market.questions.length > 1;
    const isQuestionFinalized = isFinalized(question);
    return (
      <div
        className={clsx(
          "flex flex-wrap items-center space-x-[12px]",
          isQuestionFinalized ? "text-success-primary" : COLORS[questionStatus]?.text,
          isPreviewWithMultiQuestions && "flex-wrap",
        )}
      >
        <AnswerColumn {...{ marketStatus, marketType, question, questionStatus, questionIndex, market, isPreview }} />

        {!isQuestionFinalized && question.finalize_ts === 0 && (
          <button type="button" className="text-purple-primary" onClick={() => openAnswerModal(question)}>
            Answer on Reality.eth
          </button>
        )}
        {!isQuestionFinalized && question.finalize_ts > 0 && (
          <>
            {!isPreviewWithMultiQuestions && <div className="text-black-medium">|</div>}
            <div className={clsx("text-black-secondary grow", isPreview && "w-full mt-[5px]")}>
              <span>If this is not correct, you can correct it within {getTimeLeft(question.finalize_ts)} on</span>{" "}
              <button
                type="button"
                className="text-purple-primary inline-flex items-center space-x-2"
                onClick={() => openAnswerModal(question)}
              >
                <span>Reality.eth</span>
                <RightArrow />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // questionStatus === MarketStatus.CLOSED
  const isMultiScalarReadyToExecute =
    marketType === MarketTypes.MULTI_SCALAR &&
    marketStatus === MarketStatus.PENDING_EXECUTION &&
    market.questions.every((q) => q.best_answer !== ANSWERED_TOO_SOON);

  return (
    <div
      className={clsx(
        "flex flex-wrap items-center space-x-[12px]",
        COLORS[marketStatus === MarketStatus.PENDING_EXECUTION ? MarketStatus.PENDING_EXECUTION : questionStatus]?.text,
      )}
    >
      <AnswerColumn {...{ marketStatus, marketType, question, questionStatus, questionIndex, market, isPreview }} />
      {marketStatus === MarketStatus.PENDING_EXECUTION && (
        <>
          <div className="text-black-medium">|</div>
          <div className="flex items-center space-x-2">
            <ExecuteActions
              {...{
                question,
                questionIndex,
                market,
                isMultiScalar: marketType === MarketTypes.MULTI_SCALAR,
                isMultiScalarReadyToExecute,
              }}
            />
          </div>
        </>
      )}
      {marketStatus === MarketStatus.CLOSED && (
        <>
          <div className="text-black-medium">|</div>
          <div className="flex items-center space-x-2">
            <RealityLink chainId={chainId} questionId={question.id} />
          </div>
        </>
      )}
    </div>
  );
}

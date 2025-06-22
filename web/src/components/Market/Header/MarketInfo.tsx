import Button from "@/components/Form/Button";
import { useModal } from "@/hooks/useModal";
import { formatDate } from "@/lib/date";
import { CalendarIcon } from "@/lib/icons";
import { getMarketType } from "@/lib/market";
import { MarketStatus } from "@/lib/market.ts";
import { Market, Question } from "@/lib/market.ts";
import { getRealityLink } from "@/lib/reality";
import clsx from "clsx";
import { useState } from "react";
import { AnswerForm } from "../AnswerForm";
import { RaiseDisputeForm } from "../RaiseDisputeForm";
import { QuestionLine } from "./QuestionLine";
import { COLORS } from "./index.ts";

interface MarketInfoProps {
  market: Market;
  marketStatus: MarketStatus;
  isPreview: boolean;
  openAnswerModal: (question: Question) => void;
}

function getOpeningTime(market: Market) {
  return `${formatDate(market.questions[0].opening_ts)} UTC`;
}

function MarketQuestionsStatus({ market, marketStatus, isPreview, openAnswerModal }: MarketInfoProps) {
  const {
    Modal: QuestionsModal,
    openModal: openQuestionsModal,
    closeModal: closeQuestionsModal,
  } = useModal("questions-modal");

  if (marketStatus === MarketStatus.NOT_OPEN) {
    return (
      <div className={clsx("flex items-center space-x-2", COLORS[marketStatus]?.text)}>
        <CalendarIcon />

        {market.questions.length === 1 ? (
          <div>
            <a href={getRealityLink(market.chainId, market.questions[0].id)} target="_blank" rel="noreferrer">
              Resolution opening at {getOpeningTime(market)}
            </a>
          </div>
        ) : (
          <>
            <QuestionsModal
              title="Reality questions"
              content={
                <div>
                  <div className="space-y-[5px]">
                    {market.questions.map((question, i) => (
                      <div key={question.id}>
                        <a
                          href={getRealityLink(market.chainId, question.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {market.outcomes[i]}
                        </a>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-[24px]">
                    <Button type="button" variant="secondary" text="Return" onClick={closeQuestionsModal} />
                  </div>
                </div>
              }
            />
            <button type="button" onClick={openQuestionsModal} className="text-left">
              Resolution opening at {getOpeningTime(market)}
            </button>
          </>
        )}
      </div>
    );
  }

  const marketType = getMarketType(market);

  return (
    <div className="space-y-[16px]">
      {market.questions.map((question, i) => (
        <QuestionLine
          key={question.id}
          {...{ question, questionIndex: i, openAnswerModal, market, marketType, marketStatus, isPreview }}
        />
      ))}
    </div>
  );
}

export function MarketInfo({
  market,
  marketStatus,
  isPreview,
}: {
  market: Market;
  marketStatus?: MarketStatus;
  isPreview: boolean;
}) {
  const { Modal: AnswerModal, openModal: openAnswerModal, closeModal: closeAnswerModal } = useModal("answer-modal");
  const {
    Modal: RaiseDisputeModal,
    openModal: openRaiseDisputeModal,
    closeModal: closeRaiseDisputeModal,
  } = useModal("raise-dispute-modal");
  const [modalQuestion, setModalQuestion] = useState<Question | undefined>();

  const showAnswerModal = (question: Question) => {
    setModalQuestion(question);
    openAnswerModal();
  };

  if (!market || !marketStatus) {
    return null;
  }

  return (
    <div className={clsx(isPreview ? "text-[12px]" : "text-[14px]")}>
      <MarketQuestionsStatus
        market={market}
        marketStatus={marketStatus}
        isPreview={isPreview}
        openAnswerModal={showAnswerModal}
      />
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
          title="Report Answer"
          content={
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
          }
        />
      )}
    </div>
  );
}

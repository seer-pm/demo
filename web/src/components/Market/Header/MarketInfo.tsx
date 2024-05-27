import { useModal } from "@/components/Modal";
import { Market, Question } from "@/hooks/useMarket";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { SupportedChain } from "@/lib/chains";
import { CalendarIcon } from "@/lib/icons";
import { getMarketType, getOpeningTime } from "@/lib/market";
import clsx from "clsx";
import { useState } from "react";
import { AnswerForm } from "../AnswerForm";
import { RaiseDisputeForm } from "../RaiseDisputeForm";
import { COLORS } from "./MarketHeader";
import { QuestionLine } from "./QuestionLine";

interface MarketInfoProps {
  market: Market;
  marketStatus: MarketStatus;
  isPreview: boolean;
  chainId: SupportedChain;
  openAnswerModal: (question: Question) => void;
}

function MarketQuestionsStatus({ market, marketStatus, isPreview, chainId, openAnswerModal }: MarketInfoProps) {
  if (marketStatus === MarketStatus.NOT_OPEN) {
    return (
      <div className={clsx("flex items-center space-x-2", COLORS[marketStatus]?.text)}>
        <CalendarIcon /> <div>Opening at {getOpeningTime(market)}</div>
      </div>
    );
  }

  const marketType = getMarketType(market);

  return (
    <div className="space-y-[16px]">
      {market.questions.map((question, i) => (
        <QuestionLine
          key={question.id}
          {...{ question, questionIndex: i, openAnswerModal, market, marketType, marketStatus, chainId, isPreview }}
        />
      ))}
    </div>
  );
}

export function MarketInfo({
  market,
  marketStatus,
  isPreview,
  chainId,
}: { market: Market; marketStatus?: MarketStatus; isPreview: boolean; chainId: SupportedChain }) {
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
    <div className="text-[14px]">
      <MarketQuestionsStatus
        market={market}
        marketStatus={marketStatus}
        isPreview={isPreview}
        chainId={chainId}
        openAnswerModal={showAnswerModal}
      />
      {modalQuestion && (
        <RaiseDisputeModal
          title="Raise a Dispute"
          content={<RaiseDisputeForm question={modalQuestion} closeModal={closeRaiseDisputeModal} chainId={chainId} />}
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
              chainId={chainId}
            />
          }
        />
      )}
    </div>
  );
}

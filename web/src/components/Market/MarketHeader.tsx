import { Market, Question } from "@/hooks/useMarket";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { MarketStatus, useMarketStatus } from "@/hooks/useMarketStatus";
import { useResolveMarket } from "@/hooks/useResolveMarket";
import { useSDaiToDai } from "@/hooks/useSDaiToDai";
import { SupportedChain } from "@/lib/chains";
import { getRouterAddress } from "@/lib/config";
import {
  CalendarIcon,
  CategoricalIcon,
  CheckCircleIcon,
  DaiLogo,
  EyeIcon,
  HourGlassIcon,
  MultiCategoricalIcon,
  MultiScalarIcon,
  RightArrow,
  ScalarIcon,
} from "@/lib/icons";
import { MarketTypes, getMarketType, getOpeningTime } from "@/lib/market";
import { paths } from "@/lib/paths";
import { getAnswerText, getRealityLink, isFinalized } from "@/lib/reality";
import { displayBalance, getTimeLeft, isUndefined } from "@/lib/utils";
import clsx from "clsx";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useModal } from "../Modal";
import { AnswerForm } from "./AnswerForm";
import { RaiseDisputeForm } from "./RaiseDisputeForm";

interface MarketHeaderProps {
  market: Market;
  images?: { market: string; outcomes: string[] };
  chainId: SupportedChain;
  isPreview?: boolean;
  isVerified?: boolean;
}

export const STATUS_TEXTS: Record<MarketStatus, string> = {
  [MarketStatus.NOT_OPEN]: "Market not open yet",
  [MarketStatus.OPEN]: "Market open",
  [MarketStatus.ANSWER_NOT_FINAL]: "Waiting for answer",
  [MarketStatus.IN_DISPUTE]: "In Dispute",
  [MarketStatus.PENDING_EXECUTION]: "Pending execution",
  [MarketStatus.CLOSED]: "Closed",
};

export const MARKET_TYPES_TEXTS: Record<MarketTypes, string> = {
  [MarketTypes.CATEGORICAL]: "Categorical",
  [MarketTypes.SCALAR]: "Scalar",
  [MarketTypes.MULTI_CATEGORICAL]: "Multi Categorical",
  [MarketTypes.MULTI_SCALAR]: "Multi Scalar",
};

export const MARKET_TYPES_ICONS: Record<MarketTypes, React.ReactNode> = {
  [MarketTypes.CATEGORICAL]: <CategoricalIcon />,
  [MarketTypes.SCALAR]: <ScalarIcon />,
  [MarketTypes.MULTI_CATEGORICAL]: <MultiCategoricalIcon />,
  [MarketTypes.MULTI_SCALAR]: <MultiScalarIcon />,
};

type ColorConfig = { border: string; bg: string; text: string; dot: string };
export const COLORS: Record<MarketStatus, ColorConfig> = {
  [MarketStatus.NOT_OPEN]: {
    border: "border-t-black-secondary",
    bg: "bg-black-light",
    text: "text-black-secondary",
    dot: "bg-black-secondary",
  },
  [MarketStatus.OPEN]: {
    border: "border-t-purple-primary",
    bg: "bg-purple-medium",
    text: "text-purple-primary",
    dot: "bg-purple-primary",
  },
  [MarketStatus.ANSWER_NOT_FINAL]: {
    border: "border-t-warning-primary",
    bg: "bg-warning-light",
    text: "text-warning-primary",
    dot: "bg-warning-primary",
  },
  [MarketStatus.IN_DISPUTE]: {
    border: "border-t-blue-secondary",
    bg: "bg-blue-light",
    text: "text-blue-secondary",
    dot: "bg-blue-secondary",
  },
  [MarketStatus.PENDING_EXECUTION]: {
    border: "border-t-tint-blue-primary",
    bg: "bg-tint-blue-light",
    text: "text-tint-blue-primary",
    dot: "bg-tint-blue-primary",
  },
  [MarketStatus.CLOSED]: {
    border: "border-t-success-primary",
    bg: "bg-success-light",
    text: "text-success-primary",
    dot: "bg-success-primary",
  },
};

interface MarketInfoProps {
  market: Market;
  marketStatus: MarketStatus;
  isPreview: boolean;
  chainId: SupportedChain;
  openAnswerModal: (question: Question) => void;
}

function MarketInfo({ market, marketStatus, isPreview, chainId, openAnswerModal }: MarketInfoProps) {
  const resolveMarket = useResolveMarket();

  const resolveHandler = async () => {
    resolveMarket.mutateAsync({
      marketId: market.id,
    });
  };

  if (marketStatus === MarketStatus.NOT_OPEN) {
    return (
      <div className="flex items-center space-x-2">
        <CalendarIcon /> <div>Opening at {getOpeningTime(market)}</div>
      </div>
    );
  }

  if (marketStatus === MarketStatus.OPEN) {
    return (
      <>
        <div className="flex items-center space-x-2">
          <button type="button" className="text-purple-primary" onClick={() => openAnswerModal(market.questions[0])}>
            Answer on Reality.eth!
          </button>
          <RightArrow />
        </div>
      </>
    );
  }

  if (marketStatus === MarketStatus.ANSWER_NOT_FINAL) {
    const marketType = getMarketType(market);
    const isPreviewWithMultiQuestions = isPreview && market.questions.length > 1;

    return (
      <div className="space-y-[16px]">
        {market.questions.map((question, i) => {
          const marketFinalized = isFinalized(question);
          return (
            <div
              className={clsx(
                "flex items-center space-x-[12px]",
                marketFinalized && "text-success-primary",
                isPreviewWithMultiQuestions && "flex-wrap",
              )}
              key={question.id}
            >
              <div className="flex items-center space-x-2">
                {marketFinalized ? <CheckCircleIcon className="text-success-primary" /> : <HourGlassIcon />}
                {marketType === MarketTypes.MULTI_SCALAR && (
                  <>
                    <div>{market.outcomes[i]}</div>
                    <div className="text-black-medium">|</div>
                  </>
                )}
                {question.finalize_ts > 0 && (
                  <div className="whitespace-nowrap">
                    Answer: {getAnswerText(question, market.outcomes, market.templateId)}
                  </div>
                )}
              </div>
              {!marketFinalized && question.finalize_ts === 0 && (
                <button type="button" className="text-purple-primary" onClick={() => openAnswerModal(question)}>
                  Answer on Reality.eth
                </button>
              )}
              {!marketFinalized && question.finalize_ts > 0 && (
                <>
                  {!isPreviewWithMultiQuestions && <div className="text-black-medium">|</div>}
                  <div className={clsx("text-black-secondary grow", isPreview && "w-full mt-[5px]")}>
                    <span>
                      If this is not correct, you can correct it within {getTimeLeft(question.finalize_ts)} on
                    </span>{" "}
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
        })}
      </div>
    );
  }

  //marketStatus === MarketStatus.PENDING_EXECUTION || marketStatus === MarketStatus.CLOSED
  return (
    <div className="flex items-center space-x-[12px]">
      <div className="flex items-center space-x-2">
        {(marketStatus === MarketStatus.PENDING_EXECUTION || marketStatus === MarketStatus.IN_DISPUTE) && (
          <HourGlassIcon />
        )}
        {marketStatus === MarketStatus.CLOSED && <CheckCircleIcon />}
        <div className="whitespace-nowrap">
          Answer: {getAnswerText(market.questions[0], market.outcomes, market.templateId)}
        </div>
      </div>
      <div className="text-black-medium">|</div>
      <div className="flex items-center space-x-2">
        {marketStatus === MarketStatus.PENDING_EXECUTION && (
          <button className="text-purple-primary" type="button" onClick={resolveHandler}>
            Report Answer
          </button>
        )}
        {(marketStatus === MarketStatus.CLOSED || marketStatus === MarketStatus.IN_DISPUTE) && (
          <a
            className="text-purple-primary"
            href={getRealityLink(chainId, market.questionId)}
            target="_blank"
            rel="noreferrer"
          >
            Check it on Reality.eth
          </a>
        )}
        <RightArrow />
      </div>
      {marketStatus === MarketStatus.IN_DISPUTE && (
        <>
          <div className="text-black-medium">|</div>
          <div className="flex items-center space-x-2">
            <a className="text-purple-primary" href={"#"} target="_blank" rel="noreferrer">
              Check the case on Kleros Court
            </a>
            <RightArrow />
          </div>
        </>
      )}
    </div>
  );
}

function OutcomesInfo({
  market,
  outcomesCount = 0,
  images = [],
  marketType,
  odds,
}: { market: Market; outcomesCount?: number; images?: string[]; marketType: MarketTypes; odds: number[] }) {
  const outcomes = outcomesCount > 0 ? market.outcomes.slice(0, outcomesCount) : market.outcomes;

  return (
    <div>
      <div className="space-y-3">
        {outcomes.map((outcome, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey:
          <div key={`${outcome}_${i}`} className={clsx("flex justify-between px-[24px] py-[8px]")}>
            <div className="flex items-center space-x-[12px]">
              {marketType !== MarketTypes.SCALAR && (
                <div className="w-[65px]">
                  {images?.[i] ? (
                    <img src={images?.[i]} alt={outcome} className="w-[48px] h-[48px] rounded-full mx-auto" />
                  ) : (
                    <div className="w-[48px] h-[48px] rounded-full bg-purple-primary mx-auto"></div>
                  )}
                </div>
              )}
              <div className="space-y-1">
                <div>
                  <span className="text-[16px]">
                    #{i + 1} {outcome}
                  </span>
                </div>
                {/*<div className="text-[12px] text-[#999999]">xM DAI</div>*/}
              </div>
            </div>
            <div className="flex space-x-10 items-center">
              <div className="text-[24px] font-semibold">{odds?.[i] || 0}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoWithModal({
  market,
  marketStatus,
  colors,
  isPreview,
  chainId,
}: { market: Market; marketStatus?: MarketStatus; colors?: ColorConfig; isPreview: boolean; chainId: SupportedChain }) {
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
    <div className={clsx("text-[14px]", colors?.text)}>
      <MarketInfo
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

export function MarketHeader({ market, images, chainId, isPreview = false, isVerified }: MarketHeaderProps) {
  const { data: marketStatus } = useMarketStatus(market, chainId);
  const { data: daiAmount } = useSDaiToDai(market.outcomesSupply, chainId);
  const [showMarketInfo, setShowMarketInfo] = useState(!isPreview);
  const marketType = getMarketType(market);
  const colors = marketStatus && COLORS[marketStatus];
  const { data: odds = [] } = useMarketOdds(
    chainId,
    getRouterAddress(chainId),
    market.conditionId,
    market.outcomes.length,
  );

  return (
    <div className="bg-white rounded-[3px] drop-shadow text-left flex flex-col">
      <div
        className={clsx(
          "flex justify-between border-t border-t-[5px] text-[14px] px-[25px] h-[45px] items-center",
          colors?.border,
          colors?.bg,
          colors?.text,
        )}
      >
        <div className="flex items-center space-x-2">
          <div className={clsx("w-[8px] h-[8px] rounded-full", colors?.dot)}></div>
          {marketStatus && <div>{STATUS_TEXTS[marketStatus]}</div>}
        </div>
        <div>{market.index && `#${market.index}`}</div>
      </div>

      <div className={clsx("flex space-x-3 p-[24px]", market.questions.length > 1 && "pb-[16px]")}>
        <div>
          {images?.market ? (
            <img src={images.market} alt={market.marketName} className="w-[65px] h-[65px] rounded-full" />
          ) : (
            <div className="w-[65px] h-[65px] rounded-full bg-purple-primary"></div>
          )}
        </div>
        <div className="grow">
          <div className={clsx("font-semibold mb-1 text-[16px]", !isPreview && "lg:text-[24px]")}>
            {!isPreview && market.marketName}
            {isPreview && <Link to={paths.market(market.id, chainId)}>{market.marketName}</Link>}
          </div>
          {market.questions.length === 1 && (
            <InfoWithModal
              market={market}
              marketStatus={marketStatus}
              colors={colors}
              isPreview={isPreview}
              chainId={chainId}
            />
          )}
          {market.questions.length > 1 && (
            <div className="flex space-x-2 items-center text-[14px]">
              <EyeIcon />{" "}
              <span className="text-purple-primary cursor-pointer" onClick={() => setShowMarketInfo(!showMarketInfo)}>
                {showMarketInfo ? "Hide questions" : "Show questions"}
              </span>
            </div>
          )}
        </div>
      </div>

      {market.questions.length > 1 && showMarketInfo && (
        <div className="px-[24px] pb-[16px]">
          <InfoWithModal
            market={market}
            marketStatus={marketStatus}
            colors={colors}
            isPreview={isPreview}
            chainId={chainId}
          />
        </div>
      )}

      {isPreview && (
        <div className="border-t border-[#E5E5E5] py-[16px]">
          <OutcomesInfo
            market={market}
            outcomesCount={3}
            images={images?.outcomes}
            marketType={marketType}
            odds={odds}
          />
        </div>
      )}

      <div className="border-t border-[#E5E5E5] px-[25px] h-[45px] flex items-center justify-between text-[14px] mt-auto">
        <div className="flex items-center space-x-[10px] lg:space-x-6">
          <div className="flex items-center space-x-2">
            {MARKET_TYPES_ICONS[marketType]} <div>{MARKET_TYPES_TEXTS[marketType]}</div>
          </div>
          {!isUndefined(daiAmount) && (
            <div className="flex items-center space-x-2">
              <span className="text-[#999999] max-lg:hidden">Open interest:</span>{" "}
              <div>{displayBalance(daiAmount, 18, false)} DAI</div> <DaiLogo />
            </div>
          )}
        </div>
        {isVerified && (
          <div className="text-[#00C42B] flex items-center space-x-2">
            <CheckCircleIcon />
            <div className="max-lg:hidden">Verified</div>
          </div>
        )}
      </div>
    </div>
  );
}

import { Market } from "@/hooks/useMarket";
import { MarketStatus, useMarketStatus } from "@/hooks/useMarketStatus";
import { useResolveMarket } from "@/hooks/useResolveMarket";
import { SupportedChain } from "@/lib/chains";
import { CalendarIcon, CategoryIcon, CheckCircleIcon, DaiLogo, HourGlassIcon, RightArrow } from "@/lib/icons";
import { MarketTypes, getMarketType, getOpeningTime } from "@/lib/market";
import { paths } from "@/lib/paths";
import { getAnswerText, getRealityLink } from "@/lib/reality";
import { getTimeLeft } from "@/lib/utils";
import clsx from "clsx";
import { Link } from "react-router-dom";

interface MarketHeaderProps {
  market: Market;
  chainId: SupportedChain;
  isPreview?: boolean;
}

export const STATUS_TEXTS: Record<MarketStatus, string> = {
  [MarketStatus.NOT_OPEN]: "Market not open yet",
  [MarketStatus.OPEN]: "Market open",
  [MarketStatus.ANSWER_NOT_FINAL]: "Waiting for answer",
  [MarketStatus.PENDING_EXECUTION]: "Pending execution",
  [MarketStatus.CLOSED]: "Closed",
};

export const MARKET_TYPES_TEXTS: Record<MarketTypes, string> = {
  [MarketTypes.CATEGORICAL]: "Categorical",
  [MarketTypes.SCALAR]: "Scalar",
  [MarketTypes.MULTI_SCALAR]: "Multi Scalar",
};

export const COLORS: Record<MarketStatus, { border: string; bg: string; text: string; dot: string }> = {
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

function MarketInfo({
  market,
  marketStatus,
  isPreview,
  chainId,
}: { market: Market; marketStatus: MarketStatus; isPreview: boolean; chainId: SupportedChain }) {
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
      <div className="flex items-center space-x-2">
        <a
          className="text-purple-primary"
          href={getRealityLink(chainId, market.questionId)}
          target="_blank"
          rel="noreferrer"
        >
          Answer on Reality.eth
        </a>
        <RightArrow />
      </div>
    );
  }

  if (marketStatus === MarketStatus.ANSWER_NOT_FINAL) {
    const marketType = getMarketType(market);
    const showQuestions = !isPreview || (isPreview && marketType !== MarketTypes.MULTI_SCALAR);

    return (
      <div className="space-y-[5px]">
        {!showQuestions && (
          <div className="flex items-center space-x-2">
            <HourGlassIcon /> <div>There are outcomes waiting for answers.</div>
          </div>
        )}
        {showQuestions && market.questions.map((question, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey:
          <div className="flex items-center space-x-[12px]" key={i}>
            <div className="flex items-center space-x-2">
              <HourGlassIcon />
              {marketType === MarketTypes.MULTI_SCALAR && (
                <>
                  <div>{market.outcomes[i]}</div>
                  <div className="text-black-medium">|</div>
                </>
              )}
              {question.finalize_ts > 0 && (
                <div>Answer: {getAnswerText(question, market.outcomes, market.templateId)}</div>
              )}
            </div>
            {question.finalize_ts === 0 && (
              <a
                className="text-purple-primary"
                href={getRealityLink(chainId, market.questionId)}
                target="_blank"
                rel="noreferrer"
              >
                Answer on Reality.eth
              </a>
            )}
            {question.finalize_ts > 0 && (
              <>
                <div className="text-black-medium">|</div>
                <div className="flex items-center space-x-2">
                  <div className="text-black-secondary">
                    If this is not correct, you can correct it within {getTimeLeft(question.finalize_ts)} on{" "}
                    <a
                      className="text-purple-primary"
                      href={getRealityLink(chainId, market.questionId)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Reality.eth
                    </a>
                  </div>
                  <RightArrow />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  }

  //marketStatus === MarketStatus.PENDING_EXECUTION || marketStatus === MarketStatus.CLOSED
  return (
    <div className="flex items-center space-x-[12px]">
      <div className="flex items-center space-x-2">
        {marketStatus === MarketStatus.PENDING_EXECUTION && <HourGlassIcon />}
        {marketStatus === MarketStatus.CLOSED && <CheckCircleIcon />}
        <div>Answer: {getAnswerText(market.questions[0], market.outcomes, market.templateId)}</div>
      </div>
      <div className="text-black-medium">|</div>
      <div className="flex items-center space-x-2">
        {marketStatus === MarketStatus.PENDING_EXECUTION && (
          <div className="text-purple-primary" onClick={resolveHandler}>
            Report Answer
          </div>
        )}
        {marketStatus === MarketStatus.CLOSED && (
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
    </div>
  );
}

export function OutcomesInfo({ market, outcomesCount = 0 }: { market: Market; outcomesCount?: number }) {
  const outcomes = outcomesCount > 0 ? market.outcomes.slice(0, outcomesCount) : market.outcomes;

  return (
    <div>
      <div className="space-y-3">
        {outcomes.map((outcome, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey:
          <div key={`${outcome}_${i}`} className={clsx("flex justify-between px-[24px] py-[8px]")}>
            <div className="flex space-x-[12px]">
              <div className="w-[65px]">
                <div className="w-[48px] h-[48px] rounded-full bg-purple-primary mx-auto"></div>
              </div>
              <div className="space-y-1">
                <div>
                  <span className="text-[16px]">
                    #{i + 1} {outcome}
                  </span>
                </div>
                <div className="text-[12px] text-[#999999]">xM DAI</div>
              </div>
            </div>
            <div className="flex space-x-10 items-center">
              <div className="text-[24px] font-semibold">50%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketHeader({ market, chainId, isPreview = false }: MarketHeaderProps) {
  const { data: marketStatus } = useMarketStatus(market, chainId);

  const colors = marketStatus && COLORS[marketStatus];

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

      <div className="flex space-x-3 p-[24px]">
        <div>
          <div className="w-[65px] h-[65px] rounded-full bg-purple-primary"></div>
        </div>
        <div>
          <div className={clsx("font-semibold mb-1 text-[16px]", !isPreview && "lg:text-[24px]")}>
            {!isPreview && market.marketName}
            {isPreview && <Link to={paths.market(market.id, chainId)}>{market.marketName}</Link>}
          </div>
          <div className={clsx("text-[14px]", colors?.text)}>
            {market && marketStatus && (
              <MarketInfo market={market} marketStatus={marketStatus} isPreview={isPreview} chainId={chainId} />
            )}
          </div>
        </div>
      </div>

      {isPreview && (
        <div className="border-t border-[#E5E5E5] py-[16px]">
          <OutcomesInfo market={market} outcomesCount={3} />
        </div>
      )}

      <div className="border-t border-[#E5E5E5] px-[25px] h-[45px] flex items-center justify-between text-[11px] lg:text-[14px] mt-auto">
        <div className="flex items-center space-x-[10px] lg:space-x-6">
          <div className="flex items-center space-x-2">
            <CategoryIcon /> <div>{MARKET_TYPES_TEXTS[getMarketType(market)]}</div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[#999999]">Open interest:</span> <div>15M DAI</div> <DaiLogo />
          </div>
        </div>
        <div className="text-[#00C42B] flex items-center space-x-2">
          <CheckCircleIcon />
          <div className="max-lg:hidden">Verified</div>
        </div>
      </div>
    </div>
  );
}

import { Spinner } from "@/components/Spinner";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Market } from "@/hooks/useMarket";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { MarketStatus, useMarketStatus } from "@/hooks/useMarketStatus";
import { useSDaiToDai } from "@/hooks/useSDaiToDai";
import { VerificationStatusResult } from "@/hooks/useVerificationStatus";
import { SupportedChain } from "@/lib/chains";
import {
  CategoricalIcon,
  CheckCircleIcon,
  ClockIcon,
  DaiLogo,
  ExclamationCircleIcon,
  EyeIcon,
  MultiCategoricalIcon,
  MultiScalarIcon,
  ScalarIcon,
} from "@/lib/icons";
import { MarketTypes, getMarketType } from "@/lib/market";
import { paths } from "@/lib/paths";
import { displayBalance, isUndefined } from "@/lib/utils";
import clsx from "clsx";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { OutcomeImage } from "../OutcomeImage";
import MarketFavorite from "./MarketFavorite";
import { MarketInfo } from "./MarketInfo";

interface MarketHeaderProps {
  market: Market;
  images?: { market: string; outcomes: string[] };
  chainId: SupportedChain;
  isPreview?: boolean;
  outcomesCount?: number;
  verificationStatusResult?: VerificationStatusResult;
}

export const STATUS_TEXTS: Record<MarketStatus, (hasLiquidity?: boolean) => string> = {
  [MarketStatus.NOT_OPEN]: (hasLiquidity?: boolean) => {
    if (isUndefined(hasLiquidity)) {
      return "Reports not open yet";
    }

    return hasLiquidity ? "Trading Open" : "Liquidity Required";
  },
  [MarketStatus.OPEN]: () => "Reports open",
  [MarketStatus.ANSWER_NOT_FINAL]: () => "Waiting for answer",
  [MarketStatus.IN_DISPUTE]: () => "In Dispute",
  [MarketStatus.PENDING_EXECUTION]: () => "Pending execution",
  [MarketStatus.CLOSED]: () => "Closed",
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

export type ColorConfig = {
  border: string;
  bg: string;
  text: string;
  dot: string;
};
export const COLORS: Record<MarketStatus, ColorConfig> = {
  [MarketStatus.NOT_OPEN]: {
    border: "border-t-[#25cdfe]",
    bg: "bg-black-light",
    text: "text-[#25cdfe]",
    dot: "bg-[#25cdfe]",
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

function OutcomesInfo({
  market,
  chainId,
  outcomesCount = 0,
  images = [],
  marketType,
}: {
  market: Market;
  chainId: SupportedChain;
  outcomesCount?: number;
  images?: string[];
  marketType: MarketTypes;
}) {
  const outcomes = outcomesCount > 0 ? market.outcomes.slice(0, outcomesCount) : market.outcomes;
  const { isIntersecting, ref } = useIntersectionObserver({
    threshold: 0.5,
  });
  const { data: odds = [], isLoading: oddsPending } = useMarketOdds(market, chainId, isIntersecting);

  return (
    <div ref={ref}>
      <div className="space-y-3">
        {outcomes.map((outcome, i) => (
          <div key={`${outcome}_${i}`} className={clsx("flex justify-between px-[24px] py-[8px]")}>
            <div className="flex items-center space-x-[12px]">
              {marketType !== MarketTypes.SCALAR && (
                <div className="w-[65px]">
                  <OutcomeImage
                    image={images?.[i]}
                    isInvalidResult={i === market.outcomes.length - 1}
                    title={outcome}
                  />
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
              <div className="text-[24px] font-semibold">{oddsPending ? <Spinner /> : `${odds?.[i] || 0}%`}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketHeader({
  market,
  images,
  chainId,
  isPreview = false,
  outcomesCount = 0,
  verificationStatusResult,
}: MarketHeaderProps) {
  const { data: marketStatus } = useMarketStatus(market, chainId);
  const { data: daiAmount } = useSDaiToDai(market.outcomesSupply, chainId);
  const [showMarketInfo, setShowMarketInfo] = useState(!isPreview);
  const marketType = getMarketType(market);
  const colors = marketStatus && COLORS[marketStatus];

  const { data: odds = [], isLoading: isPendingOdds } = useMarketOdds(market, chainId, true);

  const hasLiquidity = isPendingOdds ? undefined : odds.some((v) => v > 0);

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
        <div className="flex items-center space-x-2 w-full">
          <div className={clsx("w-[8px] h-[8px] rounded-full", colors?.dot)}></div>
          {marketStatus && <div>{STATUS_TEXTS[marketStatus](hasLiquidity)}</div>}
          {market.id !== "0x000" && <MarketFavorite market={market} colorClassName={colors?.text} />}
        </div>
        <div>{market.index && `#${market.index}`}</div>
      </div>

      <div className={clsx("flex space-x-3 p-[24px]", market.questions.length > 1 && "pb-[16px]")}>
        <div>
          {images?.market ? (
            <img
              src={images.market}
              alt={market.marketName}
              className="w-[65px] h-[65px] min-w-[65px] min-h-[65px] rounded-full"
            />
          ) : (
            <div className="w-[65px] h-[65px] rounded-full bg-purple-primary"></div>
          )}
        </div>
        <div className="grow min-w-0">
          <div className={clsx("font-semibold mb-1 text-[16px]", !isPreview && "lg:text-[24px]")}>
            {!isPreview && market.marketName}
            {isPreview && <Link to={paths.market(market.id, chainId)}>{market.marketName}</Link>}
          </div>
          {market.questions.length === 1 || marketStatus === MarketStatus.NOT_OPEN ? (
            <MarketInfo market={market} marketStatus={marketStatus} isPreview={isPreview} chainId={chainId} />
          ) : (
            <div className="flex space-x-2 items-center text-[14px]">
              <EyeIcon />{" "}
              <span className="text-purple-primary cursor-pointer" onClick={() => setShowMarketInfo(!showMarketInfo)}>
                {showMarketInfo ? "Hide questions" : "Show questions"}
              </span>
            </div>
          )}
        </div>
      </div>

      {market.questions.length > 1 && marketStatus !== MarketStatus.NOT_OPEN && showMarketInfo && (
        <div className="px-[24px] pb-[16px]">
          <MarketInfo market={market} marketStatus={marketStatus} isPreview={isPreview} chainId={chainId} />
        </div>
      )}

      {isPreview && (
        <div className="border-t border-[#E5E5E5] py-[16px]">
          <OutcomesInfo
            market={market}
            chainId={chainId}
            outcomesCount={outcomesCount}
            images={images?.outcomes}
            marketType={marketType}
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
        {!isUndefined(verificationStatusResult) && (
          <Link
            className={clsx(
              "flex items-center space-x-2",
              verificationStatusResult.status === "verified" && "text-success-primary",
              verificationStatusResult.status === "verifying" && "text-blue-primary",
              verificationStatusResult.status === "not_verified" && "text-purple-primary",
            )}
            to={
              verificationStatusResult.status === "not_verified"
                ? paths.verifyMarket(market.id, chainId)
                : paths.curateVerifiedList(chainId, verificationStatusResult.itemID)
            }
            {...(verificationStatusResult.status === "not_verified"
              ? {}
              : { target: "_blank", rel: "noopener noreferrer" })}
          >
            {verificationStatusResult.status === "verified" && (
              <>
                <CheckCircleIcon />
                <div className="max-lg:hidden">Verified</div>
              </>
            )}
            {verificationStatusResult.status === "verifying" && (
              <>
                <ClockIcon />
                <div className="max-lg:hidden">Verifying</div>
              </>
            )}
            {verificationStatusResult.status === "not_verified" && (
              <>
                <ExclamationCircleIcon width="14" height="14" />
                <div className="max-lg:hidden">Verify it</div>
              </>
            )}
          </Link>
        )}
      </div>
    </div>
  );
}

import { Spinner } from "@/components/Spinner";
import { useConvertToAssets } from "@/hooks/trade/handleSDAI";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Market, useMarket } from "@/hooks/useMarket";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { MarketStatus, useMarketStatus } from "@/hooks/useMarketStatus";
import { VerificationStatusResult } from "@/hooks/useVerificationStatus";
import { SupportedChain } from "@/lib/chains";
import {
  CategoricalIcon,
  CheckCircleIcon,
  ClockIcon,
  DaiLogo,
  ExclamationCircleIcon,
  EyeIcon,
  LawBalanceIcon,
  MultiCategoricalIcon,
  MultiScalarIcon,
  MyMarket,
  ScalarIcon,
  SeerLogo,
} from "@/lib/icons";
import { MarketTypes, getMarketType } from "@/lib/market";
import { paths } from "@/lib/paths";
import { INVALID_RESULT_OUTCOME_TEXT, displayBalance, isUndefined } from "@/lib/utils";
import clsx from "clsx";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { gnosis } from "viem/chains";
import { useAccount } from "wagmi";
import { OutcomeImage } from "../OutcomeImage";
import MarketFavorite from "./MarketFavorite";
import { MarketInfo } from "./MarketInfo";

interface MarketHeaderProps {
  market: Market & { creator?: string };
  images?: { market: string; outcomes: string[] };
  chainId: SupportedChain;
  type?: "default" | "preview" | "small";
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
  const validOutcomes = market.outcomes.filter((outcome) => outcome !== INVALID_RESULT_OUTCOME_TEXT);
  const outcomes = outcomesCount > 0 ? validOutcomes.slice(0, outcomesCount) : validOutcomes;
  const { isIntersecting, ref } = useIntersectionObserver({
    threshold: 0.5,
  });
  const { data: odds = [], isLoading: oddsPending } = useMarketOdds(market, chainId, isIntersecting);

  return (
    <div ref={ref}>
      <div className="space-y-3">
        {outcomes.map((outcome, i) => (
          <Link
            key={`${outcome}_${i}`}
            className={clsx("flex justify-between px-[24px] py-[8px] hover:bg-gray-light cursor-pointer group")}
            to={`${paths.market(market.id, chainId)}?outcome=${i}`}
          >
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
                <div className="group-hover:underline">
                  #{i + 1} {outcome}
                </div>
                {/*<div className="text-[12px] text-black-secondary">xM DAI</div>*/}
              </div>
            </div>
            <div className="flex space-x-10 items-center">
              <div className="text-[24px] font-semibold">{oddsPending ? <Spinner /> : `${odds?.[i] || 0}%`}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function MarketHeader({
  market,
  images,
  chainId,
  type = "default",
  outcomesCount = 0,
  verificationStatusResult,
}: MarketHeaderProps) {
  const { address } = useAccount();
  const { data: parentMarket } = useMarket(market.parentMarket, chainId);
  const { data: marketStatus } = useMarketStatus(market, chainId);
  const { data: daiAmount } = useConvertToAssets(market.outcomesSupply, chainId);
  const [showMarketInfo, setShowMarketInfo] = useState(type === "default");
  const marketType = getMarketType(market);
  const colors = marketStatus && COLORS[marketStatus];

  const { data: odds = [], isLoading: isPendingOdds } = useMarketOdds(market, chainId, true);

  const hasLiquidity = isPendingOdds ? undefined : odds.some((v) => v > 0);
  return (
    <div
      className={clsx(
        "bg-white rounded-[3px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] text-left flex flex-col",
        market.id === "0x000" ? "pointer-events-none" : "",
      )}
    >
      <div
        className={clsx(
          "flex justify-between border-t border-t-[5px] text-[14px] px-[25px] h-[45px] items-center",
          colors?.border,
          colors?.bg,
          colors?.text,
        )}
      >
        <div className="flex items-center gap-2 w-full">
          <div className={clsx("w-[8px] h-[8px] rounded-full", colors?.dot)}></div>
          {marketStatus && <div>{STATUS_TEXTS[marketStatus](hasLiquidity)}</div>}
          <div className="flex items-center gap-4 ml-auto">
            {address && market.creator?.toLocaleLowerCase() === address.toLocaleLowerCase() && (
              <div className="tooltip">
                <p className="tooltiptext">Market created by this account</p>
                <MyMarket />
              </div>
            )}
            {market.id !== "0x000" && <MarketFavorite market={market} colorClassName={colors?.text} />}
          </div>
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
          <div className={clsx("font-semibold mb-1 text-[16px]", type === "default" && "lg:text-[24px]")}>
            {type === "default" && market.marketName}
            {type !== "default" && (
              <Link className="hover:underline" to={paths.market(market.id, chainId)}>
                {market.marketName}
              </Link>
            )}
          </div>
          {parentMarket && type !== "default" && (
            <p className="text-[14px] my-2">
              Conditional on{" "}
              <Link
                to={paths.market(parentMarket.id, chainId)}
                target="_blank"
                className="text-purple-primary font-medium"
              >
                "{parentMarket.marketName}"
              </Link>{" "}
              being{" "}
              <Link
                to={`${paths.market(parentMarket.id, chainId)}?outcome=${market.parentOutcome}`}
                target="_blank"
                className="text-purple-primary font-medium"
              >
                "{parentMarket.outcomes[Number(market.parentOutcome)]}"
              </Link>
            </p>
          )}
          {market.questions.length === 1 || marketStatus === MarketStatus.NOT_OPEN ? (
            <MarketInfo market={market} marketStatus={marketStatus} isPreview={type === "preview"} chainId={chainId} />
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
          <MarketInfo market={market} marketStatus={marketStatus} isPreview={type === "preview"} chainId={chainId} />
        </div>
      )}

      {type === "preview" && (
        <div className="border-t border-black-medium py-[16px]">
          <OutcomesInfo
            market={market}
            chainId={chainId}
            outcomesCount={outcomesCount}
            images={images?.outcomes}
            marketType={marketType}
          />
        </div>
      )}
      {type !== "small" && (
        <div className="border-t border-black-medium px-[25px] h-[45px] flex items-center justify-between text-[14px] mt-auto @container">
          <div className="flex items-center gap-4">
            <SeerLogo fill="#511778" width="50px" height="100%" />
            <div className="flex items-center gap-2">
              <div className="tooltip">
                <p className="tooltiptext @[510px]:hidden">{MARKET_TYPES_TEXTS[marketType]}</p>
                {MARKET_TYPES_ICONS[marketType]}
              </div>
              <div className="@[510px]:block hidden">{MARKET_TYPES_TEXTS[marketType]}</div>
            </div>
            {!isUndefined(daiAmount) && (
              <div className="!flex items-center gap-2 tooltip">
                <p className="tooltiptext @[510px]:hidden">Open interest</p>
                <span className="text-black-secondary @[510px]:block hidden">Open interest:</span>{" "}
                <div>
                  {displayBalance(daiAmount, 18, true)} {chainId === gnosis.id ? "xDAI" : "DAI"}
                </div>{" "}
                <DaiLogo />
              </div>
            )}
          </div>
          {!isUndefined(verificationStatusResult) && (
            <Link
              className={clsx(
                "flex items-center space-x-2",
                verificationStatusResult.status === "verified" && "text-success-primary",
                verificationStatusResult.status === "verifying" && "text-blue-primary",
                verificationStatusResult.status === "challenged" && "text-warning-primary",
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
              {verificationStatusResult.status === "challenged" && (
                <>
                  <LawBalanceIcon />
                  <div className="max-lg:hidden">Challenged</div>
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
      )}
    </div>
  );
}

import { useMarket } from "@/hooks/useMarket";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { useSortedOutcomes } from "@/hooks/useSortedOutcomes";
import { useWinningOutcomes } from "@/hooks/useWinningOutcomes";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { NETWORK_ICON_MAPPING, isVerificationEnabled } from "@/lib/config";
import {
  CheckCircleIcon,
  ClockIcon,
  ConditionalMarketIcon,
  ExclamationCircleIcon,
  LawBalanceIcon,
  PresentIcon,
  SeerLogo,
} from "@/lib/icons";
import { getMarketStatus } from "@/lib/market";
import { MarketStatus } from "@/lib/market";
import { Market } from "@/lib/market";
import { MarketTypes, getMarketType, isOdd } from "@/lib/market";
import { getMarketEstimate } from "@/lib/market-odds";
import { paths } from "@/lib/paths";
import { displayScalarBound } from "@/lib/reality";
import { INVALID_RESULT_OUTCOME_TEXT, formatBigNumbers, isUndefined } from "@/lib/utils";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Link } from "../Link";
import Popover from "../Popover";
import { DisplayOdds } from "./DisplayOdds";
import { BAR_COLOR, COLORS, MARKET_TYPES_TEXTS } from "./Header";
import { MARKET_TYPES_ICONS_LG } from "./Header/Icons";
import MarketFavorite from "./Header/MarketFavorite";
import { PoolTokensInfo } from "./Header/MarketHeader";

function OutcomesInfo({
  market,
  outcomesCount = 0,
  marketStatus,
}: {
  market: Market;
  outcomesCount?: number;
  images?: string[];
  marketStatus?: MarketStatus;
}) {
  const visibleOutcomesLimit = outcomesCount && outcomesCount > 0 ? outcomesCount : market.outcomes.length - 1;

  const { data: odds = [] } = useMarketOdds(market, false);

  const { data: winningOutcomes } = useWinningOutcomes(market, marketStatus);
  const { data: indexesOrderedByOdds } = useSortedOutcomes(odds, market, marketStatus);
  const visibleIndexes = market.outcomes.reduce((acc, _, j) => {
    const i = indexesOrderedByOdds ? indexesOrderedByOdds[j] : j;
    const outcome = market.outcomes[i];

    if (j >= visibleOutcomesLimit) {
      return acc;
    }

    if (
      outcome === INVALID_RESULT_OUTCOME_TEXT &&
      (marketStatus !== MarketStatus.CLOSED || (marketStatus === MarketStatus.CLOSED && winningOutcomes?.[i] !== true))
    ) {
      return acc;
    }
    acc.push(i);
    return acc;
  }, [] as number[]);
  const visibleOutcomesCount = visibleIndexes.length;
  const sumVisibleOdds = visibleIndexes
    .map((index) => (isOdd(odds[index]) ? odds[index] : 0))
    .reduce((acc, curr) => acc + curr, 0);

  const marketType = getMarketType(market);

  if (odds.length === 0) {
    return <div className="shimmer-container w-full h-[6px] rounded-[8px]"></div>;
  }

  const [lowerBound, upperBound] = [displayScalarBound(market.lowerBound), displayScalarBound(market.upperBound)];

  if (marketType === MarketTypes.SCALAR) {
    const marketEstimate = Number(getMarketEstimate(odds, market));
    if (Number.isNaN(marketEstimate)) {
      return null;
    }
    const percentage = ((marketEstimate - lowerBound) / (upperBound - lowerBound)) * 100;
    return (
      <div className="text-[12px] text-purple-primary">
        <p className="italic text-black-secondary mb-3">Estimate</p>
        <div className="relative">
          <input
            type="range"
            min={lowerBound}
            max={upperBound}
            step={0.001}
            value={marketEstimate}
            className="
              w-full
              h-[6px]
              appearance-none
              bg-gray-200
              rounded-lg
              outlined-thumb
            "
            style={{
              background: `linear-gradient(to right, #B38FFF ${percentage}%, #EEEEEE ${percentage}%)`,
            }}
          />
          <p
            className="absolute top-[-16px]"
            style={{
              left: `calc(max(0px, min(${percentage}% - ${
                3.2 * marketEstimate.toLocaleString().length
              }px, 100% - ${6 * marketEstimate.toLocaleString().length}px)))`,
            }}
          >
            {marketEstimate.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p>{lowerBound.toLocaleString()}</p>
          <p>{upperBound.toLocaleString()}</p>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-start gap-[3px] w-full rounded-[8px] overflow-hidden">
        {visibleIndexes.map((i, order) => {
          const outcome = market.outcomes[i];
          const originalIndex = market.wrappedTokens.findIndex((x) => market.wrappedTokens[i] === x);
          const background = (() => {
            switch (marketType) {
              case MarketTypes.CATEGORICAL: {
                return BAR_COLOR[marketType][originalIndex] ?? "gray";
              }
              default: {
                return BAR_COLOR[marketType][order] ?? "gray";
              }
            }
          })();
          if (!isOdd(odds[i])) {
            return null;
          }
          const adjustedWidth = (odds[i] / sumVisibleOdds) * 100;
          return (
            <div
              key={`${outcome}_${i}`}
              className="h-[6px] flex-shrink-0"
              style={{ width: `${adjustedWidth}%`, background }}
            ></div>
          );
        })}
      </div>
      <div
        className={clsx("flex items-center gap-[3px] flex-wrap", visibleOutcomesCount === 2 ? "justify-between" : "")}
      >
        {visibleIndexes.map((i, order) => {
          const outcome = market.outcomes[i];
          const originalIndex = market.wrappedTokens.findIndex((x) => market.wrappedTokens[i] === x);
          const adjustedWidth = (Number(odds[i]) / sumVisibleOdds) * 100;
          const color = (() => {
            switch (marketType) {
              case MarketTypes.CATEGORICAL: {
                return BAR_COLOR[marketType][originalIndex] ?? "gray";
              }
              default: {
                return BAR_COLOR[marketType][order] ?? "gray";
              }
            }
          })();
          if (!isOdd(odds[i])) {
            return null;
          }
          return (
            <p
              className={clsx("text-[12px]")}
              key={`${outcome}_${i}`}
              style={{
                color,
                ...(visibleOutcomesCount > 2 && { minWidth: `${adjustedWidth * 0.9}%` }),
              }}
            >
              {outcome} <DisplayOdds odd={odds[i]} marketType={getMarketType(market)} />
            </p>
          );
        })}
      </div>
    </div>
  );
}

export function SlideCard({ market }: { market: Market }) {
  const outcomesCount = 3;
  const marketStatus = getMarketStatus(market);
  const liquidityUSD = formatBigNumbers(market.liquidityUSD);
  const incentive = formatBigNumbers(market.incentive);
  const { data: parentMarket } = useMarket(market.parentMarket.id, market.chainId);
  const [isCardMobile, setIsCardMobile] = useState(false);
  const marketType = getMarketType(market);
  const colors = marketStatus && COLORS[marketStatus];

  const blockExplorerUrl = SUPPORTED_CHAINS?.[market.chainId]?.blockExplorers?.default?.url;
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleResize() {
      const width = cardRef.current?.getBoundingClientRect()?.width;
      if (width) {
        setIsCardMobile(width < 700);
      }
    }

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <div
      ref={cardRef}
      className={clsx(
        "bg-white rounded-[1px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] text-left flex h-full justify-between",
        market.id === "0x000" ? "pointer-events-none" : "",
      )}
    >
      <div className="px-[3vw] pt-[2.5vw] pb-[2.25vw] w-full">
        <div
          className={clsx(
            "font-semibold mb-1 text-[max(14px,1.5vw)] break-words h-[100px] overflow-y-auto custom-scrollbar",
          )}
        >
          {isCardMobile ? (
            <div className="flex gap-3">
              <Link to={paths.market(market)}>
                {market.images?.market ? (
                  <img
                    src={market.images.market}
                    alt={market.marketName}
                    className="w-[38px] h-[38px] min-w-[38px] min-h-[38px] rounded-full"
                  />
                ) : (
                  <div className="w-[38px] h-[38px] rounded-full bg-purple-primary"></div>
                )}
              </Link>
              <Link className="hover:underline" to={paths.market(market)}>
                {market.marketName}
              </Link>
            </div>
          ) : (
            <Link className="hover:underline" to={paths.market(market)}>
              {market.marketName}
            </Link>
          )}
        </div>

        <div className="h-[100px] overflow-y-auto custom-scrollbar">
          <OutcomesInfo
            market={market}
            outcomesCount={outcomesCount}
            images={market.images?.outcomes}
            marketStatus={marketStatus}
          />
        </div>
        <div className="flex items-center justify-between w-full">
          <div className="w-[4.69vw] min-w-[50px] max-w-[75px] h-auto">
            <SeerLogo fill="#511778" width="100%" height="100%" />
          </div>
          <div className="flex items-center gap-2">
            {market.liquidityUSD > 0 ? (
              <Popover
                trigger={<p className="text-[12px]">${liquidityUSD}</p>}
                content={
                  <div className="overflow-y-auto max-h-[300px] max-w-[400px] text-[12px]">
                    <p className="text-purple-primary">Liquidity:</p>
                    <PoolTokensInfo market={market} marketStatus={marketStatus} type={"preview"} />
                  </div>
                }
              />
            ) : (
              <p className="text-[12px]">${liquidityUSD}</p>
            )}
            <div className="tooltip">
              <p className="tooltiptext">{MARKET_TYPES_TEXTS[marketType]}</p>
              <div className="w-[1.5vw] min-w-[14px]">{MARKET_TYPES_ICONS_LG[marketType]}</div>
            </div>
            {parentMarket && (
              <div className="tooltip">
                <div className="tooltiptext !text-left w-[300px] !whitespace-pre-wrap">
                  <p className="text-purple-primary">Conditional Market:</p>
                  <p className="text-black-secondary">
                    Conditional on <span className="text-black-primary">"{parentMarket.marketName}"</span> being{" "}
                    <span className="text-black-primary">"{parentMarket.outcomes[Number(market.parentOutcome)]}"</span>
                  </p>
                </div>
                <div className="w-[1.5vw] min-w-[14px]">
                  <ConditionalMarketIcon width="auto" />
                </div>
              </div>
            )}
            {market.incentive > 0 && (
              <div className="tooltip">
                <p className="tooltiptext">
                  Reward: <span className="text-purple-primary">{incentive} SEER/day</span>
                </p>
                <div className="w-[1.5vw] min-w-[14px]">
                  <PresentIcon width="100%" />
                </div>
              </div>
            )}
            <div className="tooltip !flex">
              <p className="tooltiptext">View contract on explorer</p>
              <a
                href={blockExplorerUrl && `${blockExplorerUrl}/address/${market.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <img
                  alt="network-icon"
                  className="w-[1.5vw] min-w-[14px] rounded-full"
                  src={NETWORK_ICON_MAPPING[market.chainId]}
                />
              </a>
            </div>
            {!isUndefined(market.verification) && isVerificationEnabled(market.chainId) && (
              <Link
                className={clsx(
                  "tooltip",
                  market.verification.status === "verified" && "text-success-primary",
                  market.verification.status === "verifying" && "text-blue-primary",
                  market.verification.status === "challenged" && "text-warning-primary",
                  market.verification.status === "not_verified" && "text-purple-primary",
                )}
                to={
                  market.verification.status === "not_verified"
                    ? paths.verifyMarket(market.id, market.chainId)
                    : paths.curateVerifiedList(market.chainId, market.verification.itemID)
                }
                {...(market.verification.status === "not_verified"
                  ? {}
                  : { target: "_blank", rel: "noopener noreferrer" })}
              >
                {market.verification.status === "verified" && (
                  <>
                    <div className="w-[1.5vw] min-w-[14px]">
                      <CheckCircleIcon width="100%" height="100%" />
                    </div>
                    <div className="tooltiptext">Verified</div>
                  </>
                )}
                {market.verification.status === "verifying" && (
                  <>
                    <div className="w-[1.5vw] min-w-[14px]">
                      <ClockIcon width="100%" height="100%" />
                    </div>
                    <div className="tooltiptext">Verifying</div>
                  </>
                )}
                {market.verification.status === "challenged" && (
                  <>
                    <div className="w-[1.5vw] min-w-[14px]">
                      <LawBalanceIcon width="100%" />
                    </div>
                    <div className="tooltiptext">Challenged</div>
                  </>
                )}
                {market.verification.status === "not_verified" && (
                  <>
                    <div className="w-[1.5vw] min-w-[14px]">
                      <ExclamationCircleIcon width="100%" height="100%" />
                    </div>
                    <div className="tooltiptext">Verify it</div>
                  </>
                )}
              </Link>
            )}
            {market.id !== "0x000" && (
              <div className="w-[1.5vw] min-w-[14px]">
                <MarketFavorite market={market} colorClassName={colors?.text} iconWidth="100%" />
              </div>
            )}
          </div>
        </div>
      </div>
      {!isCardMobile && (
        <div className="h-full rounded-[3px] p-1 flex-shrink-0 overflow-hidden">
          {market.images?.market ? (
            <img src={market.images.market} alt={market.marketName} className="h-full" />
          ) : (
            <div className="h-full"></div>
          )}
        </div>
      )}
    </div>
  );
}

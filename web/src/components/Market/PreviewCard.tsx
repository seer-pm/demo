import { useMarket } from "@/hooks/useMarket";
import { useSortedOutcomes } from "@/hooks/useSortedOutcomes";
import { useWinningOutcomes } from "@/hooks/useWinningOutcomes";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { NETWORK_ICON_MAPPING } from "@/lib/config";
import {
  CheckCircleIcon,
  ClockIcon,
  ConditionalMarketIcon,
  ExclamationCircleIcon,
  LawBalanceIcon,
  PresentIcon,
  SeerLogo,
} from "@/lib/icons";
import {
  Market,
  MarketStatus,
  MarketTypes,
  getMarketEstimate,
  getMarketStatus,
  getMarketType,
  isOdd,
} from "@/lib/market";
import { rescaleOdds } from "@/lib/market-odds";
import { paths } from "@/lib/paths";
import { displayScalarBound, getAnswerTextFromMarket } from "@/lib/reality";
import { INVALID_RESULT_OUTCOME_TEXT, formatBigNumbers, isUndefined } from "@/lib/utils";
import clsx from "clsx";
import { clientOnly } from "vike-react/clientOnly";
import { Link } from "../Link";
import { DisplayOdds } from "./DisplayOdds";
import { BAR_COLOR, COLORS, MARKET_TYPES_TEXTS } from "./Header";
import { MARKET_TYPES_ICONS } from "./Header/Icons";
import MarketFavorite from "./Header/MarketFavorite";
import { PoolTokensInfo } from "./Header/MarketHeader";

export function OutcomesInfo({
  market,
  outcomesCount = 0,
  marketStatus,
}: { market: Market; outcomesCount?: number; images?: string[]; marketStatus?: MarketStatus }) {
  const visibleOutcomesLimit = outcomesCount && outcomesCount > 0 ? outcomesCount : market.outcomes.length - 1;
  const marketType = getMarketType(market);

  const odds = marketType === MarketTypes.MULTI_CATEGORICAL ? market.odds : rescaleOdds(market.odds);
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
            readOnly
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
              left: `calc(max(0px, min(${percentage}% - ${3.2 * marketEstimate.toLocaleString().length}px, 100% - ${6 * marketEstimate.toLocaleString().length}px)))`,
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
                if (visibleOutcomesCount === 2) {
                  return BAR_COLOR[marketType][originalIndex] ?? "gray";
                }
                return BAR_COLOR[MarketTypes.MULTI_CATEGORICAL][order] ?? "gray";
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
      <div className={clsx("flex items-center gap-x-3 flex-wrap", visibleOutcomesCount === 2 ? "justify-between" : "")}>
        {visibleIndexes.map((i, order) => {
          const outcome = market.outcomes[i];
          const originalIndex = market.wrappedTokens.findIndex((x) => market.wrappedTokens[i] === x);
          const color = (() => {
            switch (marketType) {
              case MarketTypes.CATEGORICAL: {
                if (visibleOutcomesCount === 2) {
                  return BAR_COLOR[marketType][originalIndex] ?? "gray";
                }
                return BAR_COLOR[MarketTypes.MULTI_CATEGORICAL][order] ?? "gray";
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
            <p className={clsx("text-[12px]")} key={`${outcome}_${i}`} style={{ color }}>
              {outcome} <DisplayOdds odd={odds[i]} marketType={getMarketType(market)} />
            </p>
          );
        })}
      </div>
    </div>
  );
}

const ConditionalMarketTooltipInner = ({ parentMarket, market }: { market: Market; parentMarket: Market }) => (
  <div className="tooltip">
    <div className="tooltiptext !text-left w-[300px] max-sm:w-[220px] !whitespace-pre-wrap">
      <p className="text-purple-primary">Conditional Market:</p>
      <p className="text-black-secondary">
        Conditional on <span className="text-black-primary">"{parentMarket.marketName}"</span> being{" "}
        <span className="text-black-primary">"{parentMarket.outcomes[Number(market.parentOutcome)]}"</span>
      </p>
    </div>
    <ConditionalMarketIcon />
  </div>
);

const ConditionalMarketTooltip = clientOnly(async () => ConditionalMarketTooltipInner);

function MarketResult({ market }: { market: Market }) {
  const marketStatus = getMarketStatus(market);

  if (marketStatus !== MarketStatus.CLOSED) {
    return null;
  }

  const marketType = getMarketType(market);

  return (
    <Link
      className="h-[24px] block rounded-[3px] text-[12px] leading-[24px] relative"
      style={{ background: `${BAR_COLOR[marketType][0]}29`, color: BAR_COLOR[marketType][0] }}
      to={paths.market(market)}
    >
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
        <CheckCircleIcon />
      </div>
      <div className="text-center px-7 whitespace-nowrap text-ellipsis overflow-hidden">
        {marketType === MarketTypes.MULTI_CATEGORICAL || marketType === MarketTypes.MULTI_SCALAR ? (
          <span className="font-medium">See results</span>
        ) : (
          getAnswerTextFromMarket(market.questions[0], market)
        )}
      </div>
    </Link>
  );
}

export function PreviewCard({ market }: { market: Market }) {
  const outcomesCount = 3;
  const marketStatus = getMarketStatus(market);
  const liquidityUSD = formatBigNumbers(market.liquidityUSD);
  const incentive = formatBigNumbers(market.incentive);
  const { data: parentMarket } = useMarket(market.parentMarket.id, market.chainId);
  const marketType = getMarketType(market);
  const colors = marketStatus && COLORS[marketStatus];

  const blockExplorerUrl = SUPPORTED_CHAINS?.[market.chainId]?.blockExplorers?.default?.url;
  return (
    <div
      className={clsx(
        "bg-white rounded-[3px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] text-left flex flex-col",
        market.id === "0x000" ? "pointer-events-none" : "",
      )}
    >
      <div className="h-[100px] overflow-y-auto custom-scrollbar">
        <div className={clsx("flex space-x-3 px-4 pt-3")}>
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
          <div className="grow min-w-0">
            <div className={clsx("font-semibold mb-1 text-[14px] break-words")}>
              <Link className="hover:underline" to={paths.market(market)}>
                {market.marketName}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 h-[100px] overflow-y-auto custom-scrollbar">
        {marketStatus === MarketStatus.CLOSED ? (
          <MarketResult market={market} />
        ) : (
          <OutcomesInfo
            market={market}
            outcomesCount={outcomesCount}
            images={market.images?.outcomes}
            marketStatus={marketStatus}
          />
        )}
      </div>

      <div className="border-t border-black-medium px-[16px] h-[36px] flex items-center justify-between w-full">
        <SeerLogo fill="#511778" width="50px" />
        <div className="flex items-center gap-2">
          <div className="tooltip">
            {market.liquidityUSD > 0 && (
              <div className="tooltiptext !text-left min-w-[300px] max-sm:min-w-[220px]">
                <p className="text-purple-primary">Liquidity:</p>
                <PoolTokensInfo market={market} marketStatus={marketStatus} type={"preview"} />
              </div>
            )}
            <p className="text-[12px]">${liquidityUSD}</p>
          </div>
          <div className="tooltip">
            <p className="tooltiptext">{MARKET_TYPES_TEXTS[marketType]}</p>
            {MARKET_TYPES_ICONS[marketType]}
          </div>
          {parentMarket && <ConditionalMarketTooltip parentMarket={parentMarket} market={market} />}
          {market.incentive > 0 && (
            <div className="tooltip">
              <p className="tooltiptext">
                Reward: <span className="text-purple-primary">{incentive} SEER/day</span>
              </p>
              <PresentIcon width="16px" />
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
                className="w-[14px] h-[14px] rounded-full"
                src={NETWORK_ICON_MAPPING[market.chainId]}
              />
            </a>
          </div>
          {!isUndefined(market.verification) && (
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
                  <CheckCircleIcon />
                  <div className="tooltiptext">Verified</div>
                </>
              )}
              {market.verification.status === "verifying" && (
                <>
                  <ClockIcon />
                  <div className="tooltiptext">Verifying</div>
                </>
              )}
              {market.verification.status === "challenged" && (
                <>
                  <LawBalanceIcon />
                  <div className="tooltiptext">Challenged</div>
                </>
              )}
              {market.verification.status === "not_verified" && (
                <>
                  <ExclamationCircleIcon width="14" height="14" />
                  <div className="tooltiptext">Verify it</div>
                </>
              )}
            </Link>
          )}
          {market.id !== "0x000" && <MarketFavorite market={market} colorClassName={colors?.text} />}
        </div>
      </div>
    </div>
  );
}

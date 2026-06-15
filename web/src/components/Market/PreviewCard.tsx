import { useSortedOutcomes } from "@/hooks/useSortedOutcomes";
import { useWinningOutcomes } from "@/hooks/useWinningOutcomes";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { NETWORK_ICON_MAPPING, isVerificationEnabled } from "@/lib/config";
import { getChallengeRemainingTime } from "@/lib/date";
import {
  CheckCircleIcon,
  ClockIcon,
  ConditionalMarketIcon,
  ExclamationCircleIcon,
  LawBalanceIcon,
  SeerLogo,
} from "@/lib/icons";
import { paths } from "@/lib/paths";
import { displayBalance, displayNumber, formatBigNumbers, isUndefined } from "@/lib/utils";
import { useMarket, useTokenInfo } from "@seer-pm/react";
import { getActivePrimaryCollateral } from "@seer-pm/sdk";
import {
  INVALID_RESULT_OUTCOME_TEXT,
  Market,
  MarketStatus,
  MarketTypes,
  displayScalarBound,
  getAnswerTextFromMarket,
  getMarketEstimate,
  getMarketStatus,
  getMarketType,
  getMarketUnit,
  isOdd,
  rescaleOdds,
} from "@seer-pm/sdk";
import { MARKET_TYPES_TEXTS } from "@seer-pm/sdk";
import clsx from "clsx";
import { useMemo } from "react";
import { formatUnits } from "viem";
import { Link } from "../Link";
import Popover from "../Popover";
import { BAR_COLOR, COLORS } from "./Header";
import MarketFavorite from "./Header/MarketFavorite";
import { PoolTokensInfo } from "./Header/MarketHeader";

const DONUT_SIZE = 56;
const DONUT_PAD_ANGLE = 2;
const GAUGE_WIDTH = 100;
const GAUGE_STROKE_WIDTH = 6;
const GAUGE_KNOB_RADIUS = 4;
const GAUGE_DISPLAY_HEIGHT = 74;
const GAUGE_COLOR = "var(--blue)";

type OutcomeSegment = {
  outcome: string;
  color: string;
  percent: number;
  key: string;
};

function getOutcomeColor(
  marketType: MarketTypes,
  order: number,
  originalIndex: number,
  visibleOutcomesCount: number,
): string {
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
}

function formatOutcomePercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  const rounded = Math.round(value * 10) / 10;
  return rounded % 1 === 0 ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function describeDonutSegment(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

function describeGaugeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const diff = (endAngle - startAngle + 360) % 360;
  const largeArc = diff > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function ScalarGaugeShimmer() {
  return (
    <div className="w-full max-w-[110px] mx-auto">
      <div className="relative h-[74px] flex items-end justify-center">
        <div className="shimmer-container w-[80px] h-[70px] rounded-t-full" />
        <div className="absolute bottom-[4px] shimmer-container w-[8px] h-[8px] rounded-full" />
      </div>
      <div className="flex flex-col items-center gap-0.5 -mt-1">
        <div className="shimmer-container h-[14px] w-[40px] rounded-[4px]" />
        <div className="shimmer-container h-[9px] w-[20px] rounded-[4px]" />
      </div>
      <div className="flex justify-between">
        <div className="shimmer-container h-[9px] w-[24px] rounded-[4px]" />
        <div className="shimmer-container h-[9px] w-[24px] rounded-[4px]" />
      </div>
    </div>
  );
}

function ScalarGauge({
  value,
  min,
  max,
  unit,
  color = GAUGE_COLOR,
  width = GAUGE_WIDTH,
}: {
  value: number;
  min: number;
  max: number;
  unit?: string;
  color?: string;
  width?: number;
}) {
  const range = max - min;
  const percentage = range === 0 ? 0 : Math.max(0, Math.min(100, ((value - min) / range) * 100));
  const cx = width / 2;
  const radius = width / 2 - GAUGE_STROKE_WIDTH - GAUGE_KNOB_RADIUS;
  const cy = radius + GAUGE_STROKE_WIDTH / 2;
  const arcPadding = GAUGE_KNOB_RADIUS + GAUGE_STROKE_WIDTH / 2;
  const viewBox = {
    x: cx - radius - arcPadding,
    y: cy - radius - arcPadding,
    width: 2 * (radius + arcPadding),
    height: radius + 2 * arcPadding,
  };
  const valueAngle = 270 + (percentage / 100) * 180;
  const knobAngle = valueAngle >= 360 ? valueAngle - 360 : valueAngle;
  const knobPos = polarToCartesian(cx, cy, radius, knobAngle);
  const bgArc = describeGaugeArc(cx, cy, radius, 270, 90);

  return (
    <div className="w-full max-w-[110px] mx-auto">
      <div className="relative" style={{ height: GAUGE_DISPLAY_HEIGHT }}>
        <svg
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <path
            d={bgArc}
            fill="none"
            stroke="#EEEEEE"
            strokeWidth={GAUGE_STROKE_WIDTH}
            strokeLinecap="round"
            className="dark:stroke-base-200"
          />
          {percentage > 0 && (
            <path
              d={describeGaugeArc(cx, cy, radius, 270, knobAngle)}
              fill="none"
              stroke={color}
              strokeWidth={GAUGE_STROKE_WIDTH}
              strokeLinecap="round"
            />
          )}
          <circle cx={knobPos.x} cy={knobPos.y} r={GAUGE_KNOB_RADIUS} fill={color} stroke="white" strokeWidth={2} />
        </svg>
        <div className="absolute inset-x-0 bottom-[18%] text-center pointer-events-none">
          <p className="font-display font-medium text-[16px] tracking-tight tabular-nums text-ink leading-tight">
            {value.toLocaleString()}
          </p>
          {unit && <p className="font-mono text-[9px] text-ink-4 uppercase leading-tight">{unit}</p>}
        </div>
      </div>
      <div className="flex justify-between text-[9px] text-black-secondary px-0.5 leading-tight">
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

function OutcomesDonut({
  segments,
  size = DONUT_SIZE,
  disabled = false,
}: {
  segments: OutcomeSegment[];
  size?: number;
  disabled?: boolean;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size / 2 - 1;
  const innerRadius = outerRadius * 0.6;

  if (disabled) {
    const ringRadius = (outerRadius + innerRadius) / 2;
    const ringWidth = outerRadius - innerRadius;

    return (
      <svg width={size} height={size} className="flex-shrink-0" aria-hidden="true">
        <circle
          cx={cx}
          cy={cy}
          r={ringRadius}
          fill="none"
          stroke="#EEEEEE"
          strokeWidth={ringWidth}
          className="dark:stroke-base-200"
        />
      </svg>
    );
  }

  const totalPadAngle = segments.length * DONUT_PAD_ANGLE;
  const availableAngle = 360 - totalPadAngle;
  let currentAngle = 0;

  return (
    <svg width={size} height={size} className="flex-shrink-0" aria-hidden="true">
      {segments.map((segment) => {
        const segmentAngle = (segment.percent / 100) * availableAngle;
        const startAngle = currentAngle;
        const endAngle = currentAngle + segmentAngle;
        currentAngle = endAngle + DONUT_PAD_ANGLE;

        return (
          <path
            key={segment.key}
            d={describeDonutSegment(cx, cy, outerRadius, innerRadius, startAngle, endAngle)}
            fill={segment.color}
          />
        );
      })}
    </svg>
  );
}

export function OutcomesInfo({
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
  const hasUsableOdds = sumVisibleOdds > 0;

  if (odds.length === 0) {
    if (marketType === MarketTypes.SCALAR) {
      return <ScalarGaugeShimmer />;
    }
    return (
      <div className="flex items-center gap-3 w-full">
        <div className="shimmer-container w-[56px] h-[56px] rounded-full flex-shrink-0" />
        <div className="flex flex-col gap-1 flex-1">
          <div className="shimmer-container h-[12px] rounded-[4px] w-full" />
          <div className="shimmer-container h-[12px] rounded-[4px] w-4/5" />
          <div className="shimmer-container h-[12px] rounded-[4px] w-3/5" />
        </div>
      </div>
    );
  }

  const [lowerBound, upperBound] = [displayScalarBound(market.lowerBound), displayScalarBound(market.upperBound)];

  if (marketType === MarketTypes.SCALAR) {
    const marketEstimate = Number(getMarketEstimate(odds, market));
    if (Number.isNaN(marketEstimate)) {
      return null;
    }
    const unit = getMarketUnit(market);
    return <ScalarGauge value={marketEstimate} min={lowerBound} max={upperBound} unit={unit || undefined} />;
  }
  const segments = visibleIndexes.reduce<OutcomeSegment[]>((acc, i, order) => {
    const outcome = market.outcomes[i];
    const originalIndex = market.wrappedTokens.findIndex((x) => market.wrappedTokens[i] === x);
    const color = getOutcomeColor(marketType, order, originalIndex, visibleOutcomesCount);

    if (!hasUsableOdds) {
      acc.push({ outcome, color, percent: 0, key: `${outcome}_${i}` });
      return acc;
    }

    if (!isOdd(odds[i])) {
      return acc;
    }
    const percent = (odds[i] / sumVisibleOdds) * 100;
    acc.push({ outcome, color, percent, key: `${outcome}_${i}` });
    return acc;
  }, []);

  if (segments.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 w-full">
      <OutcomesDonut segments={segments} disabled={!hasUsableOdds} />
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        {segments.map((segment) => (
          <div className="flex items-center gap-1.5 text-[12px] min-w-0" key={segment.key}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: segment.color }} />
            <span className="truncate text-ink-3 font-medium flex-1" title={segment.outcome}>
              {segment.outcome}
            </span>
            <span className="font-mono font-semibold tabular-nums text-ink flex-shrink-0">
              {formatOutcomePercent(segment.percent)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const { data: parentCollateral } = useTokenInfo(
    parentMarket?.wrappedTokens?.[Number(market.parentOutcome)],
    market.chainId,
  );
  const marketType = getMarketType(market);
  const colors = marketStatus && COLORS[marketStatus];
  const challengeRemainingTime = useMemo(() => getChallengeRemainingTime(market), [market.verification?.status]);
  const blockExplorerUrl = SUPPORTED_CHAINS?.[market.chainId]?.blockExplorers?.default?.url;
  const hasBalance = market.poolBalance.some(
    (pool) => (pool?.token0?.balance ?? 0) > 0.01 || (pool?.token1.balance ?? 0) > 0.01,
  );
  return (
    <div
      className={clsx(
        "card-box text-left flex flex-col transition-all duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)] hover:-translate-y-px",
        market.id === "0x000" ? "pointer-events-none" : "",
      )}
    >
      <div className="min-h-[100px] @container px-4 pt-3">
        <div className="flex space-x-3">
          <Link to={paths.market(market)} className="flex-shrink-0">
            {market.images?.market ? (
              <img
                src={market.images.market}
                alt={market.marketName}
                className="aspect-square rounded-full @[340px]:w-[38px] @[315px]:w-[35px] w-[32px]"
              />
            ) : (
              <div className="aspect-square rounded-full bg-purple-primary w-[38px]"></div>
            )}
          </Link>
          <div className="grow min-w-0">
            <Link
              title={market.marketName}
              className="hover:text-blue transition-colors font-display font-medium tracking-tight @[340px]:text-[15px] @[315px]:text-[14px] text-[13px] leading-snug line-clamp-3"
              to={paths.market(market)}
            >
              {market.marketName}
            </Link>
          </div>
        </div>
        <div className="card-tags mt-2">
          <span className="type-tag">{MARKET_TYPES_TEXTS[marketType]}</span>
          {market.incentive > 0 && <span className="card-reward">{incentive} SEER/day</span>}
        </div>
      </div>

      <div className="px-4 h-[90px] overflow-y-auto custom-scrollbar">
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

      <div className="border-t border-[var(--border-2)] px-[16px] h-[44px] flex items-center justify-between w-full">
        <span className="flex items-center gap-2.5 min-w-0">
          <SeerLogo fill="currentColor" className="text-ink-4 shrink-0" width="46px" />
          {hasBalance || Number(formatUnits(market.outcomesSupply, 18)) > 0.01 ? (
            <Popover
              trigger={
                <p className="font-display text-[14px] tabular-nums text-ink font-medium tracking-tight">
                  $
                  {market.liquidityUSD > 0
                    ? liquidityUSD
                    : hasBalance || Number(formatUnits(market.outcomesSupply, 18)) > 0.01
                      ? "?"
                      : "0.00"}
                </p>
              }
              content={
                <div className="overflow-y-auto max-h-[300px] max-w-[400px] text-[12px]">
                  <p className="text-purple-primary">Open interest:</p>
                  <p className="mx-1">
                    {displayBalance(market.outcomesSupply, 18, true)}{" "}
                    {parentMarket
                      ? (parentCollateral?.symbol ?? "")
                      : getActivePrimaryCollateral(market.chainId).symbol}{" "}
                    ({displayNumber(market.openInterestUSD, undefined, true)} $)
                  </p>
                  <p className="text-purple-primary">Liquidity:</p>
                  <PoolTokensInfo market={market} marketStatus={marketStatus} type={"preview"} />
                </div>
              }
            />
          ) : (
            <p className="font-display text-[14px] tabular-nums text-ink font-medium tracking-tight">${liquidityUSD}</p>
          )}
        </span>
        <div className="flex items-center gap-2 text-ink-4">
          {parentMarket && (
            <div className="tooltip !flex">
              <div className="tooltiptext !text-left w-[300px] max-sm:w-[220px] !whitespace-pre-wrap">
                <p className="text-purple-primary">Conditional Market:</p>
                <p className="text-base-content/70">
                  Conditional on <span className="text-base-content">"{parentMarket.marketName}"</span> being{" "}
                  <span className="text-base-content">"{parentMarket.outcomes[Number(market.parentOutcome)]}"</span>
                </p>
              </div>
              <ConditionalMarketIcon fill="currentColor" />
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
          {!isUndefined(market.verification) && isVerificationEnabled(market.chainId) && (
            <Link
              className={clsx(
                "tooltip",
                market.verification.status === "verified" && "text-success-primary",
                market.verification.status === "verifying" && "text-blue-primary",
                market.verification.status === "challenged" && "text-warning-primary",
                market.verification.status === "not_verified" && "text-[#9747FF]",
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
                  <div className="tooltiptext">
                    <p>Verifying</p>
                    {challengeRemainingTime && <p>Ends in {challengeRemainingTime}</p>}
                  </div>
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

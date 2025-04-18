import { Link } from "@/components/Link";
import { Spinner } from "@/components/Spinner";
import { Market, useMarket } from "@/hooks/useMarket";
import useMarketHasLiquidity from "@/hooks/useMarketHasLiquidity.ts";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { MarketStatus, getMarketStatus } from "@/hooks/useMarketStatus";
import { useSortedOutcomes } from "@/hooks/useSortedOutcomes.ts";
import { useWinningOutcomes } from "@/hooks/useWinningOutcomes.ts";
import { SUPPORTED_CHAINS } from "@/lib/chains.ts";
import { NETWORK_ICON_MAPPING } from "@/lib/config.ts";
import {
  CheckCircleIcon,
  ClockIcon,
  ConditionalMarketIcon,
  ExclamationCircleIcon,
  EyeIcon,
  LawBalanceIcon,
  MyMarket,
  PresentIcon,
  QuestionIcon,
  SeerLogo,
  USDIcon,
} from "@/lib/icons";
import {
  MarketTypes,
  getCollateralByIndex,
  getMarketEstimate,
  getMarketPoolsPairs,
  getMarketType,
  isOdd,
} from "@/lib/market";
import { paths } from "@/lib/paths";
import { INVALID_RESULT_OUTCOME_TEXT, formatBigNumbers, getTimeLeft, isUndefined } from "@/lib/utils";
import clsx from "clsx";
import { useState } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { DisplayOdds } from "../DisplayOdds.tsx";
import { MARKET_TYPES_ICONS } from "./Icons.tsx";
import MarketFavorite from "./MarketFavorite";
import { MarketInfo } from "./MarketInfo";
import { COLORS, MARKET_TYPES_TEXTS, STATUS_TEXTS } from "./index.ts";

interface MarketHeaderProps {
  market: Market;
  images?: { market: string; outcomes: string[] };
  type?: "default" | "preview" | "small";
  outcomesCount?: number;
}

const BAR_COLOR = {
  [MarketTypes.CATEGORICAL]: ["#13C0CB", "#FF458C"],
  [MarketTypes.MULTI_CATEGORICAL]: ["#9747FF", "#24CDFE", "#13C0CB"],
  [MarketTypes.SCALAR]: ["#FF458C", "#13C0CB"],
  [MarketTypes.MULTI_SCALAR]: ["#9747FF", "#24CDFE", "#13C0CB"],
};

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

  const { data: winningOutcomes } = useWinningOutcomes(market.conditionId as Address, market.chainId, marketStatus);
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
  if (marketType === MarketTypes.SCALAR) {
    const marketEstimate = Number(getMarketEstimate(odds, market));
    if (Number.isNaN(marketEstimate)) {
      return null;
    }
    const percentage =
      ((marketEstimate - Number(market.lowerBound)) / (Number(market.upperBound) - Number(market.lowerBound))) * 100;
    return (
      <div className="text-[12px] text-purple-primary">
        <p className="italic text-black-secondary mb-3">Estimate</p>
        <div className="relative">
          <input
            type="range"
            min={Number(market.lowerBound)}
            max={Number(market.upperBound)}
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
              left: `calc(max(0px, min(${percentage}% - ${3.2 * marketEstimate.toLocaleString().length}px, 100% - ${
                6 * marketEstimate.toLocaleString().length
              }px)))`,
            }}
          >
            {marketEstimate.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p>{Number(market.lowerBound).toLocaleString()}</p>
          <p>{Number(market.upperBound).toLocaleString()}</p>
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
      <div className={clsx("flex items-center gap-x-3 flex-wrap", visibleOutcomesCount === 2 ? "justify-between" : "")}>
        {visibleIndexes.map((i, order) => {
          const outcome = market.outcomes[i];
          const originalIndex = market.wrappedTokens.findIndex((x) => market.wrappedTokens[i] === x);
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
            <p className={clsx("text-[12px]")} key={`${outcome}_${i}`} style={{ color }}>
              {outcome} <DisplayOdds odd={odds[i]} marketType={getMarketType(market)} />
            </p>
          );
        })}
      </div>
    </div>
  );
}

type PoolTokensInfo = {
  outcome: string;
  token0: { symbol: string; balance: number };
  token1: { symbol: string; balance: number };
}[];

function PoolTokensInfo({
  market,
  marketStatus,
  type,
}: {
  market: Market;
  marketStatus: MarketStatus;
  type: "default" | "preview" | "small";
}) {
  const { data: odds = [] } = useMarketOdds(market, type === "default");
  const { data: indexesOrderedByOdds } = useSortedOutcomes(odds, market, marketStatus);

  const poolsPairs = getMarketPoolsPairs(market);
  const poolTokensInfo: PoolTokensInfo = poolsPairs.reduce((tokensInfo, _, j) => {
    const i = indexesOrderedByOdds ? indexesOrderedByOdds[j] : j;
    const tokenBalanceInfo = market.poolBalance[i];
    if (!tokenBalanceInfo) {
      return tokensInfo;
    }
    const poolPair = poolsPairs[i];

    if (market.type === "Futarchy") {
      // futarchy markets have 2 pools (YES and NO)
      tokensInfo.push({
        outcome: i === 0 ? "Yes" : "No",
        ...tokenBalanceInfo,
      });
      return tokensInfo;
    }

    // generic markets have one pool for each outcome
    const collateral = getCollateralByIndex(market, i);

    const [token0, token1] =
      collateral === poolPair.token0
        ? [tokenBalanceInfo.token1, tokenBalanceInfo.token0]
        : [tokenBalanceInfo.token0, tokenBalanceInfo.token1];

    tokensInfo.push({
      outcome: market.outcomes[i],
      token0: token0,
      token1: token1,
    });
    return tokensInfo;
  }, [] as PoolTokensInfo);

  return (
    <ul className="list-decimal mx-4">
      {poolTokensInfo.map((pti) => (
        <li key={pti.outcome}>
          {pti.outcome}: {formatBigNumbers(pti.token0.balance)} {pti.token0.symbol} /{" "}
          {formatBigNumbers(pti.token1.balance)} {pti.token1.symbol}
        </li>
      ))}
    </ul>
  );
}

function MarketHeaderPreview({ market, images, outcomesCount = 0 }: MarketHeaderProps) {
  const marketStatus = getMarketStatus(market);
  const liquidityUSD = formatBigNumbers(market.liquidityUSD);
  const incentive = formatBigNumbers(market.incentive);
  const { data: parentMarket } = useMarket(market.parentMarket.id, market.chainId);
  const [showMarketInfo, setShowMarketInfo] = useState(false);
  const marketType = getMarketType(market);
  const colors = marketStatus && COLORS[marketStatus];

  const firstQuestion = market.questions[0];

  const blockExplorerUrl = SUPPORTED_CHAINS?.[market.chainId]?.blockExplorers?.default?.url;

  return (
    <div
      className={clsx(
        "bg-white rounded-[3px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] text-left flex flex-col",
        market.id === "0x000" ? "pointer-events-none" : "",
      )}
    >
      <div className="h-[100px] overflow-y-auto custom-scrollbar">
        <div className={clsx("flex space-x-3 p-[16px]", market.questions.length > 1 && "pb-[16px]")}>
          <Link to={paths.market(market)}>
            {images?.market ? (
              <img
                src={images.market}
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
            {market.questions.length === 1 || marketStatus === MarketStatus.NOT_OPEN ? (
              <MarketInfo market={market} marketStatus={marketStatus} isPreview />
            ) : (
              <>
                <div className={clsx("flex space-x-2 items-center text-[12px]")}>
                  {marketType === MarketTypes.MULTI_SCALAR && firstQuestion.finalize_ts > 0 && (
                    <div className="text-black-secondary">Deadline: {getTimeLeft(firstQuestion.finalize_ts)}</div>
                  )}
                </div>
                <div className={clsx("flex space-x-2 items-center text-[12px]")}>
                  <EyeIcon />{" "}
                  <span
                    className="text-purple-primary cursor-pointer"
                    onClick={() => setShowMarketInfo(!showMarketInfo)}
                  >
                    {showMarketInfo ? "Hide questions" : "Show questions"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {market.questions.length > 1 && marketStatus !== MarketStatus.NOT_OPEN && showMarketInfo && (
          <div className="px-[24px] pb-[16px]">
            <MarketInfo market={market} marketStatus={marketStatus} isPreview />
          </div>
        )}
      </div>

      <div className="p-4 h-[100px] overflow-y-auto custom-scrollbar">
        <OutcomesInfo
          market={market}
          outcomesCount={outcomesCount}
          images={images?.outcomes}
          marketStatus={marketStatus}
        />
      </div>
      <div className="border-t border-black-medium px-[16px] h-[36px] flex items-center justify-between w-full">
        <SeerLogo fill="#511778" width="50px" />
        <div className="flex items-center gap-2">
          <div className="tooltip">
            {market.liquidityUSD > 0 && (
              <div className="tooltiptext !text-left min-w-[300px]">
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
          {parentMarket && (
            <div className="tooltip">
              <div className="tooltiptext !text-left w-[300px] !whitespace-pre-wrap">
                <p className="text-purple-primary">Conditional Market:</p>
                <p className="text-black-secondary">
                  Conditional on <span className="text-black-primary">"{parentMarket.marketName}"</span> being{" "}
                  <span className="text-black-primary">"{parentMarket.outcomes[Number(market.parentOutcome)]}"</span>
                </p>
              </div>
              <ConditionalMarketIcon />
            </div>
          )}
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

export function MarketHeader({ market, images, type = "default", outcomesCount = 0 }: MarketHeaderProps) {
  const { address } = useAccount();
  const { data: parentMarket } = useMarket(market.parentMarket.id, market.chainId);
  const marketStatus = getMarketStatus(market);
  const liquidityUSD = formatBigNumbers(market.liquidityUSD);
  const incentive = formatBigNumbers(market.incentive);

  const [showMarketInfo, setShowMarketInfo] = useState(type === "default");
  const marketType = getMarketType(market);
  const colors = marketStatus && COLORS[marketStatus];

  const { data: odds = [] } = useMarketOdds(market, type === "default");
  const hasLiquidity = useMarketHasLiquidity(market);
  const marketEstimate = getMarketEstimate(odds, market, true);
  const firstQuestion = market.questions[0];

  const blockExplorerUrl = SUPPORTED_CHAINS?.[market.chainId]?.blockExplorers?.default?.url;
  if (type === "preview") {
    return <MarketHeaderPreview market={market} images={images} outcomesCount={outcomesCount} />;
  }
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

            <div className="tooltip">
              <p className="tooltiptext">View contract on explorer</p>
              <a
                href={blockExplorerUrl && `${blockExplorerUrl}/address/${market.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img alt="network-icon" className="w-5 h-5 rounded-full" src={NETWORK_ICON_MAPPING[market.chainId]} />
              </a>
            </div>
            {market.id !== "0x000" && <MarketFavorite market={market} colorClassName={colors?.text} />}
          </div>
        </div>
        <div>{market.index && `#${market.index}`}</div>
      </div>

      <div className={clsx("flex space-x-3 p-[24px]", market.questions.length > 1 && "pb-[16px]")}>
        <div>
          {type === "default" && (
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
          )}
          {type !== "default" && (
            <Link to={paths.market(market)}>
              {images?.market ? (
                <img
                  src={images.market}
                  alt={market.marketName}
                  className="w-[65px] h-[65px] min-w-[65px] min-h-[65px] rounded-full"
                />
              ) : (
                <div className="w-[65px] h-[65px] rounded-full bg-purple-primary"></div>
              )}
            </Link>
          )}
        </div>
        <div className="grow min-w-0">
          <div className={clsx("font-semibold mb-1 text-[16px] break-words", type === "default" && "lg:text-[24px]")}>
            {type === "default" && market.marketName}
            {type !== "default" && (
              <Link className="hover:underline" to={paths.market(market)}>
                {market.marketName}
              </Link>
            )}
          </div>
          {parentMarket && type !== "default" && (
            <p className="text-[14px] my-2">
              Conditional on{" "}
              <Link to={paths.market(parentMarket)} target="_blank" className="text-purple-primary font-medium">
                "{parentMarket.marketName}"
              </Link>{" "}
              being{" "}
              <Link
                to={`${paths.market(parentMarket)}?outcome=${encodeURIComponent(
                  parentMarket.outcomes[Number(market.parentOutcome)],
                )}`}
                target="_blank"
                className="text-purple-primary font-medium"
              >
                "{parentMarket.outcomes[Number(market.parentOutcome)]}"
              </Link>
            </p>
          )}
          {market.questions.length === 1 || marketStatus === MarketStatus.NOT_OPEN ? (
            <MarketInfo market={market} marketStatus={marketStatus} isPreview={false} />
          ) : (
            <>
              <div className="flex space-x-2 items-center text-[14px]">
                {marketType === MarketTypes.MULTI_SCALAR && firstQuestion.finalize_ts > 0 && (
                  <div className="text-black-secondary">Deadline: {getTimeLeft(firstQuestion.finalize_ts)}</div>
                )}
              </div>
              <div className="flex space-x-2 items-center text-[14px]">
                <EyeIcon />{" "}
                <span className="text-purple-primary cursor-pointer" onClick={() => setShowMarketInfo(!showMarketInfo)}>
                  {showMarketInfo ? "Hide questions" : "Show questions"}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {market.questions.length > 1 && marketStatus !== MarketStatus.NOT_OPEN && showMarketInfo && (
        <div className="px-[24px] pb-[16px]">
          <MarketInfo market={market} marketStatus={marketStatus} isPreview={false} />
        </div>
      )}
      {marketType === MarketTypes.SCALAR && market.id !== "0x000" && marketEstimate !== "NA" && (
        <div className="border-t border-black-medium py-[16px] px-[24px] font-semibold flex items-center gap-2">
          <div className="flex items-center gap-2">
            Market Estimate: {odds.length === 0 ? <Spinner /> : marketEstimate}
          </div>
          {odds.length > 0 && (
            <span className="tooltip">
              <p className="tooltiptext !whitespace-pre-wrap w-auto lg:w-[250px] md:w-[400px] ">
                The market's predicted result based on the current distribution of "UP" and "DOWN" tokens
              </p>
              <QuestionIcon fill="#9747FF" />
            </span>
          )}
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
            <div className="!flex items-center tooltip">
              <p className="tooltiptext @[510px]:hidden">Liquidity</p>
              <span className="text-black-secondary @[510px]:inline-block hidden">Liquidity:</span>
              <span className="ml-1">{liquidityUSD}</span>
              <USDIcon />
              {market.liquidityUSD > 0 && (
                <div className="tooltip">
                  <div className="tooltiptext !text-left min-w-[300px]">
                    <PoolTokensInfo market={market} marketStatus={marketStatus} type={type} />
                  </div>
                  <QuestionIcon fill="#9747FF" />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {market.incentive > 0 && (
              <div className="tooltip">
                <p className="tooltiptext">Reward: {incentive} SEER/day</p>
                <PresentIcon width="16px" />
              </div>
            )}
            {!isUndefined(market.verification) && (
              <Link
                className={clsx(
                  "flex items-center space-x-2",
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
                    <div className="max-lg:hidden">Verified</div>
                  </>
                )}
                {market.verification.status === "verifying" && (
                  <>
                    <ClockIcon />
                    <div className="max-lg:hidden">Verifying</div>
                  </>
                )}
                {market.verification.status === "challenged" && (
                  <>
                    <LawBalanceIcon />
                    <div className="max-lg:hidden">Challenged</div>
                  </>
                )}
                {market.verification.status === "not_verified" && (
                  <>
                    <ExclamationCircleIcon width="14" height="14" />
                    <div className="max-lg:hidden">Verify it</div>
                  </>
                )}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

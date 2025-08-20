import { Link } from "@/components/Link";
import { Spinner } from "@/components/Spinner";
import { useMarket } from "@/hooks/useMarket";
import useMarketHasLiquidity from "@/hooks/useMarketHasLiquidity.ts";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { useSortedOutcomes } from "@/hooks/useSortedOutcomes.ts";
import { useWinningOutcomes } from "@/hooks/useWinningOutcomes.ts";
import { SUPPORTED_CHAINS } from "@/lib/chains.ts";
import { NETWORK_ICON_MAPPING } from "@/lib/config.ts";
import { getTimeLeft } from "@/lib/date.ts";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  EyeIcon,
  LawBalanceIcon,
  MyMarket,
  PresentIcon,
  QuestionIcon,
  SeerLogo,
  USDIcon,
} from "@/lib/icons";
import { getMarketStatus } from "@/lib/market";
import { MarketTypes, getCollateralByIndex, getMarketPoolsPairs, getMarketType } from "@/lib/market";
import { getMarketEstimate } from "@/lib/market-odds.ts";
import { MarketStatus } from "@/lib/market.ts";
import { Market } from "@/lib/market.ts";
import { paths } from "@/lib/paths";
import { displayScalarBound } from "@/lib/reality.ts";
import { INVALID_RESULT_OUTCOME_TEXT, formatBigNumbers, isUndefined } from "@/lib/utils";
import clsx from "clsx";
import { formatDistanceStrict } from "date-fns";
import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { DisplayOdds } from "../DisplayOdds.tsx";
import { OutcomeImage } from "../OutcomeImage.tsx";
import { MARKET_TYPES_ICONS } from "./Icons.tsx";
import MarketFavorite from "./MarketFavorite";
import { MarketInfo } from "./MarketInfo";
import { COLORS, MARKET_TYPES_DESCRIPTION, MARKET_TYPES_TEXTS, STATUS_TEXTS } from "./index.ts";

interface MarketHeaderProps {
  market: Market;
  images?: { market: string; outcomes: string[] };
  type?: "default" | "preview" | "small";
  outcomesCount?: number;
}

function OutcomesInfo({
  market,
  outcomesCount = 0,
  images = [],
  marketStatus,
}: { market: Market; outcomesCount?: number; images?: string[]; marketStatus?: MarketStatus }) {
  const visibleOutcomesLimit = outcomesCount && outcomesCount > 0 ? outcomesCount : market.outcomes.length - 1;

  const { data: odds = [] } = useMarketOdds(market, false);

  const { data: winningOutcomes } = useWinningOutcomes(market, marketStatus);
  const { data: indexesOrderedByOdds } = useSortedOutcomes(odds, market, marketStatus);

  return (
    <div>
      <div className={clsx("space-y-3")}>
        {(market.type === "Generic" ? market.outcomes : ["Yes", "No"]).map((futarchyOutcome, j) => {
          const i = indexesOrderedByOdds ? indexesOrderedByOdds[j] : j;
          const outcome = market.type === "Futarchy" ? futarchyOutcome : market.outcomes[i];

          if (j >= visibleOutcomesLimit) {
            // render the first `visibleOutcomesLimit` outcomes
            return null;
          }

          if (
            outcome === INVALID_RESULT_OUTCOME_TEXT &&
            (marketStatus !== MarketStatus.CLOSED ||
              (marketStatus === MarketStatus.CLOSED && winningOutcomes?.[i] !== true))
          ) {
            return null;
          }
          return (
            <Link
              key={`${outcome}_${i}`}
              className={clsx("flex justify-between px-[24px] py-[8px] hover:bg-gray-light cursor-pointer group")}
              to={`${paths.market(market)}?outcome=${encodeURIComponent(outcome)}`}
            >
              <div className="flex items-center space-x-[12px]">
                <div className="w-[65px] flex-shrink-0">
                  <OutcomeImage
                    image={images?.[i]}
                    isInvalidOutcome={i === market.outcomes.length - 1}
                    title={outcome}
                  />
                </div>
                <div className="space-y-1">
                  <div className="group-hover:underline flex items-center gap-2">
                    #{j + 1} {outcome}{" "}
                    {i <= 1 &&
                      getMarketType(market) === MarketTypes.SCALAR &&
                      `[${displayScalarBound(market.lowerBound)},${displayScalarBound(market.upperBound)}]`}
                    {winningOutcomes?.[i] === true && <CheckCircleIcon className="text-success-primary" />}
                  </div>

                  {/*<div className="text-[12px] text-black-secondary">xM DAI</div>*/}
                </div>
              </div>
              {market.type === "Generic" && market.id !== "0x000" && (
                <div className="flex space-x-10 items-center">
                  <div className="text-[24px] font-semibold">
                    {odds.length === 0 ? <Spinner /> : <DisplayOdds odd={odds[i]} marketType={getMarketType(market)} />}
                  </div>
                </div>
              )}
            </Link>
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

export function PoolTokensInfo({
  market,
  marketStatus,
  type,
}: { market: Market; marketStatus: MarketStatus; type: "default" | "preview" | "small" }) {
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

  const challengeRemainingTime = useMemo(() => {
    if (
      !isUndefined(market.verification) &&
      market.verification.status === "verifying" &&
      market.verification.deadline
    ) {
      const now = Date.now();
      if (market.verification.deadline * 1000 < now) {
        return;
      }
      return formatDistanceStrict(market.verification.deadline * 1000, now);
    }
  }, [market.verification?.status]);

  const blockExplorerUrl = SUPPORTED_CHAINS?.[market.chainId]?.blockExplorers?.default?.url;

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
                to={`${paths.market(parentMarket)}?outcome=${encodeURIComponent(parentMarket.outcomes[Number(market.parentOutcome)])}`}
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

      {type === "preview" && (
        <div className="border-t border-black-medium py-[16px]">
          <OutcomesInfo
            market={market}
            outcomesCount={outcomesCount}
            images={images?.outcomes}
            marketStatus={marketStatus}
          />
        </div>
      )}

      {type !== "small" && (
        <div className="border-t border-black-medium px-[25px] h-[45px] flex items-center justify-between text-[14px] mt-auto @container">
          <div className="flex items-center gap-4">
            <SeerLogo fill="#511778" width="50px" height="100%" />
            <div className="tooltip">
              <p className="tooltiptext !text-left min-w-[250px] !whitespace-pre-wrap">
                {MARKET_TYPES_DESCRIPTION[marketType]}
              </p>
              <div className="flex items-center gap-2">
                <div>{MARKET_TYPES_ICONS[marketType]}</div>
                <div>{MARKET_TYPES_TEXTS[marketType]}</div>
              </div>
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
                <p className="tooltiptext">
                  Reward: <span className="text-purple-primary">{incentive} SEER/day</span>
                </p>
                <PresentIcon width="16px" />
              </div>
            )}
            {!isUndefined(market.verification) && (
              <Link
                className={clsx(
                  "!flex items-center space-x-2",
                  market.verification.status === "verified" && "text-success-primary",
                  market.verification.status === "verifying" && "text-blue-primary tooltip",
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
                    <div>Verified</div>
                  </>
                )}
                {market.verification.status === "verifying" && (
                  <>
                    <ClockIcon />
                    <div>Verifying</div>
                    {challengeRemainingTime && <p className="tooltiptext">Ends in {challengeRemainingTime}</p>}
                  </>
                )}
                {market.verification.status === "challenged" && (
                  <>
                    <LawBalanceIcon />
                    <div>Challenged</div>
                  </>
                )}
                {market.verification.status === "not_verified" && (
                  <>
                    <ExclamationCircleIcon width="14" height="14" />
                    <div>Verify it</div>
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

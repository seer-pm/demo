import { Spinner } from "@/components/Spinner";
import { useConvertToAssets } from "@/hooks/trade/handleSDAI";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Market, useMarket } from "@/hooks/useMarket";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { MarketStatus, useMarketStatus } from "@/hooks/useMarketStatus";
import { useTokenInfo } from "@/hooks/useTokenInfo.ts";
import { VerificationStatusResult } from "@/hooks/useVerificationStatus";
import { SupportedChain } from "@/lib/chains";
import { NETWORK_ICON_MAPPING } from "@/lib/config.ts";
import {
  CheckCircleIcon,
  ClockIcon,
  DaiLogo,
  ExclamationCircleIcon,
  EyeIcon,
  LawBalanceIcon,
  MyMarket,
  QuestionIcon,
  SeerLogo,
} from "@/lib/icons";
import { MarketTypes, formatOdds, getMarketType } from "@/lib/market";
import { paths } from "@/lib/paths";
import { INVALID_RESULT_OUTCOME_TEXT, displayBalance, isUndefined, toSnakeCase } from "@/lib/utils";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { gnosis } from "viem/chains";
import { useAccount } from "wagmi";
import { OutcomeImage } from "../OutcomeImage";
import MarketFavorite from "./MarketFavorite";
import { MarketInfo } from "./MarketInfo";
import { COLORS, MARKET_TYPES_ICONS, MARKET_TYPES_TEXTS, STATUS_TEXTS } from "./index.tsx";

interface MarketHeaderProps {
  market: Market & { creator?: string };
  images?: { market: string; outcomes: string[] };
  type?: "default" | "preview" | "small";
  outcomesCount?: number;
  verificationStatusResult?: VerificationStatusResult;
}

function OutcomesInfo({
  market,
  chainId,
  outcomesCount = 0,
  images = [],
}: {
  market: Market;
  chainId: SupportedChain;
  outcomesCount?: number;
  images?: string[];
}) {
  const visibleOutcomesLimit = outcomesCount && outcomesCount > 0 ? outcomesCount : market.outcomes.length - 1;
  const { isIntersecting, ref } = useIntersectionObserver({
    threshold: 0.5,
  });
  const { data: odds = [], isLoading: oddsPending } = useMarketOdds(market, isIntersecting);

  const indexesOrderedByOdds = useMemo(() => {
    if (oddsPending || odds.length === 0) {
      return null;
    }
    const oddsAndIndexes = odds.map((odd, i) => ({ odd, i })).sort((a, b) => b.odd - a.odd);
    return oddsAndIndexes.map((obj) => obj.i);
  }, [odds]);

  return (
    <div ref={ref}>
      <div className="space-y-3">
        {market.outcomes.map((_, j) => {
          const i = indexesOrderedByOdds ? indexesOrderedByOdds[j] : j;
          const outcome = market.outcomes[i];

          if (j >= visibleOutcomesLimit) {
            // render the first `visibleOutcomesLimit` outcomes
            return null;
          }
          if (outcome === INVALID_RESULT_OUTCOME_TEXT) {
            return null;
          }
          return (
            <Link
              key={`${outcome}_${i}`}
              className={clsx("flex justify-between px-[24px] py-[8px] hover:bg-gray-light cursor-pointer group")}
              to={`${paths.market(market.id, chainId)}?outcome=${toSnakeCase(outcome)}`}
            >
              <div className="flex items-center space-x-[12px]">
                <div className="w-[65px]">
                  <OutcomeImage
                    image={images?.[i]}
                    isInvalidResult={i === market.outcomes.length - 1}
                    title={outcome}
                  />
                </div>
                <div className="space-y-1">
                  <div className="group-hover:underline">
                    #{j + 1} {market.outcomes[i]}{" "}
                    {i <= 1 &&
                      getMarketType(market) === MarketTypes.SCALAR &&
                      `[${Number(market.lowerBound)},${Number(market.upperBound)}]`}
                  </div>
                  {/*<div className="text-[12px] text-black-secondary">xM DAI</div>*/}
                </div>
              </div>
              <div className="flex space-x-10 items-center">
                <div className="text-[24px] font-semibold">
                  {oddsPending ? <Spinner /> : formatOdds(odds?.[i] || 0, getMarketType(market))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function MarketHeader({
  market,
  images,
  type = "default",
  outcomesCount = 0,
  verificationStatusResult,
}: MarketHeaderProps) {
  const chainId = market.chainId;
  const { address } = useAccount();
  const { data: parentMarket } = useMarket(market.parentMarket, chainId);
  const { data: marketStatus } = useMarketStatus(market, chainId);
  const { data: daiAmount } = useConvertToAssets(market.outcomesSupply, chainId);
  const { data: parentCollateral } = useTokenInfo(parentMarket?.wrappedTokens?.[Number(market.parentOutcome)], chainId);
  const [showMarketInfo, setShowMarketInfo] = useState(type === "default");
  const marketType = getMarketType(market);
  const colors = marketStatus && COLORS[marketStatus];

  const { data: odds = [], isLoading: isPendingOdds } = useMarketOdds(market, true);
  const hasLiquidity = isPendingOdds ? undefined : odds.some((v) => v > 0);
  const marketEstimate =
    ((odds[0] || 0) * Number(market.lowerBound) + (odds[1] || 0) * Number(market.upperBound)) / 100;
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

            <img alt="network-icon" className="w-5 h-5 rounded-full" src={NETWORK_ICON_MAPPING[chainId]} />
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
            <Link to={paths.market(market.id, chainId)}>
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
                to={`${paths.market(parentMarket.id, chainId)}?outcome=${toSnakeCase(
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
      {marketType === MarketTypes.SCALAR && market.id !== "0x000" && (
        <div className="border-t border-black-medium py-[16px] px-[24px] font-semibold flex items-center gap-2">
          <div className="flex items-center gap-2">Market Estimate: {isPendingOdds ? <Spinner /> : marketEstimate}</div>
          {!isPendingOdds && (
            <span className="tooltip">
              <p className="tooltiptext !whitespace-pre-wrap w-[250px] md:w[400px] ">
                The market's predicted result based on the current distribution of "UP" and "DOWN" tokens
              </p>
              <QuestionIcon fill="#9747FF" />
            </span>
          )}
        </div>
      )}
      {type === "preview" && (
        <div className="border-t border-black-medium py-[16px]">
          <OutcomesInfo market={market} chainId={chainId} outcomesCount={outcomesCount} images={images?.outcomes} />
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
                {!parentMarket && (
                  <>
                    {displayBalance(daiAmount, 18, true)} {chainId === gnosis.id ? "xDAI" : "DAI"}
                    <DaiLogo />
                  </>
                )}
                {parentMarket && (
                  <div>
                    {displayBalance(market.outcomesSupply, 18, true)} {parentCollateral?.symbol ?? ""}
                  </div>
                )}
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

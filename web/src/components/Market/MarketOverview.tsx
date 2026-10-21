import { Link } from "@/components/Link";
import { Spinner } from "@/components/Spinner";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { isVerificationEnabled } from "@/lib/config";
import { getChallengeRemainingTime } from "@/lib/date";
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon, LawBalanceIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { formatBigNumbers, isUndefined } from "@/lib/utils";
import { useMarketOdds, usePortfolioPnL } from "@seer-pm/react";
import {
  MARKET_TYPES_DESCRIPTION,
  type Market,
  MarketStatus,
  MarketTypes,
  STATUS_TEXTS,
  getMarketEstimate,
  getMarketStatus,
  getMarketType,
  getRealityLink,
} from "@seer-pm/sdk";
import clsx from "clsx";
import { useState } from "react";
import { type Address, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { DisplayOdds } from "./DisplayOdds";
import { MARKET_TYPES_ICONS } from "./Header/Icons";
import MarketFavorite from "./Header/MarketFavorite";
import MarketChart from "./MarketChart/MarketChart";
import {
  MARKET_SIGNAL_DESCRIPTIONS,
  MARKET_SIGNAL_LABELS,
  MARKET_STATUS_LABELS,
  formatResolutionDate,
  getResolutionOpening,
} from "./marketPresentation";

function MarketPnLMetric({ account, market }: { account: Address; market: Market }) {
  const { data: marketPnL, isLoading } = usePortfolioPnL(account, market.chainId, "all", market.id);
  // A failed compute still answers 200 with zeros, so `marketPnL` alone does not mean there is a
  // number to show. `computed` is what separates a real 0 from one that stands in for nothing.
  const measured = marketPnL && marketPnL.computed !== false ? marketPnL : undefined;
  const sign = !measured || measured.pnl === 0 ? "flat" : measured.pnl > 0 ? "up" : "down";
  return (
    <span className="event-metric-pnl" data-sign={sign}>
      <small>Your P&amp;L</small>
      <strong>
        {isLoading ? (
          <Spinner className="loading-xs" />
        ) : measured ? (
          `${sign === "down" ? "-" : sign === "up" ? "+" : ""}$${formatBigNumbers(Math.abs(measured.pnl))}`
        ) : (
          "N/A"
        )}
      </strong>
    </span>
  );
}

function VerificationMetric({ market }: { market: Market }) {
  const verification = market.verification;
  if (isUndefined(verification) || !isVerificationEnabled(market.chainId)) return null;
  const { status } = verification;
  const challengeRemainingTime = getChallengeRemainingTime(market);
  const label =
    status === "verified"
      ? "Verified"
      : status === "verifying"
        ? "Verifying"
        : status === "challenged"
          ? "Challenged"
          : "Verify it";
  const icon =
    status === "verified" ? (
      <CheckCircleIcon width={12} height={12} />
    ) : status === "verifying" ? (
      <ClockIcon width={12} height={12} />
    ) : status === "challenged" ? (
      <LawBalanceIcon width="12" />
    ) : (
      <ExclamationCircleIcon width={12} height={12} />
    );
  // An unverified market links to the in-app verification flow; the other states open the Curate
  // registry entry that holds the request, in a new tab.
  const linkProps =
    status === "not_verified"
      ? { to: paths.verifyMarket(market.id, market.chainId) }
      : {
          to: paths.curateVerifiedList(market.chainId, verification.itemID),
          target: "_blank",
          rel: "noopener noreferrer",
        };
  return (
    <span className="event-metric-verification" data-status={status}>
      <Link
        {...linkProps}
        title={status === "verifying" && challengeRemainingTime ? `Ends in ${challengeRemainingTime}` : undefined}
      >
        <strong
          className={clsx(
            status === "verified" && "text-signed-up",
            status === "verifying" && "seer-status-information",
            status === "challenged" && "seer-status-warning",
            status === "not_verified" && "text-purple-primary",
          )}
        >
          {icon}
          {label}
        </strong>
        {status !== "not_verified" && <span aria-hidden="true">↗</span>}
      </Link>
    </span>
  );
}

export function MarketOverview({ market, selected }: { market: Market; selected: number }) {
  const { data: odds = [] } = useMarketOdds(market, true);
  const { address: account } = useAccount();
  const [chartFocus, setChartFocus] = useState(false);
  const status = getMarketStatus(market);
  const marketType = getMarketType(market);
  const chain = SUPPORTED_CHAINS[market.chainId];
  const explorerUrl = chain?.blockExplorers?.default?.url;
  const resolutionOpening = getResolutionOpening(market);
  const creator = market.creator && market.creator.toLowerCase() !== zeroAddress ? market.creator : undefined;
  const estimate = marketType === MarketTypes.SCALAR ? getMarketEstimate(odds, market, true) : undefined;
  // P/L is keyed to the market a wallet traded on; a child market's trades settle through the parent
  // outcome token, so it has no standalone figure to show.
  const hasOwnPnL = market.parentMarket.id.toLowerCase() === zeroAddress;
  return (
    <section className="event-overview" aria-label="Event overview">
      <header className="event-heading">
        <div className="event-title-row">
          {market.images?.market && <img src={market.images.market} alt="" />}
          <h1>{market.marketName}</h1>
          <MarketFavorite market={market} iconWidth="20" />
        </div>
        <div className="event-status">
          {status === MarketStatus.NOT_OPEN
            ? STATUS_TEXTS[status](market.liquidityUSD > 0)
            : status
              ? MARKET_STATUS_LABELS[status]
              : "Market"}
        </div>
        <div className="event-metrics">
          <span>
            <small>Volume</small>
            <strong>${formatBigNumbers(market.volumeUSD)}</strong>
          </span>
          <span>
            <small>Liquidity</small>
            <strong>${formatBigNumbers(market.liquidityUSD)}</strong>
          </span>
          {account && hasOwnPnL && <MarketPnLMetric account={account} market={market} />}
          <span className="event-metric-type" title={MARKET_TYPES_DESCRIPTION[marketType]}>
            <small>Type</small>
            <strong>
              {MARKET_TYPES_ICONS[marketType]}
              {MARKET_SIGNAL_LABELS[marketType]}
            </strong>
          </span>
          <span>
            <small>Network</small>
            {explorerUrl ? (
              <a
                href={`${explorerUrl}/address/${market.id}`}
                target="_blank"
                rel="noopener noreferrer"
                title="View the market contract on the block explorer"
              >
                <strong>{chain.name}</strong>
                <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <strong>{chain?.name}</strong>
            )}
          </span>
          <VerificationMetric market={market} />
          <a className="event-metrics-rules" href="#event-rules">
            Rules & settlement ↗
          </a>
        </div>
        <div className="event-provenance">
          {creator && (
            <span>
              Created by{" "}
              {explorerUrl ? (
                <a href={`${explorerUrl}/address/${creator}`} target="_blank" rel="noopener noreferrer" title={creator}>
                  {creator.slice(0, 6)}…{creator.slice(-4)}
                  <span className="sr-only"> (view creator on block explorer)</span>
                </a>
              ) : (
                <span title={creator}>
                  {creator.slice(0, 6)}…{creator.slice(-4)}
                </span>
              )}
            </span>
          )}
          <span>
            {resolutionOpening ? (
              <>
                Resolution opens{" "}
                <time dateTime={new Date(resolutionOpening * 1000).toISOString()}>
                  {formatResolutionDate(resolutionOpening)}
                </time>
              </>
            ) : (
              "Resolution dates vary by outcome"
            )}
          </span>
          {market.questions[0] && (
            <a href={getRealityLink(market.chainId, market.questions[0].id)} target="_blank" rel="noopener noreferrer">
              Resolution on Reality.eth ↗
            </a>
          )}
        </div>
      </header>
      <div className="event-chart-summary">
        <div>
          <span className="event-selected-label">Selected outcome</span>
          <h2>{market.outcomes[selected]}</h2>
        </div>
        <strong className="event-selected-odds">
          <DisplayOdds odd={odds[selected]} marketType={getMarketType(market)} />
        </strong>
      </div>
      <div className="event-chart-switch" aria-label="Chart scope">
        <button type="button" aria-pressed={!chartFocus} onClick={() => setChartFocus(false)}>
          Compare outcomes
        </button>
        <button type="button" aria-pressed={chartFocus} onClick={() => setChartFocus(true)}>
          Selected outcome
        </button>
      </div>
      <p className="event-signal-explanation">
        {estimate && estimate !== "NA" && (
          <>
            <strong>Market estimate: {estimate}.</strong>{" "}
          </>
        )}
        {MARKET_SIGNAL_DESCRIPTIONS[marketType]}
      </p>
      <MarketChart market={market} outcomeIndex={chartFocus ? selected : undefined} />
    </section>
  );
}

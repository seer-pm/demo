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
  isOdd,
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
  MARKET_PRICE_LABELS,
  MARKET_SIGNAL_LABELS,
  MARKET_STATUS_LABELS,
  type OutcomeSelectionSource,
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

/** The index of the outcome the market currently prices highest, or undefined while no price is reliable. */
function getLeadingIndex(odds: (number | null | undefined)[]): number | undefined {
  let leading: number | undefined;
  odds.forEach((odd, i) => {
    if (isOdd(odd) && (leading === undefined || odd > (odds[leading] as number))) leading = i;
  });
  return leading;
}

export function MarketOverview({
  market,
  selected,
  selectionSource,
}: {
  market: Market;
  selected: number;
  selectionSource: OutcomeSelectionSource;
}) {
  const { data: odds = [] } = useMarketOdds(market, true);
  const { address: account } = useAccount();
  const [chartFocus, setChartFocus] = useState(false);
  const status = getMarketStatus(market);
  const marketType = getMarketType(market);
  const chain = SUPPORTED_CHAINS[market.chainId];
  const explorerUrl = chain?.blockExplorers?.default?.url;
  const estimate = marketType === MarketTypes.SCALAR ? getMarketEstimate(odds, market, true) : undefined;
  // P/L is keyed to the market a wallet traded on; a child market's trades settle through the parent
  // outcome token, so it has no standalone figure to show.
  const hasOwnPnL = market.parentMarket.id.toLowerCase() === zeroAddress;
  // The caption says who chose the outcome on display. Until the visitor picks a row the page is
  // showing its own default, and calling that "selected" implies a choice the visitor never made.
  const captionLabel =
    selectionSource === "user"
      ? "Selected outcome"
      : getLeadingIndex(odds) === selected
        ? "Leading outcome"
        : "Default outcome";
  return (
    <section className="event-overview" aria-label="Event overview">
      <header className="event-heading">
        <div className="event-title-row">
          {market.images?.market && <img src={market.images.market} alt="" />}
          <h1>{market.marketName}</h1>
          <div className="event-title-favorite">
            <MarketFavorite market={market} iconWidth="20" />
          </div>
          <span className="event-status">
            {status === MarketStatus.NOT_OPEN
              ? STATUS_TEXTS[status](market.liquidityUSD > 0)
              : status
                ? MARKET_STATUS_LABELS[status]
                : "Market"}
          </span>
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
          <VerificationMetric market={market} />
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
          <a className="event-metrics-rules" href="#event-rules">
            Rules & settlement
          </a>
        </div>
      </header>
      <div className="event-signal">
        <div className="event-signal-caption">
          <div>
            <h2>{market.outcomes[selected]}</h2>
            <p className="event-summary-context">{captionLabel}</p>
          </div>
          <div className="event-odds-summary">
            <div className="event-selected-odds">
              <DisplayOdds odd={odds[selected]} marketType={marketType} />
            </div>
            <span>{MARKET_PRICE_LABELS[marketType]}</span>
          </div>
          <fieldset className="event-chart-switch">
            <legend className="sr-only">Chart scope</legend>
            <button type="button" aria-pressed={!chartFocus} onClick={() => setChartFocus(false)}>
              Compare outcomes
            </button>
            <button type="button" aria-pressed={chartFocus} onClick={() => setChartFocus(true)}>
              Selected outcome
            </button>
          </fieldset>
        </div>
        {estimate && estimate !== "NA" && (
          <p className="event-signal-explanation">
            <strong>Market estimate: {estimate}</strong>
          </p>
        )}
        <MarketChart market={market} outcomeIndex={chartFocus ? selected : undefined} />
      </div>
    </section>
  );
}

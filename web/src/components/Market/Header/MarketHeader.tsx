import { Link } from "@/components/Link";
import Popover from "@/components/Popover.tsx";
import { Spinner } from "@/components/Spinner";
import { useMarketEvents } from "@/hooks/useMarketEvents";
import { useSortedOutcomes } from "@/hooks/useSortedOutcomes.ts";
import { useWinningOutcomes } from "@/hooks/useWinningOutcomes.ts";
import { SUPPORTED_CHAINS } from "@/lib/chains.ts";
import { NETWORK_ICON_MAPPING, isVerificationEnabled } from "@/lib/config.ts";
import { getChallengeRemainingTime, getTimeLeft } from "@/lib/date.ts";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  EyeIcon,
  LawBalanceIcon,
  MyMarket,
  QuestionIcon,
  SeerLogo,
  USDIcon,
} from "@/lib/icons";
import { paths } from "@/lib/paths";
import { displayBalance, displayNumber, formatBigNumbers, isUndefined } from "@/lib/utils";
import { useMarket, useMarketHasLiquidity, useMarketOdds, usePortfolioPnL, useTokenInfo } from "@seer-pm/react";
import { getActivePrimaryCollateral } from "@seer-pm/sdk";
import {
  INVALID_RESULT_OUTCOME_TEXT,
  Market,
  MarketStatus,
  MarketTypes,
  SupportedChain,
  displayScalarBound,
  getCollateralByIndex,
  getMarketEstimate,
  getMarketPoolsPairs,
  getMarketStatus,
  getMarketType,
  getQuestionStatus,
  getRealityLink,
} from "@seer-pm/sdk";
import { MARKET_TYPES_DESCRIPTION, MARKET_TYPES_TEXTS, STATUS_TEXTS } from "@seer-pm/sdk";
import clsx from "clsx";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { type Address, formatUnits, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { DisplayOdds } from "../DisplayOdds.tsx";
import MarketCategories from "../MarketCategories.tsx";
import { OutcomeImage } from "../OutcomeImage.tsx";
import { MARKET_TYPES_ICONS } from "./Icons.tsx";
import MarketFavorite from "./MarketFavorite";
import { MarketInfo } from "./MarketInfo";
import { COLORS } from "./index.ts";

interface MarketHeaderProps {
  market: Market;
  images?: { market: string; outcomes: string[] };
  type?: "default" | "preview" | "small";
  outcomesCount?: number;
}

// Pill base for the hero meta tags (icons inherit the tag's text color).
const HERO_TAG =
  "inline-flex items-center gap-1.5 px-[10px] py-[5px] rounded-[8px] text-[12px] font-medium whitespace-nowrap [&_svg]:w-[11px] [&_svg]:h-[11px] [&_svg]:fill-current [&_svg_path]:fill-current";

const VERIFICATION_TAG: Record<string, { label: string; cls: string }> = {
  verified: { label: "Verified", cls: "text-success-primary bg-success-primary/10" },
  verifying: { label: "Verifying", cls: "text-blue-primary bg-blue-primary/10" },
  challenged: { label: "Challenged", cls: "text-warning-primary bg-warning-primary/10" },
  not_verified: { label: "Verify it", cls: "text-[#9747FF] bg-[#9747FF]/10" },
};

// Seerbeta-style verified badge: a solid disc (in the tag's color) with a white check.
function VerifiedBadge() {
  return (
    <span className="inline-flex items-center justify-center w-[14px] h-[14px] rounded-full bg-current shrink-0">
      <span className="text-white text-[9px] font-extrabold leading-none">✓</span>
    </span>
  );
}


const NETWORK_TAG_THEME: Record<number, { label: string; fg: string; bg: string }> = {
  // Gnosis Chain — official brand teal/dark-green (gnosis.io).
  100: { label: "Gnosis Network", fg: "#04795B", bg: "rgba(4, 121, 91, 0.10)" },
  // Ethereum Mainnet — Ethereum Foundation slate-blue.
  1: { label: "Ethereum Network", fg: "#627EEA", bg: "rgba(98, 126, 234, 0.12)" },
  // OP Mainnet — Optimism red.
  10: { label: "Optimism Network", fg: "#FF0420", bg: "rgba(255, 4, 32, 0.10)" },
  // Base — Coinbase blue.
  8453: { label: "Base Network", fg: "#0052FF", bg: "rgba(0, 82, 255, 0.10)" },
  // Sepolia testnet — reuse Ethereum slate-blue (it's an ETH testnet).
  11155111: { label: "Sepolia Network", fg: "#627EEA", bg: "rgba(98, 126, 234, 0.12)" },
};

/**
 * Per-chain network pill, sized and typed to match the adjacent status
 * pill (`status-pill` styling in index.scss + the inline Tailwind on the
 * status `<span>`). Renders next to the status pill in the market hero
 * so the user can see at a glance which chain a market lives on, even
 * before they look at the contract link.
 *
 * Returns null for unknown chain ids or if the logo asset is missing,
 * so a misconfigured chainId never produces a broken pill.
 */
function NetworkTag({ chainId }: { chainId: number }) {
  const theme = NETWORK_TAG_THEME[chainId];
  const logo = NETWORK_ICON_MAPPING[chainId];
  if (!theme || !logo) return null;
  return (
    <span
      className="inline-flex items-center gap-[7px] pl-[6px] pr-3 py-1 rounded-full font-mono text-[10.5px] font-semibold uppercase tracking-wider"
      style={{ color: theme.fg, backgroundColor: theme.bg }}
    >
      <img
        src={logo}
        alt=""
        width={14}
        height={14}
        className="rounded-full shrink-0"
        style={{ boxShadow: `0 0 0 1px color-mix(in srgb, ${theme.fg} 30%, transparent)` }}
      />
      {theme.label}
    </span>
  );
}

function VerificationIcon({ status }: { status: string }) {
  switch (status) {
    case "verified":
      return <VerifiedBadge />;
    case "verifying":
      return <ClockIcon />;
    case "challenged":
      return <LawBalanceIcon />;
    default:
      return <ExclamationCircleIcon width={14} height={14} />;
  }
}

function MarketPnL({
  account,
  chainId,
  marketId,
}: {
  account: Address | undefined;
  chainId: SupportedChain;
  marketId: Address;
}) {
  const { data: marketPnL, isLoading } = usePortfolioPnL(account, chainId, "all", marketId);
  if (!account) return null;

  return (
    <span className="ml-3 flex items-center gap-1">
      <span className="text-base-content/70 @[510px]:inline-block hidden">{"P&L:"}</span>
      <span className="ml-1">{isLoading ? <Spinner /> : marketPnL ? formatBigNumbers(marketPnL.pnl) : "N/A"}</span>
      {!isLoading && marketPnL && <USDIcon />}
    </span>
  );
}

function OutcomesInfo({
  market,
  outcomesCount = 0,
  images = [],
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
    <ul className="list-decimal mx-5">
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
  const { data: parentCollateral } = useTokenInfo(
    parentMarket?.wrappedTokens?.[Number(market.parentOutcome)],
    market.chainId,
  );
  const marketStatus = getMarketStatus(market);
  const liquidityUSD = formatBigNumbers(market.liquidityUSD);
  const incentive = formatBigNumbers(market.incentive);

  const { data: marketEvents = [] } = useMarketEvents(market);
  const resolutionDate = useMemo(() => {
    if (marketEvents.length === 0) return null;
    const latestMs = marketEvents.reduce(
      (max, event) => Math.max(max, new Date(event.event_at).getTime()),
      0,
    );
    return latestMs > 0 ? new Date(latestMs) : null;
  }, [marketEvents]);

  const [showMarketInfo, setShowMarketInfo] = useState(
    type === "default" &&
      market.questions.some((question) => {
        const questionStatus = getQuestionStatus(question);
        return questionStatus !== MarketStatus.NOT_OPEN && questionStatus !== MarketStatus.OPEN;
      }),
  );
  const marketType = getMarketType(market);
  const colors = marketStatus && COLORS[marketStatus];

  const { data: odds = [] } = useMarketOdds(market, type === "default");
  const hasLiquidity = useMarketHasLiquidity(market);
  const marketEstimate = getMarketEstimate(odds, market, true);
  const firstQuestion = market.questions[0];

  const challengeRemainingTime = useMemo(() => getChallengeRemainingTime(market), [market.verification?.status]);

  const blockExplorerUrl = SUPPORTED_CHAINS?.[market.chainId]?.blockExplorers?.default?.url;
  const hasBalance = market.poolBalance.some(
    (pool) => (pool?.token0?.balance ?? 0) > 0.01 || (pool?.token1.balance ?? 0) > 0.01,
  );

  // ── seerbeta hero layout (market detail page) ────────────────────────────────
  if (type === "default") {
    const liquidityDisplay =
      market.liquidityUSD > 0
        ? `$${liquidityUSD}`
        : hasBalance || Number(formatUnits(market.outcomesSupply, 18)) > 0.01
          ? "$?"
          : "$0.00";
    return (
      <div className="card-box text-left px-[24px] pt-[18px] pb-[22px] lg:px-[28px] lg:pt-[20px] lg:pb-[24px]">
        {/* status row */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-[16px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={clsx(
                "inline-flex items-center gap-[7px] px-3 py-1 rounded-full font-mono text-[10.5px] font-semibold uppercase tracking-wider",
                colors?.pillBg,
                colors?.text,
              )}
            >
              <span
                className={clsx("w-1.5 h-1.5 rounded-full", colors?.dot)}
                style={{ boxShadow: "0 0 0 3px color-mix(in srgb, currentColor 20%, transparent)" }}
              />
              {marketStatus && STATUS_TEXTS[marketStatus](hasLiquidity)}
            </span>
            <NetworkTag chainId={market.chainId} />
          </div>
          <div className="flex items-center gap-4 text-[12px] text-ink-3">
            <a
              href={blockExplorerUrl ? `${blockExplorerUrl}/address/${market.id}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-ink transition-colors [&_svg]:text-ink-5"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span className="max-sm:hidden">View contract on explorer</span>
            </a>
            {address && market.creator?.toLocaleLowerCase() === address.toLocaleLowerCase() && (
              <span className="tooltip flex items-center">
                <p className="tooltiptext">Market created by this account</p>
                <MyMarket />
              </span>
            )}
            {market.id !== "0x000" && <MarketFavorite market={market} showLabel />}
          </div>
        </div>

        {/* title row */}
        <div className="flex items-start gap-[18px]">
          
          <div
            className={clsx(
              "w-[56px] h-[56px] rounded-[10px] overflow-hidden flex-shrink-0",
              images?.market ? "bg-white" : "bg-blue",
            )}
          >
            {images?.market && (
              <img src={images.market} alt={market.marketName} className="w-full h-full object-cover" />
            )}
          </div>
          <h1 className="font-display font-medium tracking-tight leading-[1.2] text-[22px] lg:text-[26px] grow min-w-0 break-words">
            {market.marketName}
          </h1>
          {market.questions?.[0]?.id && (
            <a
              href={getRealityLink(market.chainId, market.questions[0].id)}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-[9px] rounded-full border border-[var(--border-strong)] bg-surface text-[13px] font-semibold text-ink-2 hover:bg-bg-2 transition-colors whitespace-nowrap flex-shrink-0"
            >
              Answer on Reality.eth
              <span className="text-blue">→</span>
            </a>
          )}
        </div>

        
        <p className="mt-[14px] text-[12px] text-ink-3 leading-[1.5] max-w-none">
          {MARKET_TYPES_DESCRIPTION[marketType]}
        </p>

        {/* tags */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mt-[16px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="tag">
              <span className="k">Type</span>
              <span className="v">{MARKET_TYPES_TEXTS[marketType]}</span>
            </span>
            <span className="tag">
              <span className="k">Liquidity</span>
              <span className="v">{liquidityDisplay}</span>
            </span>
            <MarketCategories market={market} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            
            {resolutionDate && (
              <span
                className={clsx(
                  HERO_TAG,
                  // Sample `.tag.deadline` in light + dark.
                  "bg-[#f1ecfe] text-[#7c3aed] dark:bg-[rgba(123,43,255,0.16)] dark:text-[#C7ABFF]",
                )}
              >
                {/* Exact FA6 fa-clock path (\f017). The HERO_TAG selector
                    pins width/height to 11px, so the icon scales the FA
                    viewBox (0 0 512 512) down cleanly. */}
                <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
                  <path d="M256 0a256 256 0 1 0 0 512A256 256 0 1 0 256 0zM232 120c0-13.3 10.7-24 24-24s24 10.7 24 24V243.2l81.4 54.3c11 7.4 14 22.3 6.7 33.3s-22.3 14-33.3 6.7l-92.4-61.6c-6.7-4.5-10.7-12-10.7-20V120z" />
                </svg>
                {format(resolutionDate, "MMM d, yyyy")}
              </span>
            )}
            {market.incentive > 0 && (
              <span
                className={clsx(
                  HERO_TAG,
                  // Sample `.tag.reward` in light + dark.
                  "bg-[rgba(255,165,0,0.20)] text-[#e76f51] dark:bg-[rgba(251,191,36,0.10)] dark:text-[#FBBF24]",
                )}
              >
                
                <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
                  <path d="M190.5 68.8L225.3 128H224 152c-22.1 0-40-17.9-40-40s17.9-40 40-40h2.2c14.9 0 28.8 7.9 36.3 20.8zM64 88c0 14.4 3.5 28 9.6 40H32c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32H480c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32H438.4c6.1-12 9.6-25.6 9.6-40c0-48.6-39.4-88-88-88h-2.2c-31.9 0-61.5 16.9-77.8 44.4L256 85.5l-24-40.1C215.7 17.9 186.1 1 154.2 1H152C103.4 1 64 40.4 64 88zm336 0c0 22.1-17.9 40-40 40H288 286.7l34.8-59.2C329 55.9 342.9 48 357.8 48H360c22.1 0 40 17.9 40 40zM32 288V464c0 26.5 21.5 48 48 48H224V288H32zM288 512H432c26.5 0 48-21.5 48-48V288H288V512z" />
                </svg>
                {incentive} SEER/day
              </span>
            )}
            {isVerificationEnabled(market.chainId) &&
              (() => {
                // a market with no verification record is treated as not_verified
                const status = market.verification?.status ?? "not_verified";
                const cfg = VERIFICATION_TAG[status];
                const itemID = market.verification?.itemID;
                const to =
                  status === "not_verified" || !itemID
                    ? paths.verifyMarket(market.id, market.chainId)
                    : paths.curateVerifiedList(market.chainId, itemID);
                return (
                  <Link
                    to={to}
                    {...(status === "not_verified" ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                    className={clsx(HERO_TAG, cfg?.cls)}
                  >
                    <VerificationIcon status={status} />
                    {cfg?.label}
                  </Link>
                );
              })()}
          </div>
        </div>

        {marketType === MarketTypes.SCALAR && market.id !== "0x000" && marketEstimate !== "NA" && (
          <div className="mt-[18px] pt-[18px] border-t border-[var(--border-2)] font-semibold flex items-center gap-2">
            Market Estimate: {odds.length === 0 ? <Spinner /> : marketEstimate}
            {odds.length > 0 && (
              <span className="tooltip">
                <p className="tooltiptext !whitespace-pre-wrap w-auto lg:w-[250px] md:w-[400px]">
                  The market's predicted result based on the current distribution of "UP" and "DOWN" tokens
                </p>
                <QuestionIcon fill="var(--blue)" />
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "card shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] text-left flex flex-col",
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
          <Link to={paths.market(market)}>
            {images?.market ? (
              <img
                src={images.market}
                alt={market.marketName}
                className="w-[65px] h-[65px] min-w-[65px] min-h-[65px] rounded-full dark:bg-neutral"
              />
            ) : (
              <div className="w-[65px] h-[65px] rounded-full bg-purple-primary dark:bg-neutral"></div>
            )}
          </Link>
        </div>
        <div className="grow min-w-0">
          <div className="font-display font-semibold tracking-tight mb-1 text-[18px] break-words">
            <Link className="hover:underline" to={paths.market(market)}>
              {market.marketName}
            </Link>
          </div>
          {parentMarket && (
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
        <div className="border-t border-separator-100 py-[16px] px-[24px] font-semibold flex items-center gap-2">
          <div className="flex items-center gap-2">
            Market Estimate: {odds.length === 0 ? <Spinner /> : marketEstimate}
          </div>
          {odds.length > 0 && (
            <span className="tooltip">
              <p className="tooltiptext !whitespace-pre-wrap w-auto lg:w-[250px] md:w-[400px] ">
                The market's predicted result based on the current distribution of "UP" and "DOWN" tokens
              </p>
              <QuestionIcon fill="var(--blue)" />
            </span>
          )}
        </div>
      )}

      {type === "preview" && (
        <div className="border-t border-separator-100 py-[16px]">
          <OutcomesInfo
            market={market}
            outcomesCount={outcomesCount}
            images={images?.outcomes}
            marketStatus={marketStatus}
          />
        </div>
      )}

      {type !== "small" && (
        <div className="border-t border-separator-100 px-[25px] h-[45px] flex items-center justify-between text-[14px] mt-auto @container">
          <div className="flex items-center gap-4">
            <SeerLogo fill="currentColor" className="text-[#511778] dark:text-white" width="50px" height="100%" />
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
              <span className="text-base-content/70 @[510px]:inline-block hidden">Liquidity:</span>
              <span className="ml-1">
                {market.liquidityUSD > 0
                  ? liquidityUSD
                  : hasBalance || Number(formatUnits(market.outcomesSupply, 18)) > 0.01
                    ? "?"
                    : "0.00"}
              </span>
              <USDIcon />
              {(hasBalance || Number(formatUnits(market.outcomesSupply, 18)) > 0.01) && (
                <Popover
                  trigger={<QuestionIcon fill="var(--blue)" />}
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
                      <PoolTokensInfo market={market} marketStatus={marketStatus} type={type} />
                    </div>
                  }
                />
              )}
              {market.parentMarket.id.toLowerCase() === zeroAddress.toLowerCase() && (
                <MarketPnL account={address} chainId={market.chainId} marketId={market.id} />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {market.incentive > 0 && (
              <div className="tooltip">
                <p className="tooltiptext">
                  Reward: <span className="text-purple-primary">{incentive} SEER/day</span>
                </p>
                
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 512 512"
                  fill="var(--blue)"
                  aria-hidden="true"
                >
                  <path d="M190.5 68.8L225.3 128H224 152c-22.1 0-40-17.9-40-40s17.9-40 40-40h2.2c14.9 0 28.8 7.9 36.3 20.8zM64 88c0 14.4 3.5 28 9.6 40H32c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32H480c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32H438.4c6.1-12 9.6-25.6 9.6-40c0-48.6-39.4-88-88-88h-2.2c-31.9 0-61.5 16.9-77.8 44.4L256 85.5l-24-40.1C215.7 17.9 186.1 1 154.2 1H152C103.4 1 64 40.4 64 88zm336 0c0 22.1-17.9 40-40 40H288 286.7l34.8-59.2C329 55.9 342.9 48 357.8 48H360c22.1 0 40 17.9 40 40zM32 288V464c0 26.5 21.5 48 48 48H224V288H32zM288 512H432c26.5 0 48-21.5 48-48V288H288V512z" />
                </svg>
              </div>
            )}
            {!isUndefined(market.verification) && isVerificationEnabled(market.chainId) && (
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
                    <div className="@[510px]:inline-block hidden">Verified</div>
                  </>
                )}
                {market.verification.status === "verifying" && (
                  <>
                    <ClockIcon />
                    <div className="@[510px]:inline-block hidden">Verifying</div>
                    {challengeRemainingTime && <p className="tooltiptext">Ends in {challengeRemainingTime}</p>}
                  </>
                )}
                {market.verification.status === "challenged" && (
                  <>
                    <LawBalanceIcon />
                    <div className="@[510px]:inline-block hidden">Challenged</div>
                  </>
                )}
                {market.verification.status === "not_verified" && (
                  <>
                    <ExclamationCircleIcon width="14" height="14" />
                    <div className="@[510px]:inline-block hidden">Verify it</div>
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

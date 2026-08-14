import { Alert } from "@/components/Alert";
import Breadcrumb from "@/components/Breadcrumb";
import { ChainFilterChips } from "@/components/ChainFilterChips";
import { AddressOrName } from "@/components/ConnectWallet/AccountDisplay";
import { CopyButton } from "@/components/CopyButton";
import AirdropTab, { AirdropHero } from "@/components/Portfolio/AirdropTab";
import HistoryTab from "@/components/Portfolio/HistoryTab";
import PositionsTab from "@/components/Portfolio/PositionsTab";
import { useSearchParams } from "@/hooks/useSearchParams";
import { parsePortfolioChainParam } from "@/lib/chains";
import { SIGNED_TONE_CLASS, SIGNED_TONE_FILL, formatDeltaPercent, formatUsd, signedTone } from "@/lib/formatUsd";
import { ArrowDropDown, ArrowDropUp, Union } from "@/lib/icons";
import { isTwoStringsEqual } from "@/lib/utils";
import { usePortfolioPnL, usePortfolioValue } from "@seer-pm/react";
import type { PortfolioChainId, PortfolioPnLPeriod } from "@seer-pm/sdk";
import { type KeyboardEvent, useRef } from "react";
import { Address, getAddress, isAddress } from "viem";
import { usePageContext } from "vike-react/usePageContext";
import { useAccount } from "wagmi";

const TABS = [
  { id: "positions", label: "Positions", panelId: "portfolio-panel-positions" },
  { id: "history", label: "History", panelId: "portfolio-panel-history" },
  { id: "airdrop", label: "Airdrop", panelId: "portfolio-panel-airdrop" },
] as const;

type PortfolioTab = (typeof TABS)[number]["id"];

const PNL_PERIODS: { id: PortfolioPnLPeriod; label: string; aria: string; hint: string }[] = [
  { id: "1d", label: "1D", aria: "Trading P&L last day", hint: "Last day" },
  { id: "1w", label: "1W", aria: "Trading P&L last week", hint: "Last week" },
  { id: "1m", label: "1M", aria: "Trading P&L last month", hint: "Last month" },
  { id: "all", label: "All", aria: "Trading P&L all time", hint: "All time" },
];

function parsePortfolioTab(raw: string | null): PortfolioTab {
  if (raw === "history" || raw === "airdrop" || raw === "positions") return raw;
  return "positions";
}

function parsePnLPeriod(raw: string | null): PortfolioPnLPeriod {
  if (raw === "1d" || raw === "1w" || raw === "1m" || raw === "all") return raw;
  return "all";
}

function PortfolioValueVariation({ account, chainId }: { account: Address; chainId: PortfolioChainId }) {
  const { data, isLoading, error, refetch, isFetching } = usePortfolioValue(account, chainId);
  const currentPortfolioValue = data?.currentPortfolioValue ?? 0;
  const delta = data?.delta ?? 0;
  const tone = signedTone(delta);
  const percentLabel = formatDeltaPercent(data?.deltaPercent ?? 0);

  if (error) {
    return (
      <div>
        <p className="text-sm font-medium text-black-primary">Current value</p>
        <p className="text-sm text-[#B42318] mt-1">Couldn't load current value.</p>
        <button
          type="button"
          className="btn btn-ghost btn-sm min-h-11 mt-1 px-3"
          disabled={isFetching}
          onClick={() => refetch()}
        >
          {isFetching ? "Retrying…" : "Try again"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-black-primary">Current value</p>
      <div aria-live="polite" aria-atomic="true">
        {isLoading ? (
          <>
            <span className="sr-only">Loading current value</span>
            <div className="mt-2 shimmer-container h-8 w-[220px] max-w-full" aria-hidden />
          </>
        ) : (
          <p className="text-[32px] leading-tight text-base-content font-semibold">
            {formatUsd(Number(currentPortfolioValue))}
          </p>
        )}
        {isLoading ? (
          <div className="mt-2 shimmer-container h-5 w-[180px] max-w-full" aria-hidden />
        ) : tone === "flat" ? (
          <p className="text-sm text-black-primary mt-1">No value change today</p>
        ) : (
          <p className={`${SIGNED_TONE_CLASS[tone]} flex items-center gap-1 mt-1 text-sm`}>
            <span aria-hidden>
              {tone === "up" ? (
                <ArrowDropUp fill={SIGNED_TONE_FILL.up} />
              ) : (
                <ArrowDropDown fill={SIGNED_TONE_FILL.down} />
              )}
            </span>
            {formatUsd(delta, { signed: true })}
            {percentLabel ? ` (${percentLabel})` : ""} value change today
          </p>
        )}
      </div>
      <p className="text-sm text-black-primary mt-1">USD · mark-to-market of outcomes and collateral</p>
    </div>
  );
}

function PortfolioPnLHistory({
  account,
  chainId,
  period,
  onPeriodChange,
}: {
  account: Address;
  chainId: PortfolioChainId;
  period: PortfolioPnLPeriod;
  onPeriodChange: (period: PortfolioPnLPeriod) => void;
}) {
  const { data: plData, isLoading, error, refetch, isFetching } = usePortfolioPnL(account, chainId, period);
  const pnl = plData?.pnl ?? 0;
  const tone = signedTone(pnl);
  const periodMeta = PNL_PERIODS.find((p) => p.id === period) ?? PNL_PERIODS[3];

  return (
    <div className="flex flex-col items-start sm:items-end gap-2 min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-black-primary">Trading P&L</p>
        <div className="join">
          {PNL_PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={period === p.id}
              aria-label={p.aria}
              className={`btn join-item min-h-11 min-w-11 px-3 ${period === p.id ? "btn-active" : "btn-ghost"}`}
              onClick={() => onPeriodChange(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div aria-live="polite" aria-atomic="true">
        {isLoading ? (
          <>
            <span className="sr-only">Loading trading P&L</span>
            <div className="shimmer-container h-7 w-[140px]" aria-hidden />
          </>
        ) : error ? (
          <div className="text-right">
            <p className="text-sm text-[#B42318]">Couldn't load trading P&L.</p>
            <button
              type="button"
              className="btn btn-ghost btn-sm min-h-11 mt-1 px-3"
              disabled={isFetching}
              onClick={() => refetch()}
            >
              {isFetching ? "Retrying…" : "Try again"}
            </button>
          </div>
        ) : (
          <p className={`text-2xl font-semibold ${SIGNED_TONE_CLASS[tone]}`}>{formatUsd(pnl, { signed: true })}</p>
        )}
      </div>
      <p className="text-sm text-black-primary">{periodMeta.hint}</p>
    </div>
  );
}

function PortfolioPage() {
  const { address: connectedAccount } = useAccount();
  const { routeParams } = usePageContext();
  const account = (routeParams?.id || connectedAccount) as Address | undefined;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = parsePortfolioTab(searchParams.get("tab"));
  const chainId = parsePortfolioChainParam(searchParams.get("chain"));
  const plPeriod = parsePnLPeriod(searchParams.get("pl"));
  const showChainFilter = activeTab !== "airdrop";
  const activeTabMeta = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  const setTab = (tab: PortfolioTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  const setChainId = (nextChain: number | "all") => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("chain", String(nextChain));
      return next;
    });
  };

  const setPlPeriod = (period: PortfolioPnLPeriod) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("pl", period);
      return next;
    });
  };

  const selectTab = (index: number, focus = false) => {
    const nextIndex = (index + TABS.length) % TABS.length;
    setTab(TABS[nextIndex].id);
    if (focus) {
      requestAnimationFrame(() => tabRefs.current[nextIndex]?.focus());
    }
  };

  const onTabListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.findIndex((tab) => tab.id === activeTab);
    if (index < 0) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectTab(index + 1, true);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectTab(index - 1, true);
    }
  };

  if (!account) {
    return (
      <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[48px]">
        <Breadcrumb links={[{ title: "Portfolio" }]} />
        <Alert type="warning" title="Account not found">
          Connect your wallet to see this portfolio.
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[48px]">
      <Breadcrumb links={[{ title: "Portfolio" }]} />
      <div className="mt-8 space-y-4">
        {showChainFilter ? <ChainFilterChips value={chainId} onChange={setChainId} /> : null}
        <div className="bg-base-100 border border-separator-100 rounded-[1px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] min-h-[162px] px-6 py-[28px] flex flex-col sm:flex-row gap-6 items-start justify-between">
          <div className="flex gap-4 min-w-0">
            <div className="bg-purple-primary w-16 h-16 rounded-full flex items-center justify-center shrink-0">
              <Union />
            </div>
            <div className="min-w-0">
              <div className={`flex items-center gap-1 min-w-0 ${activeTab === "airdrop" ? "" : "mb-2"}`}>
                <h1 className="text-[18px] font-semibold text-base-content truncate">
                  <AddressOrName address={account} />
                </h1>
                <CopyButton
                  textToCopy={isAddress(account) ? getAddress(account) : account}
                  size={16}
                  className="shrink-0 min-h-11 min-w-11 text-black-primary"
                />
                {isTwoStringsEqual(connectedAccount, account) ? (
                  <span className="text-xs text-purple-primary font-medium shrink-0">You</span>
                ) : null}
              </div>
              {activeTab !== "airdrop" ? <PortfolioValueVariation account={account} chainId={chainId} /> : null}
            </div>
          </div>

          {activeTab === "airdrop" ? (
            <AirdropHero account={account} />
          ) : (
            <PortfolioPnLHistory account={account} chainId={chainId} period={plPeriod} onPeriodChange={setPlPeriod} />
          )}
        </div>
        {showChainFilter ? (
          <p className="text-sm text-black-primary">
            Price and Value in the table are in each chain's collateral (sDAI, sUSDS, and others), not USD.
          </p>
        ) : null}
      </div>

      <div>
        <div
          role="tablist"
          aria-label="Portfolio sections"
          className="tabs tabs-bordered font-semibold overflow-x-auto custom-scrollbar pb-1 w-fit max-w-[600px] mb-6"
          onKeyDown={onTabListKeyDown}
        >
          {TABS.map((tab, index) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`portfolio-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={tab.panelId}
                tabIndex={selected ? 0 : -1}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                className={`tab min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-primary ${selected ? "tab-active" : ""}`}
                onClick={() => setTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div role="tabpanel" id={activeTabMeta.panelId} aria-labelledby={`portfolio-tab-${activeTab}`}>
          <h2 className="sr-only">{activeTabMeta.label}</h2>
          {activeTab === "positions" && <PositionsTab account={account} chainId={chainId} />}
          {activeTab === "history" && <HistoryTab account={account} chainId={chainId} />}
          {activeTab === "airdrop" && <AirdropTab account={account} />}
        </div>
      </div>
    </div>
  );
}

export default PortfolioPage;

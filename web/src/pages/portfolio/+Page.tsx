import { Alert } from "@/components/Alert";
import Breadcrumb from "@/components/Breadcrumb";
import { ChainFilterChips } from "@/components/ChainFilterChips";
import { AddressOrName } from "@/components/ConnectWallet/AccountDisplay";
import { CopyButton } from "@/components/CopyButton";
import AirdropTab from "@/components/Portfolio/AirdropTab";
import HistoryTab from "@/components/Portfolio/HistoryTab";
import PositionsTab from "@/components/Portfolio/PositionsTab";
import { useSearchParams } from "@/hooks/useSearchParams";
import { parsePortfolioChainParam } from "@/lib/chains";
import { formatUsd } from "@/lib/formatUsd";
import { ArrowDropDown, ArrowDropUp, Union } from "@/lib/icons";
import { isTwoStringsEqual } from "@/lib/utils";
import { usePortfolioPnL, usePortfolioValue } from "@seer-pm/react";
import type { PortfolioChainId, PortfolioPnLPeriod } from "@seer-pm/sdk";
import { useState } from "react";
import { Address, getAddress, isAddress } from "viem";
import { usePageContext } from "vike-react/usePageContext";
import { useAccount } from "wagmi";

function PortfolioValueVariation({ account, chainId }: { account: Address; chainId: PortfolioChainId }) {
  const { data, isLoading, error } = usePortfolioValue(account, chainId);
  const currentPortfolioValue = data?.currentPortfolioValue ?? 0;
  const delta = data?.delta ?? 0;
  const deltaPercent = data?.deltaPercent ?? 0;

  if (error) {
    return (
      <div>
        <p className="text-[16px] text-black-secondary">Total</p>
        <p className="text-sm text-error">Unable to load portfolio value.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[16px] text-black-secondary">Total</p>
      {isLoading ? (
        <div className="mt-3 shimmer-container h-[28px] w-[300px]" />
      ) : (
        <p className="text-[32px] text-base-content font-semibold">{formatUsd(Number(currentPortfolioValue))}</p>
      )}
      {isLoading ? (
        <div className="shimmer-container h-[20px] w-[300px]" />
      ) : delta >= 0 ? (
        <p className="text-[#00C42B] flex gap-2">
          <span>
            <ArrowDropUp fill="#00C42B" />
          </span>
          {formatUsd(delta, { signed: true })} ({deltaPercent.toFixed(2)}%) today
        </p>
      ) : (
        <p className="text-[#c40000] flex gap-2">
          <span>
            <ArrowDropDown fill="#c40000" />
          </span>
          {formatUsd(delta, { signed: true })} ({deltaPercent.toFixed(2)}%) today
        </p>
      )}
    </div>
  );
}

function PortfolioPnLHistory({ account, chainId }: { account: Address; chainId: PortfolioChainId }) {
  const [plPeriod, setPlPeriod] = useState<PortfolioPnLPeriod>("all");
  const { data: plData, isLoading, error } = usePortfolioPnL(account, chainId, plPeriod);

  const pnl = plData?.pnl ?? 0;
  const isPnlPositive = pnl >= 0;
  const pnlTextColor = isPnlPositive ? "text-[#00C42B]" : "text-[#c40000]";

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex items-center gap-3">
        <p className="text-[16px] text-black-secondary">Profit/Loss</p>
        <div className="join">
          {(["1d", "1w", "1m", "all"] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`btn btn-xs join-item ${plPeriod === p ? "btn-active" : "btn-ghost"}`}
              onClick={() => setPlPeriod(p)}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="shimmer-container h-[28px] w-[160px]" />
      ) : error ? (
        <p className="text-sm text-error">Unable to load P/L.</p>
      ) : (
        <p className={`text-[32px] font-semibold ${pnlTextColor}`}>{formatUsd(pnl, { signed: true })}</p>
      )}
    </div>
  );
}

function PortfolioPage() {
  const { address: connectedAccount } = useAccount();
  const { routeParams } = usePageContext();
  const account = (routeParams?.id || connectedAccount) as Address | undefined;

  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "positions";
  const chainId = parsePortfolioChainParam(searchParams.get("chain"));

  const setTab = (tab: string) => {
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

  if (!account) {
    return (
      <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[48px]">
        <Breadcrumb links={[{ title: "Portfolio" }]} />
        <Alert type="warning" title="Account not found">
          Connect your wallet to see your portfolio.
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[48px]">
      <Breadcrumb links={[{ title: "Portfolio" }]} />
      <div className="mt-8 space-y-4">
        <ChainFilterChips value={chainId} onChange={setChainId} />
        <div className="bg-base-100 border border-separator-100 rounded-[1px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] min-h-[162px] px-6 py-[28px] flex flex-col sm:flex-row gap-6 items-start justify-between">
          <div className="flex gap-4 min-w-0">
            <div className="bg-purple-primary w-16 h-16 rounded-full flex items-center justify-center shrink-0">
              <Union />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 min-w-0 mb-2">
                <h1 className="text-[18px] font-semibold text-base-content truncate">
                  <AddressOrName address={account} />
                </h1>
                <CopyButton
                  textToCopy={isAddress(account) ? getAddress(account) : account}
                  size={16}
                  className="shrink-0 !p-1 text-black-secondary"
                />
                {isTwoStringsEqual(connectedAccount, account) ? (
                  <span className="text-xs text-purple-primary font-medium shrink-0">You</span>
                ) : null}
              </div>
              <PortfolioValueVariation account={account} chainId={chainId} />
            </div>
          </div>

          <PortfolioPnLHistory account={account} chainId={chainId} />
        </div>
      </div>

      <div>
        <div
          role="tablist"
          className="tabs tabs-bordered font-semibold overflow-x-auto custom-scrollbar pb-1 w-fit max-w-[600px] mb-6"
        >
          <button
            type="button"
            role="tab"
            className={`tab ${activeTab === "positions" && "tab-active"}`}
            onClick={() => setTab("positions")}
          >
            Positions
          </button>
          <button
            type="button"
            role="tab"
            className={`tab ${activeTab === "history" && "tab-active"}`}
            onClick={() => setTab("history")}
          >
            History
          </button>
          <button
            type="button"
            role="tab"
            className={`tab ${activeTab === "airdrop" && "tab-active"}`}
            onClick={() => setTab("airdrop")}
          >
            Airdrop
          </button>
        </div>
        {activeTab === "positions" && <PositionsTab account={account} chainId={chainId} />}
        {activeTab === "history" && <HistoryTab account={account} chainId={chainId} />}
        {activeTab === "airdrop" && <AirdropTab account={account} />}
      </div>
    </div>
  );
}

export default PortfolioPage;

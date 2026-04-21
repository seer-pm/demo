import { Alert } from "@/components/Alert";
import Breadcrumb from "@/components/Breadcrumb";
import AirdropTab from "@/components/Portfolio/AirdropTab";
import HistoryTab from "@/components/Portfolio/HistoryTab";
import OrdersTab from "@/components/Portfolio/OrdersTab";
import PositionsTab from "@/components/Portfolio/PositionsTab";
import { useSearchParams } from "@/hooks/useSearchParams";
import { DEFAULT_CHAIN } from "@/lib/chains";
import { ArrowDropDown, ArrowDropUp, Union } from "@/lib/icons";
import { usePortfolioPnL, usePortfolioValue } from "@seer-pm/react";
import type { PortfolioPnLPeriod, SupportedChain } from "@seer-pm/sdk";
import { useState } from "react";
import { Address } from "viem";
import { usePageContext } from "vike-react/usePageContext";
import { useAccount } from "wagmi";

function PortfolioValueVariation({ account, chainId }: { account: Address; chainId: SupportedChain }) {
  const { data, isLoading } = usePortfolioValue(account, chainId);
  const currentPortfolioValue = data?.currentPortfolioValue ?? 0;
  const delta = data?.delta ?? 0;
  const deltaPercent = data?.deltaPercent ?? 0;

  return (
    <div>
      <p className="text-[16px] text-black-secondary">Total</p>
      {isLoading ? (
        <div className="mt-3 shimmer-container h-[28px] w-[300px]" />
      ) : (
        <p className="text-[32px] text-base-content font-semibold">{Number(currentPortfolioValue).toFixed(2)} sDAI</p>
      )}
      {isLoading ? (
        <div className="shimmer-container h-[20px] w-[300px]" />
      ) : delta >= 0 ? (
        <p className="text-[#00C42B] flex gap-2">
          <span>
            <ArrowDropUp fill="#00C42B" />
          </span>
          {delta.toFixed(2)} sDAI ({deltaPercent.toFixed(2)}%) today
        </p>
      ) : (
        <p className="text-[#c40000] flex gap-2">
          <span>
            <ArrowDropDown fill="#c40000" />
          </span>
          {delta.toFixed(2)} sDAI ({deltaPercent.toFixed(2)}%) today
        </p>
      )}
    </div>
  );
}

function PortfolioPnLHistory({ account, chainId }: { account: Address; chainId: SupportedChain }) {
  const [plPeriod, setPlPeriod] = useState<PortfolioPnLPeriod>("1d");
  const { data: plData, isLoading: isLoadingPL } = usePortfolioPnL(account, chainId, plPeriod);

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
      {isLoadingPL ? (
        <div className="shimmer-container h-[28px] w-[160px]" />
      ) : (
        <p className={`text-[32px] font-semibold ${pnlTextColor}`}>
          {isPnlPositive ? "+" : ""}
          {pnl.toFixed(2)} sDAI
        </p>
      )}
    </div>
  );
}

function PortfolioPage() {
  const { address: connectedAccount, chainId = DEFAULT_CHAIN } = useAccount();
  const { routeParams } = usePageContext();
  const account = (routeParams?.id || connectedAccount) as Address | undefined;

  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "positions";

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
      <div className="mt-8 bg-base-100 border border-separator-100 rounded-[1px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] min-h-[162px] px-6 py-[28px] flex gap-4 items-start justify-between">
        <div className="flex gap-4">
          <div className="bg-purple-primary w-16 h-16 rounded-full flex items-center justify-center">
            <Union />
          </div>
          <PortfolioValueVariation account={account} chainId={chainId as SupportedChain} />
        </div>

        <PortfolioPnLHistory account={account} chainId={chainId as SupportedChain} />
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
            onClick={() =>
              setSearchParams({
                tab: "positions",
              })
            }
          >
            Positions
          </button>
          <button
            type="button"
            role="tab"
            className={`tab ${activeTab === "orders" && "tab-active"}`}
            onClick={() =>
              setSearchParams({
                tab: "orders",
              })
            }
          >
            Orders
          </button>
          <button
            type="button"
            role="tab"
            className={`tab ${activeTab === "history" && "tab-active"}`}
            onClick={() =>
              setSearchParams({
                tab: "history",
              })
            }
          >
            History
          </button>
          <button
            type="button"
            role="tab"
            className={`tab ${activeTab === "airdrop" && "tab-active"}`}
            onClick={() =>
              setSearchParams({
                tab: "airdrop",
              })
            }
          >
            Airdrop
          </button>
        </div>
        {activeTab === "positions" && <PositionsTab account={account} chainId={chainId as SupportedChain} />}
        {activeTab === "orders" && <OrdersTab account={account} chainId={chainId as SupportedChain} />}
        {activeTab === "history" && <HistoryTab account={account} chainId={chainId as SupportedChain} />}
        {activeTab === "airdrop" && <AirdropTab account={account} />}
      </div>
    </div>
  );
}

export default PortfolioPage;

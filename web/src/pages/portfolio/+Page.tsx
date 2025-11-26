import { Alert } from "@/components/Alert";
import Breadcrumb from "@/components/Breadcrumb";
import AirdropTab from "@/components/Portfolio/AirdropTab";
import HistoryTab from "@/components/Portfolio/HistoryTab";
import OrdersTab from "@/components/Portfolio/OrdersTab";
import PositionsTab from "@/components/Portfolio/PositionsTab";
import useCalculatePositionsValue from "@/hooks/portfolio/positionsTab/useCalculatePositionsValue";

import { useSearchParams } from "@/hooks/useSearchParams";
import { ArrowDropDown, ArrowDropUp, Union } from "@/lib/icons";
import { Address } from "viem";
import { usePageContext } from "vike-react/usePageContext";
import { useAccount } from "wagmi";

function PortfolioPage() {
  const { address: connectedAccount } = useAccount();
  const { routeParams } = usePageContext();
  const account = (routeParams?.id || connectedAccount) as Address | undefined;

  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "positions";

  const { isCalculating, delta, currentPortfolioValue, deltaPercent, isCalculatingDelta } =
    useCalculatePositionsValue(account);

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
      <div className="mt-8 bg-white border border-black-medium rounded-[1px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] h-[162px] pl-6 pt-[38px] flex gap-4">
        <div className="bg-purple-primary w-16 h-16 rounded-full flex items-center justify-center">
          <Union />
        </div>
        <div>
          <p className="text-[16px] text-black-secondary">Total</p>
          {isCalculating ? (
            <div className="mt-3 shimmer-container h-[28px] w-[300px]" />
          ) : (
            <p className="text-[32px] text-[#333333] font-semibold">
              {Number(currentPortfolioValue ?? 0n).toFixed(2)} sDAI
            </p>
          )}
          {isCalculatingDelta ? (
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
        {activeTab === "positions" && <PositionsTab account={account} />}
        {activeTab === "orders" && <OrdersTab account={account} />}
        {activeTab === "history" && <HistoryTab account={account} />}
        {activeTab === "airdrop" && <AirdropTab account={account} />}
      </div>
    </div>
  );
}

export default PortfolioPage;

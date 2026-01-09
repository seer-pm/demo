import { Market, MarketStatus, getMarketStatus } from "@/lib/market";
import React, { useMemo, useEffect, useState } from "react";
import { Address } from "viem";
import { MergeForm } from "./MergeForm";
import { RedeemForm } from "./RedeemForm";
import { SplitForm } from "./SplitForm";

interface MobileMarketActionsProps {
  account?: Address;
  market: Market;
  swapWidget: React.ReactNode;
  onTabsChange?: (tabs: React.ReactNode) => void;
  drawerOpen: boolean;
}

export function MobileMarketActions({
  account,
  market,
  swapWidget,
  onTabsChange,
  drawerOpen,
}: MobileMarketActionsProps) {
  const [activeTab, setActiveTab] = useState<"trade" | "mint" | "merge" | "redeem">("trade");
  const marketStatus = getMarketStatus(market);
  const prevDrawerOpenRef = React.useRef<boolean | undefined>(drawerOpen);

  // Reset to "trade" tab whenever drawer opens
  useEffect(() => {
    if (drawerOpen && prevDrawerOpenRef.current === false) {
      // Drawer just opened (transitioned from closed to open)
      setActiveTab("trade");
    }
    prevDrawerOpenRef.current = drawerOpen;
  }, [drawerOpen]);

  const renderMintTab = () => {
    return (
      <div className="bg-base-100 p-[24px] shadow-md">
        <SplitForm account={account} market={market} />
      </div>
    );
  };

  const renderMergeTab = () => {
    return (
      <div className="bg-base-100 p-[24px] shadow-md">
        <MergeForm account={account} market={market} />
      </div>
    );
  };

  const renderRedeemTab = () => {
    if (marketStatus === MarketStatus.CLOSED) {
      return (
        <div className="bg-base-100 p-[24px] shadow-md">
          <RedeemForm account={account} market={market} />
        </div>
      );
    }
    return <div className="bg-base-100 p-[24px] shadow-md">Redemptions are not available yet.</div>;
  };

  const tabs = useMemo(
    () => (
      <div role="tablist" className="tabs tabs-bordered font-semibold overflow-x-auto custom-scrollbar pb-1">
        <button
          type="button"
          role="tab"
          className={`tab text-[16px] flex-1 ${activeTab === "trade" && "tab-active"}`}
          onClick={() => setActiveTab("trade")}
        >
          Trade
        </button>
        <button
          type="button"
          role="tab"
          className={`tab text-[16px] flex-1 ${activeTab === "mint" && "tab-active"}`}
          onClick={() => setActiveTab("mint")}
        >
          Mint
        </button>
        <button
          type="button"
          role="tab"
          className={`tab text-[16px] flex-1 ${activeTab === "merge" && "tab-active"}`}
          onClick={() => setActiveTab("merge")}
        >
          Merge
        </button>
        <button
          type="button"
          role="tab"
          className={`tab text-[16px] flex-1 ${activeTab === "redeem" && "tab-active"}`}
          onClick={() => setActiveTab("redeem")}
        >
          Redeem
        </button>
      </div>
    ),
    [activeTab],
  );

  useEffect(() => {
    if (onTabsChange) {
      onTabsChange(tabs);
    }
  }, [tabs, onTabsChange]);

  return (
    <>
      {activeTab === "trade" && swapWidget}
      {activeTab === "mint" && renderMintTab()}
      {activeTab === "merge" && renderMergeTab()}
      {activeTab === "redeem" && renderRedeemTab()}
    </>
  );
}

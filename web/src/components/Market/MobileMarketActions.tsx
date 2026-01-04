import { getMarketStatus } from "@/lib/market";
import { MarketStatus } from "@/lib/market";
import { Market } from "@/lib/market";
import { useEffect, useRef, useState } from "react";
import React, { useMemo } from "react";
import { Address } from "viem";
import { MergeForm } from "./MergeForm";
import { RedeemForm } from "./RedeemForm";
import { SplitForm } from "./SplitForm";

interface MobileMarketActionsProps {
  account?: Address;
  market: Market;
  swapWidget: React.ReactNode;
  onTabsChange?: (tabs: React.ReactNode) => void;
}

export function MobileMarketActions({ account, market, swapWidget, onTabsChange }: MobileMarketActionsProps) {
  const [activeTab, setActiveTab] = useState<"trade" | "mint" | "merge" | "redeem">("trade");
  const marketStatus = getMarketStatus(market);
  const onTabsChangeRef = useRef(onTabsChange);

  // Update ref when onTabsChange changes
  useEffect(() => {
    onTabsChangeRef.current = onTabsChange;
  }, [onTabsChange]);

  const renderMintTab = () => {
    return (
      <div className="bg-white p-[24px] shadow-md">
        <SplitForm account={account} market={market} />
      </div>
    );
  };

  const renderMergeTab = () => {
    return (
      <div className="bg-white p-[24px] shadow-md">
        <MergeForm account={account} market={market} />
      </div>
    );
  };

  const renderRedeemTab = () => {
    if (marketStatus === MarketStatus.CLOSED) {
      return (
        <div className="bg-white p-[24px] shadow-md">
          <RedeemForm account={account} market={market} />
        </div>
      );
    }
    return <div className="bg-white p-[24px] shadow-md">Redemptions are not available yet.</div>;
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
    if (onTabsChangeRef.current) {
      onTabsChangeRef.current(tabs);
    }
  }, [tabs]);

  return (
    <>
      {activeTab === "trade" && swapWidget}
      {activeTab === "mint" && renderMintTab()}
      {activeTab === "merge" && renderMergeTab()}
      {activeTab === "redeem" && renderRedeemTab()}
    </>
  );
}

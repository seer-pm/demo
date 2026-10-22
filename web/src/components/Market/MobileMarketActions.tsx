import { Market, MarketStatus, getMarketStatus } from "@seer-pm/sdk";
import React, { useMemo, useEffect, useId, useState } from "react";
import { Address } from "viem";
import { MarketTabList } from "./MarketTabList";
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
  const tabsId = useId();
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
      <MarketTabList
        idPrefix={tabsId}
        label="Market actions"
        value={activeTab}
        onChange={setActiveTab}
        fill
        tabs={[
          { id: "trade", label: "Trade" },
          { id: "mint", label: "Mint" },
          { id: "merge", label: "Merge" },
          { id: "redeem", label: "Redeem" },
        ]}
      />
    ),
    [activeTab, tabsId],
  );

  useEffect(() => {
    if (onTabsChange) {
      onTabsChange(tabs);
    }
  }, [tabs, onTabsChange]);

  return (
    <div>
      {(["trade", "mint", "merge", "redeem"] as const).map((tab) => (
        <div
          key={tab}
          role="tabpanel"
          id={`${tabsId}-panel-${tab}`}
          aria-labelledby={`${tabsId}-tab-${tab}`}
          hidden={activeTab !== tab}
          tabIndex={0}
        >
          {activeTab === tab && tab === "trade" && swapWidget}
          {activeTab === tab && tab === "mint" && renderMintTab()}
          {activeTab === tab && tab === "merge" && renderMergeTab()}
          {activeTab === tab && tab === "redeem" && renderRedeemTab()}
        </div>
      ))}
    </div>
  );
}

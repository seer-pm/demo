import { useSelectedCollateral } from "@/hooks/useSelectedCollateral";
import { Market, MarketStatus, getMarketStatus } from "@seer-pm/sdk";
import React, { useMemo, useEffect, useId, useState } from "react";
import { Address } from "viem";
import { MarketTabList } from "./MarketTabList";
import { MergeForm } from "./MergeForm";
import { RedeemForm } from "./RedeemForm";
import { SplitForm } from "./SplitForm";
import { tokenToolDescription } from "./tokenTools";

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
  const collateral = useSelectedCollateral(market, false);
  const prevDrawerOpenRef = React.useRef<boolean | undefined>(drawerOpen);

  // Reset to "trade" tab whenever drawer opens
  useEffect(() => {
    if (drawerOpen && prevDrawerOpenRef.current === false) {
      // Drawer just opened (transitioned from closed to open)
      setActiveTab("trade");
    }
    prevDrawerOpenRef.current = drawerOpen;
  }, [drawerOpen]);

  // Redemption only opens once the market resolves, so the tab is not offered before then.
  const canRedeem = marketStatus === MarketStatus.CLOSED;
  const visibleTabs = useMemo(
    () => [
      { id: "trade" as const, label: "Trade" },
      { id: "mint" as const, label: "Mint" },
      { id: "merge" as const, label: "Merge" },
      ...(canRedeem ? [{ id: "redeem" as const, label: "Redeem" }] : []),
    ],
    [canRedeem],
  );

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) setActiveTab("trade");
  }, [visibleTabs, activeTab]);

  const tabs = useMemo(
    () => (
      <MarketTabList
        idPrefix={tabsId}
        label="Market actions"
        value={activeTab}
        onChange={setActiveTab}
        fill
        tabs={visibleTabs}
      />
    ),
    [activeTab, tabsId, visibleTabs],
  );

  useEffect(() => {
    if (onTabsChange) {
      onTabsChange(tabs);
    }
  }, [tabs, onTabsChange]);

  return (
    <div className="seer-drawer-panel">
      {visibleTabs.map(({ id: tab }) => (
        <div
          key={tab}
          role="tabpanel"
          id={`${tabsId}-panel-${tab}`}
          aria-labelledby={`${tabsId}-tab-${tab}`}
          hidden={activeTab !== tab}
          tabIndex={0}
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--seer-brand-purple)] rounded-control"
        >
          {activeTab === tab && tab !== "trade" && (
            <p className="mb-4 text-[14px] leading-relaxed text-[var(--seer-muted)]">
              {tokenToolDescription(tab, collateral.symbol)}
            </p>
          )}
          {activeTab === tab && tab === "trade" && swapWidget}
          {activeTab === tab && tab === "mint" && <SplitForm account={account} market={market} />}
          {activeTab === tab && tab === "merge" && <MergeForm account={account} market={market} />}
          {activeTab === tab && tab === "redeem" && <RedeemForm account={account} market={market} />}
        </div>
      ))}
    </div>
  );
}

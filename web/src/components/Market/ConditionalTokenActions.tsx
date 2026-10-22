import { useSelectedCollateral } from "@/hooks/useSelectedCollateral";
import { ArrowDropDown, ArrowDropUp } from "@/lib/icons";
import { useTokenInfo } from "@seer-pm/react";
import { Market, MarketStatus, getMarketStatus } from "@seer-pm/sdk";
import { useId, useState } from "react";
import { Address } from "viem";
import { MarketTabList } from "./MarketTabList";
import { MergeForm } from "./MergeForm";
import { RedeemForm } from "./RedeemForm";
import { SplitForm } from "./SplitForm";
import { type TokenTool, tokenToolDescription } from "./tokenTools";

interface ConditionalTokenActionsProps {
  account?: Address;
  market: Market;
  outcomeIndex: number;
  expanded?: boolean;
}

const titles: Record<TokenTool, string> = {
  mint: "Mint",
  merge: "Merge",
  redeem: "Redeem",
};

export function ConditionalTokenActions({
  account,
  market,
  outcomeIndex,
  expanded = false,
}: ConditionalTokenActionsProps) {
  const [activeTab, setActiveTab] = useState<TokenTool>("mint");
  const tabsId = useId();
  const { data: outcomeToken, isPending } = useTokenInfo(market.wrappedTokens[outcomeIndex], market.chainId);
  const collateral = useSelectedCollateral(market, false);
  const marketStatus = getMarketStatus(market);
  const [isShow, setShow] = useState(false);
  // Redemption only opens once the market resolves, so the tab is not offered before then.
  const tools: TokenTool[] = marketStatus === MarketStatus.CLOSED ? ["mint", "merge", "redeem"] : ["mint", "merge"];
  const renderActionBox = () => (
    <div className="card p-[24px] shadow-md">
      {/* Expanded, the box sits under its caller's heading and the selected tab already names the action. */}
      {!expanded && <div className="text-[24px] font-semibold mb-[20px]">{titles[activeTab]}</div>}
      <MarketTabList
        idPrefix={tabsId}
        label="Token tools"
        value={activeTab}
        onChange={setActiveTab}
        fill
        tabs={tools.map((tool) => ({ id: tool, label: titles[tool] }))}
      />
      {tools.map((tab) => (
        <div
          key={tab}
          role="tabpanel"
          id={`${tabsId}-panel-${tab}`}
          aria-labelledby={`${tabsId}-tab-${tab}`}
          hidden={activeTab !== tab}
          tabIndex={0}
        >
          {activeTab === tab && (
            <p className="mb-4 text-[14px] leading-relaxed text-[var(--seer-muted)]">
              {tokenToolDescription(tab, collateral.symbol)}
            </p>
          )}
          {activeTab === tab && tab === "mint" && <SplitForm account={account} market={market} />}
          {activeTab === tab && tab === "merge" && <MergeForm account={account} market={market} />}
          {activeTab === tab && tab === "redeem" && <RedeemForm account={account} market={market} />}
        </div>
      ))}
    </div>
  );

  if (marketStatus === MarketStatus.CLOSED) {
    if (isPending) {
      return <div className="shimmer-container w-full h-[400px]"></div>;
    }
    return renderActionBox();
  }
  if (!outcomeToken) {
    return null;
  }

  if (expanded) return renderActionBox();

  return (
    <div className="space-y-2">
      <div className="card shadow-md">
        <button
          type="button"
          onClick={() => setShow((state) => !state)}
          className="w-full p-2 flex items-center justify-center gap-2"
        >
          <p className="font-semibold">More</p>
          <div>{isShow ? <ArrowDropUp /> : <ArrowDropDown />}</div>
        </button>
      </div>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isShow ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {renderActionBox()}
      </div>
    </div>
  );
}

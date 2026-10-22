import { ArrowDropDown, ArrowDropUp } from "@/lib/icons";
import { useTokenInfo } from "@seer-pm/react";
import { Market, MarketStatus, getMarketStatus } from "@seer-pm/sdk";
import { useId, useState } from "react";
import { Address } from "viem";
import { MarketTabList } from "./MarketTabList";
import { MergeForm } from "./MergeForm";
import { RedeemForm } from "./RedeemForm";
import { SplitForm } from "./SplitForm";

interface ConditionalTokenActionsProps {
  account?: Address;
  market: Market;
  outcomeIndex: number;
  expanded?: boolean;
}

const titles = {
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
  const [activeTab, setActiveTab] = useState<"mint" | "merge" | "redeem">("mint");
  const tabsId = useId();
  const { data: outcomeToken, isPending } = useTokenInfo(market.wrappedTokens[outcomeIndex], market.chainId);
  const marketStatus = getMarketStatus(market);
  const [isShow, setShow] = useState(false);
  const renderActionBox = () => (
    <div className="card p-[24px] shadow-md">
      <div className="text-[24px] font-semibold mb-[20px]">{titles[activeTab]}</div>
      <MarketTabList
        idPrefix={tabsId}
        label="Token tools"
        value={activeTab}
        onChange={setActiveTab}
        fill
        tabs={[
          { id: "mint", label: "Mint" },
          { id: "merge", label: "Merge" },
          { id: "redeem", label: "Redeem" },
        ]}
      />
      {(["mint", "merge", "redeem"] as const).map((tab) => (
        <div
          key={tab}
          role="tabpanel"
          id={`${tabsId}-panel-${tab}`}
          aria-labelledby={`${tabsId}-tab-${tab}`}
          hidden={activeTab !== tab}
          tabIndex={0}
        >
          {activeTab === tab && tab === "mint" && <SplitForm account={account} market={market} />}
          {activeTab === tab && tab === "merge" && <MergeForm account={account} market={market} />}
          {activeTab === tab &&
            tab === "redeem" &&
            (marketStatus === MarketStatus.CLOSED ? (
              <RedeemForm account={account} market={market} />
            ) : (
              <p>Redemptions are not available yet.</p>
            ))}
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

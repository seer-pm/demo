import { Market } from "@/hooks/useMarket";
import { MarketStatus, getMarketStatus } from "@/hooks/useMarketStatus";
import { ArrowDropDown, ArrowDropUp } from "@/lib/icons";
import { useState } from "react";
import { Address } from "viem";
import { MergeForm } from "./MergeForm";
import { RedeemForm } from "./RedeemForm";
import { SplitForm } from "./SplitForm";

interface ConditionalTokenActionsProps {
  account?: Address;
  router: Address;
  market: Market;
}

const titles = {
  mint: "Mint",
  merge: "Merge",
  redeem: "Redeem",
};

export function ConditionalTokenActions({ account, router, market }: ConditionalTokenActionsProps) {
  const [activeTab, setActiveTab] = useState<"mint" | "merge" | "redeem">("mint");

  const marketStatus = getMarketStatus(market);
  const [isShow, setShow] = useState(false);
  const renderActionBox = () => (
    <div className="bg-white p-[24px] drop-shadow">
      <div className="text-[24px] font-semibold mb-[20px]">{titles[activeTab]}</div>
      <div role="tablist" className="tabs tabs-bordered font-semibold mb-[32px] overflow-x-auto custom-scrollbar pb-1">
        <button
          type="button"
          role="tab"
          className={`tab ${activeTab === "mint" && "tab-active"}`}
          onClick={() => setActiveTab("mint")}
        >
          Mint
        </button>
        <button
          type="button"
          role="tab"
          className={`tab ${activeTab === "merge" && "tab-active"}`}
          onClick={() => setActiveTab("merge")}
        >
          Merge
        </button>
        <button
          type="button"
          role="tab"
          className={`tab ${activeTab === "redeem" && "tab-active"}`}
          onClick={() => setActiveTab("redeem")}
        >
          Redeem
        </button>
      </div>

      {activeTab === "mint" && <SplitForm account={account} router={router} market={market} />}

      {activeTab === "merge" && <MergeForm account={account} market={market} router={router} />}

      {activeTab === "redeem" &&
        (marketStatus === MarketStatus.CLOSED ? (
          <RedeemForm account={account} market={market} router={router} />
        ) : (
          "Redemptions are not available yet."
        ))}
    </div>
  );
  if (marketStatus === MarketStatus.CLOSED) {
    return renderActionBox();
  }
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setShow((state) => !state)}
        className="w-full bg-white p-2 drop-shadow flex items-center justify-center gap-2"
      >
        <p className="font-semibold">More</p>
        <div>{isShow ? <ArrowDropUp /> : <ArrowDropDown />}</div>
      </button>
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

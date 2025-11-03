import { Market } from "@/lib/market";
import { useState } from "react";
import { clientOnly } from "vike-react/clientOnly";
import Activity from "./Activity";
import { RelatedMarkets } from "./RelatedMarkets";
import TopHolders from "./TopHolders";

const Comments = clientOnly(() => import("./Comments"));

export default function MarketTabs({ market }: { market: Market }) {
  const [activeTab, setActiveTab] = useState<"comments" | "conditionalMarkets" | "topHolders" | "activity">("comments");
  return (
    <div>
      <div role="tablist" className="tabs tabs-bordered font-semibold mb-[32px] overflow-x-auto custom-scrollbar pb-1">
        <button
          type="button"
          role="tab"
          className={`tab text-[16px] ${activeTab === "comments" && "tab-active"}`}
          onClick={() => setActiveTab("comments")}
        >
          Comments
        </button>
        <button
          type="button"
          role="tab"
          className={`tab text-[16px] whitespace-nowrap ${activeTab === "conditionalMarkets" && "tab-active"}`}
          onClick={() => setActiveTab("conditionalMarkets")}
        >
          Related Conditional Markets
        </button>
        <button
          type="button"
          role="tab"
          className={`tab text-[16px] whitespace-nowrap ${activeTab === "topHolders" && "tab-active"}`}
          onClick={() => setActiveTab("topHolders")}
        >
          Top Holders
        </button>
        <button
          type="button"
          role="tab"
          className={`tab text-[16px] whitespace-nowrap ${activeTab === "activity" && "tab-active"}`}
          onClick={() => setActiveTab("activity")}
        >
          Activity
        </button>
      </div>
      {activeTab === "comments" && <Comments market={market} />}
      {activeTab === "conditionalMarkets" && <RelatedMarkets market={market} />}
      {activeTab === "topHolders" && <TopHolders market={market} />}
      {activeTab === "activity" && <Activity market={market} />}
    </div>
  );
}

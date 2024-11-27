import { Market } from "@/hooks/useMarket";
import { useState } from "react";
import Comments from "./Comments";
import { RelatedMarkets } from "./RelatedMarkets";

export default function MarketTabs({ market }: { market: Market }) {
  const [activeTab, setActiveTab] = useState<"comments" | "conditionalMarkets">("comments");
  return (
    <div>
      <div
        role="tablist"
        className="tabs tabs-bordered font-semibold mb-[32px] overflow-x-auto custom-scrollbar pb-1 w-fit"
      >
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
          className={`tab text-[16px] ${activeTab === "conditionalMarkets" && "tab-active"}`}
          onClick={() => setActiveTab("conditionalMarkets")}
        >
          Related Conditional Markets
        </button>
      </div>
      {activeTab === "comments" && <Comments market={market} />}
      {activeTab === "conditionalMarkets" && <RelatedMarkets market={market} />}
    </div>
  );
}

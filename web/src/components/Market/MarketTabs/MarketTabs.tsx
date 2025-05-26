import { Market } from "@/hooks/useMarket";
import { useState } from "react";
import { clientOnly } from "vike-react/clientOnly";
import { RelatedMarkets } from "./RelatedMarkets";

const Comments = clientOnly(() => import("./Comments"));

export default function MarketTabs({ market }: { market: Market }) {
  const [activeTab, setActiveTab] = useState<"comments" | "conditionalMarkets">("comments");
  return (
    <div>
      <div
        role="tablist"
        className="tabs tabs-bordered font-semibold mb-[32px] overflow-x-auto custom-scrollbar pb-1 max-w-[400px]"
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
          className={`tab text-[16px] whitespace-nowrap ${activeTab === "conditionalMarkets" && "tab-active"}`}
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

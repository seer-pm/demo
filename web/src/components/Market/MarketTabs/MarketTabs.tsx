import { Market, marketSupportsOrderBook } from "@seer-pm/sdk";
import { useState } from "react";
import { clientOnly } from "vike-react/clientOnly";
import Activity from "./Activity";
import { RelatedMarkets } from "./RelatedMarkets";
import TopHolders from "./TopHolders";

const Comments = clientOnly(() => import("./Comments"));
const OpenOrders = clientOnly(() => import("../OpenOrders/OpenOrders"));

export default function MarketTabs({ market }: { market: Market }) {
  const [relatedMarketsCount, setRelatedMarketsCount] = useState(0);
  const showOpenOrders = marketSupportsOrderBook(market);
  const [activeTab, setActiveTab] = useState<
    "comments" | "conditionalMarkets" | "topHolders" | "activity" | "openOrders"
  >("comments");
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
          Related Conditional Markets{relatedMarketsCount > 0 ? ` (${relatedMarketsCount})` : ""}
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
        {showOpenOrders && (
          <button
            type="button"
            role="tab"
            className={`tab text-[16px] whitespace-nowrap ${activeTab === "openOrders" && "tab-active"}`}
            onClick={() => setActiveTab("openOrders")}
          >
            Open orders
          </button>
        )}
      </div>
      {activeTab === "comments" && <Comments market={market} />}
      {activeTab === "conditionalMarkets" && (
        <RelatedMarkets market={market} setRelatedMarketsCount={(count: number) => setRelatedMarketsCount(count)} />
      )}
      {activeTab === "topHolders" && <TopHolders market={market} />}
      {activeTab === "activity" && <Activity market={market} />}
      {activeTab === "openOrders" && showOpenOrders && <OpenOrders market={market} />}
    </div>
  );
}

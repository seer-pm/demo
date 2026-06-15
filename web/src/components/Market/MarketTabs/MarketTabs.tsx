import { Market } from "@seer-pm/sdk";
import clsx from "clsx";
import { useState } from "react";
import { clientOnly } from "vike-react/clientOnly";
import Activity from "./Activity";
import { RelatedMarkets } from "./RelatedMarkets";
import TopHolders from "./TopHolders";

const Comments = clientOnly(() => import("./Comments"));

export default function MarketTabs({ market }: { market: Market }) {
  const [relatedMarketsCount, setRelatedMarketsCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"comments" | "conditionalMarkets" | "topHolders" | "activity">("comments");
  return (
    <div className="card-box p-[22px]">
      <div role="tablist" className="flex gap-1.5 flex-wrap mb-[24px] overflow-x-auto custom-scrollbar pb-1">
        <button
          type="button"
          role="tab"
          className={clsx("tab-pill", activeTab === "comments" && "active")}
          onClick={() => setActiveTab("comments")}
        >
          Comments
        </button>
        <button
          type="button"
          role="tab"
          className={clsx("tab-pill whitespace-nowrap", activeTab === "conditionalMarkets" && "active")}
          onClick={() => setActiveTab("conditionalMarkets")}
        >
          Related Conditional Markets
          {relatedMarketsCount > 0 ? <span className="count">{relatedMarketsCount}</span> : ""}
        </button>
        <button
          type="button"
          role="tab"
          className={clsx("tab-pill whitespace-nowrap", activeTab === "topHolders" && "active")}
          onClick={() => setActiveTab("topHolders")}
        >
          Top Holders
        </button>
        <button
          type="button"
          role="tab"
          className={clsx("tab-pill whitespace-nowrap", activeTab === "activity" && "active")}
          onClick={() => setActiveTab("activity")}
        >
          Activity
        </button>
      </div>
      {activeTab === "comments" && <Comments market={market} />}
      {activeTab === "conditionalMarkets" && (
        <RelatedMarkets market={market} setRelatedMarketsCount={(count: number) => setRelatedMarketsCount(count)} />
      )}
      {activeTab === "topHolders" && <TopHolders market={market} />}
      {activeTab === "activity" && <Activity market={market} />}
    </div>
  );
}

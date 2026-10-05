import { Spinner } from "@/components/Spinner";
import { useMarketHolders } from "@/hooks/useMarketHolders";
import { Market } from "@seer-pm/sdk";
import { useState } from "react";
import { clientOnly } from "vike-react/clientOnly";
import Activity from "./Activity";
import { RelatedMarkets } from "./RelatedMarkets";
import TopHolders from "./TopHolders";

const Comments = clientOnly(() => import("./Comments"));

function CommentsFallback() {
  return (
    <output className="flex w-full justify-center p-8" aria-busy="true" aria-label="Loading comments">
      <Spinner />
    </output>
  );
}

export default function MarketTabs({ market }: { market: Market }) {
  // Prefetch holders + activity data while user is on other tabs to avoid Netlify cold start on first request
  useMarketHolders(market);

  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [relatedMarketsCount, setRelatedMarketsCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"conditionalMarkets" | "topHolders" | "activity">("activity");
  return (
    <div>
      <div role="tablist" className="tabs tabs-bordered font-semibold mb-[32px] overflow-x-auto custom-scrollbar pb-1">
        <button
          type="button"
          role="tab"
          className={`tab text-[16px] whitespace-nowrap ${activeTab === "conditionalMarkets" && "tab-active"}`}
          onClick={() => setActiveTab("conditionalMarkets")}
        >
          Related markets{relatedMarketsCount > 0 ? ` (${relatedMarketsCount})` : ""}
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

      {activeTab === "conditionalMarkets" && (
        <RelatedMarkets market={market} setRelatedMarketsCount={(count: number) => setRelatedMarketsCount(count)} />
      )}
      {activeTab === "topHolders" && <TopHolders market={market} />}
      {activeTab === "activity" && <Activity market={market} />}
      <details
        className="event-discussion-disclosure"
        onToggle={(event) => setDiscussionOpen(event.currentTarget.open)}
      >
        <summary>
          <span>
            <strong>Discussion</strong>
            <small>Questions, sources & perspectives</small>
          </span>
          <span className="event-discussion-action">{discussionOpen ? "Close" : "Join discussion"}</span>
        </summary>
        {discussionOpen && <Comments market={market} fallback={<CommentsFallback />} />}
      </details>
    </div>
  );
}

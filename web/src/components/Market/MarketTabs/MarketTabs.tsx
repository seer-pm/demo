import { Spinner } from "@/components/Spinner";
import { useMarketHolders } from "@/hooks/useMarketHolders";
import { Market } from "@seer-pm/sdk";
import { useId, useState } from "react";
import { clientOnly } from "vike-react/clientOnly";
import { MarketTabList } from "../MarketTabList";
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

  const [relatedMarketsCount, setRelatedMarketsCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"conditionalMarkets" | "topHolders" | "activity">("activity");
  const tabsId = useId();
  return (
    <div>
      <section className="event-comments" aria-labelledby="market-comments-heading">
        <header>
          <h2 id="market-comments-heading">Comments</h2>
          <p>Share a source, ask a question, or add your perspective.</p>
        </header>
        <Comments market={market} fallback={<CommentsFallback />} />
      </section>
      <MarketTabList
        idPrefix={tabsId}
        label="Market data"
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "activity", label: "Activity" },
          { id: "topHolders", label: "Top holders" },
          {
            id: "conditionalMarkets",
            label: `Related markets${relatedMarketsCount > 0 ? ` (${relatedMarketsCount})` : ""}`,
          },
        ]}
      />
      {(["activity", "topHolders", "conditionalMarkets"] as const).map((tab) => (
        <div
          key={tab}
          role="tabpanel"
          id={`${tabsId}-panel-${tab}`}
          aria-labelledby={`${tabsId}-tab-${tab}`}
          hidden={activeTab !== tab}
          tabIndex={0}
        >
          {activeTab === tab && tab === "activity" && <Activity market={market} />}
          {activeTab === tab && tab === "topHolders" && <TopHolders market={market} />}
          {activeTab === tab && tab === "conditionalMarkets" && (
            <RelatedMarkets market={market} setRelatedMarketsCount={setRelatedMarketsCount} />
          )}
        </div>
      ))}
    </div>
  );
}

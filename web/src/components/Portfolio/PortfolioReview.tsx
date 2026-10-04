import { useSearchParams } from "@/hooks/useSearchParams";
import { useState } from "react";
import { BrandStreak } from "../Layout/BrandStreak";
import PortfolioOverview, { PerformanceChart, type ReviewRange } from "./PortfolioOverview";
import PositionsTab from "./PositionsTab";
import { REVIEW_POSITIONS, REVIEW_SERIES } from "./portfolio-review-data";

function AllocationReviewChart() {
  const [range, setRange] = useState<"All" | "1M" | "1W">("All");
  const [inspected, setInspected] = useState<number>();
  const samples = {
    All: [0, 14000, 21000, 38000, 46000, 74000, 82000, 105000, 112000, 137000, 148000, 171000, 185363.626],
    "1M": [112000, 119000, 126000, 137000, 145000, 148000, 158000, 171000, 181000, 185363.626],
    "1W": [171000, 173000, 176000, 179000, 180000, 183000, 185363.626],
  };
  return (
    <section className="portfolio-rewards-context">
      <div className="portfolio-chart-heading">
        <div>
          <small>ALLOCATION OVER TIME</small>
          <h3>
            {(inspected ?? 185363.626).toLocaleString("en-US", { maximumFractionDigits: 3 })} <small>SEER</small>
          </h3>
        </div>
        <div className="portfolio-ranges">
          {(["1W", "1M", "All"] as const).map((period) => (
            <button
              key={period}
              type="button"
              aria-pressed={range === period}
              onClick={() => {
                setRange(period);
                setInspected(undefined);
              }}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      <PerformanceChart
        key={range}
        unit="SEER"
        series={{
          points: samples[range],
          start: range === "1W" ? "2026-09-22" : range === "1M" ? "2026-08-29" : "2026-07-01",
          end: "2026-09-29",
        }}
        onInspect={(value) => setInspected(value)}
      />
      <p className="portfolio-muted">Illustrative allocation history · SEER, not cash value</p>
    </section>
  );
}

export default function PortfolioReview() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "airdrop" ? "airdrop" : params.get("tab") === "history" ? "history" : "positions";
  const [period, setPeriod] = useState<ReviewRange>("All");
  const series = REVIEW_SERIES[period];
  const setTab = (value: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", value);
      return next;
    });
  return (
    <div className="container-fluid portfolio-page">
      <div className="portfolio-page-heading">
        <div>
          <h1>Your portfolio</h1>
          <p>A clearer view of every position.</p>
        </div>
        <span className="portfolio-demo-label">Design preview · illustrative data</span>
      </div>
      {tab !== "airdrop" && (
        <PortfolioOverview
          value={262.21}
          delta={3}
          deltaPercent={1.16}
          positionsValue={175.66}
          available={86.55}
          pnl={series.points[series.points.length - 1]}
          period={period}
          onPeriodChange={setPeriod}
          series={series}
        />
      )}
      <div className="portfolio-view-tabs" role="tablist" aria-label="Portfolio sections">
        {["positions", "history", "airdrop"].map((name, index, names) => (
          <button
            key={name}
            type="button"
            role="tab"
            id={`review-${name}`}
            aria-controls="review-panel"
            aria-selected={tab === name}
            tabIndex={tab === name ? 0 : -1}
            onClick={() => setTab(name)}
            onKeyDown={(e) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const next =
                  e.key === "Home" ? 0 : e.key === "End" ? 2 : (index + (e.key === "ArrowRight" ? 1 : 2)) % 3;
                setTab(names[next]);
                document.getElementById(`review-${names[next]}`)?.focus();
              }
            }}
          >
            {name[0].toUpperCase() + name.slice(1)}
            {name === "positions" && <span>2</span>}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="review-panel" aria-labelledby={`review-${tab}`}>
        {tab === "positions" && <PositionsTab account={undefined} chainId={100} reviewData={REVIEW_POSITIONS} />}
        {tab === "history" && (
          <div className="portfolio-chart-unavailable">
            The review has no sample trade history. Real account history remains available on public portfolio pages.
          </div>
        )}
        {tab === "airdrop" && (
          <div className="portfolio-rewards">
            <div className="portfolio-page-heading">
              <div>
                <small>YOUR AIRDROP</small>
                <h2>Participation adds up.</h2>
                <p>Your SEER allocation, all in one place.</p>
              </div>
              <span>Across all chains</span>
            </div>
            <div className="portfolio-rewards-grid">
              <section className="portfolio-rewards-hero">
                <BrandStreak className="portfolio-rewards-streak" />
                <p>Total SEER to date</p>
                <h3>
                  185,363<span>.626</span>
                </h3>
                <small>SEER</small>
                <p>Built through your holdings and Proof of Humanity.</p>
                <a href="#review-rewards-sources">Explore your breakdown ↓</a>
              </section>
              <AllocationReviewChart />
            </div>
            <div id="review-rewards-sources" className="portfolio-rewards-grid">
              <section className="portfolio-source">
                <small>100% of total</small>
                <h3>Holdings</h3>
                <strong>
                  185,363.626 <small>SEER</small>
                </strong>
                <p>Your holdings contribution across all chains.</p>
                <button type="button" onClick={() => setTab("positions")}>
                  View your positions →
                </button>
              </section>
              <section className="portfolio-source">
                <small>ANOTHER WAY TO PARTICIPATE</small>
                <h3>Proof of Humanity</h3>
                <strong>
                  0 <small>SEER</small>
                </strong>
                <p>Verify that you're a unique person to qualify for additional SEER.</p>
                <a href="https://www.proofofhumanity.id/" target="_blank" rel="noreferrer">
                  Explore verification ↗
                </a>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

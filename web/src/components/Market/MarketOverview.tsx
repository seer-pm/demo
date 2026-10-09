import { SUPPORTED_CHAINS } from "@/lib/chains";
import { formatBigNumbers } from "@/lib/utils";
import { useMarketOdds } from "@seer-pm/react";
import { type Market, STATUS_TEXTS, getMarketStatus, getMarketType } from "@seer-pm/sdk";
import { useState } from "react";
import { DisplayOdds } from "./DisplayOdds";
import MarketFavorite from "./Header/MarketFavorite";
import MarketChart from "./MarketChart/MarketChart";

export function MarketOverview({ market, selected }: { market: Market; selected: number }) {
  const { data: odds = [] } = useMarketOdds(market, true);
  const [chartFocus, setChartFocus] = useState(false);
  const status = getMarketStatus(market);
  return (
    <section className="event-overview" aria-label="Event overview">
      <header className="event-heading">
        <div className="event-kicker">
          <span>SEER MARKETS</span>
          <span>{status ? STATUS_TEXTS[status](market.liquidityUSD > 0) : "Market"}</span>
        </div>
        <div className="event-title-row">
          {market.images?.market && <img src={market.images.market} alt="" />}
          <h1>{market.marketName}</h1>
          <MarketFavorite market={market} iconWidth="20" />
        </div>
        <div className="event-metrics">
          <span>
            <small>Volume</small>
            <strong>${formatBigNumbers(market.volumeUSD)}</strong>
          </span>
          <span>
            <small>Liquidity</small>
            <strong>${formatBigNumbers(market.liquidityUSD)}</strong>
          </span>
          <span>
            <small>Network</small>
            <strong>{SUPPORTED_CHAINS[market.chainId]?.name}</strong>
          </span>
          <a
            href="#event-rules"
            onClick={() => {
              const rules = document.getElementById("event-rules");
              if (rules instanceof HTMLDetailsElement) rules.open = true;
            }}
          >
            Rules & settlement ↗
          </a>
        </div>
      </header>
      <div className="event-chart-summary">
        <div>
          <span className="event-selected-label">Selected outcome</span>
          <h2>{market.outcomes[selected]}</h2>
        </div>
        <strong className="event-selected-odds">
          <DisplayOdds odd={odds[selected]} marketType={getMarketType(market)} />
        </strong>
      </div>
      <div className="event-chart-switch" aria-label="Chart scope">
        <button type="button" aria-pressed={!chartFocus} onClick={() => setChartFocus(false)}>
          Compare outcomes
        </button>
        <button type="button" aria-pressed={chartFocus} onClick={() => setChartFocus(true)}>
          Selected outcome
        </button>
      </div>
      <MarketChart market={market} outcomeIndex={chartFocus ? selected : undefined} />
    </section>
  );
}

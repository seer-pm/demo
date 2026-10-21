import { SearchIcon } from "@/lib/icons";
import { isTextInString } from "@/lib/utils";
import { usePortfolioCostBasis, usePortfolioMarketPnL, usePortfolioPositions } from "@seer-pm/react";
import { getActiveCollateralProfile } from "@seer-pm/sdk";
import type { PortfolioChainId, PortfolioPnLPeriod } from "@seer-pm/sdk";
import { useMemo, useState } from "react";
import { Address } from "viem";
import { Alert } from "../Alert";
import Input from "../Form/Input";
import PositionsTable from "./PositionsTable";
import {
  type CostBasisLookup,
  MARKET_PNL_PERIOD_LABEL,
  type MarketPnlLookup,
  indexCostBasis,
  indexMarketPnl,
} from "./marketPnl";

function PositionsTab({
  account,
  chainId,
  period,
}: { account: Address | undefined; chainId: PortfolioChainId; period: PortfolioPnLPeriod }) {
  const { data: positions = [], isLoading, error, refetch, isFetching } = usePortfolioPositions(account, chainId);
  const marketPnlQuery = usePortfolioMarketPnL(account, chainId, period);
  const marketPnl = useMemo<MarketPnlLookup>(
    () => ({
      byKey: indexMarketPnl(marketPnlQuery.data?.rows ?? []),
      period,
      loaded: marketPnlQuery.data !== undefined,
      notComputed: marketPnlQuery.data?.computed === false,
      error: marketPnlQuery.error ? "Couldn't load per-market P/L." : undefined,
    }),
    [marketPnlQuery.data, marketPnlQuery.error, period],
  );
  const costBasisQuery = usePortfolioCostBasis(account, chainId);
  const costBasis = useMemo<CostBasisLookup>(
    () => ({
      byKey: indexCostBasis(costBasisQuery.data?.rows ?? []),
      loaded: costBasisQuery.data !== undefined,
      notComputed: costBasisQuery.data?.computed === false,
      error: costBasisQuery.error ? "Couldn't load cost basis." : undefined,
    }),
    [costBasisQuery.data, costBasisQuery.error],
  );
  const [showArchived, setShowArchived] = useState(false);
  const [filterMarketName, setFilterMarketName] = useState("");

  const filteredPositions =
    positions.filter((position) => {
      const isMatchName = isTextInString(filterMarketName, position.marketName);
      const isMatchOutcome = isTextInString(filterMarketName, position.outcome);
      return (isMatchName || isMatchOutcome) && (showArchived || !position.isWorthless);
    }) ?? [];

  const renderTable = () => {
    if (isLoading) {
      return (
        <div aria-busy="true" aria-live="polite">
          <span className="sr-only">Loading positions</span>
          <div className="shimmer-container w-full h-[200px]" aria-hidden />
        </div>
      );
    }
    if (!filteredPositions.length && filterMarketName) {
      return (
        <Alert type="info" title="No matching positions">
          Nothing matches “{filterMarketName}”. Clear search to see all positions.
        </Alert>
      );
    }
    if (!filteredPositions.length) {
      return (
        <Alert type="info" title="No positions">
          {chainId === "all"
            ? "This profile has no outcome tokens on any chain."
            : "This profile has no outcome tokens on the selected chain."}
        </Alert>
      );
    }
    return (
      <PositionsTable
        account={account}
        chainId={chainId}
        data={filteredPositions}
        marketPnl={marketPnl}
        costBasis={costBasis}
      />
    );
  };

  if (error) {
    return (
      <Alert type="error" title="Couldn't load positions">
        <div className="space-y-3">
          <p>Try again in a moment.</p>
          <button
            type="button"
            className="btn btn-sm btn-primary min-h-11"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            {isFetching ? "Retrying…" : "Try again"}
          </button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="portfolio-positions">
      <div className="portfolio-position-search">
        <label className="sr-only" htmlFor="positions-search">
          Search by market or outcome
        </label>
        <Input
          id="positions-search"
          placeholder="Search by market or outcome"
          className="w-full"
          icon={<SearchIcon />}
          value={filterMarketName}
          isClearable
          onClear={() => setFilterMarketName("")}
          onChange={(event) => setFilterMarketName(event.target.value)}
        />
      </div>
      <label className="portfolio-archived">
        <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />{" "}
        Show archived
      </label>
      <details className="portfolio-definitions">
        <summary>
          {chainId === "all" ? "Collateral labelled per row" : getActiveCollateralProfile(chainId).primary.symbol} ·
          Prices, entry, cost, value, traded and P/L · How values work
        </summary>
        <p>
          Price and value are in each chain's collateral (sDAI, sUSDS, and others), not USD. Value is marked at the
          current pool price, so the price you get when trading may differ.
        </p>
        <p>
          Avg. entry is the weighted-average cost of the shares you still hold, and Cost is that average times the
          shares. A split spreads its collateral across the outcomes by their pool prices at the time; a buy on a
          conditional market inherits the cost of the parent outcome it was paid with. The P&L under Value is value
          minus cost, with its return on cost. Positions that went through a liquidity pool show no entry price yet. A
          figure marked ≈ rests on an event the indexers could not pin down.
        </p>
        <p>
          Traded and Market P/L are per market, so every outcome you hold on the same market repeats the same two
          figures. Traded is the gross amount this wallet swapped on the market (buys plus sells) over the selected
          period ({MARKET_PNL_PERIOD_LABEL[period]}), counted 1/N on conditional markets. P/L is the mark-to-market gain
          or loss on that market over the same period, including liquidity positions. Both follow the range picked in
          the overview above and refresh with the P/L job, so a trade made minutes ago may not be counted yet.
        </p>
      </details>
      {renderTable()}
      <div className="portfolio-results">
        <span>
          {filteredPositions.length} of {positions.length} positions
          {showArchived ? " · including archived where supplied" : ""}
        </span>
        <span>Marked value · execution price may differ</span>
      </div>
    </div>
  );
}

export default PositionsTab;

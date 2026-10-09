import { SearchIcon } from "@/lib/icons";
import { isTextInString } from "@/lib/utils";
import { usePortfolioPositions } from "@seer-pm/react";
import { getActiveCollateralProfile } from "@seer-pm/sdk";
import type { PortfolioChainId } from "@seer-pm/sdk";
import { useState } from "react";
import { Address } from "viem";
import { Alert } from "../Alert";
import Input from "../Form/Input";
import PositionsTable from "./PositionsTable";

function PositionsTab({ account, chainId }: { account: Address | undefined; chainId: PortfolioChainId }) {
  const { data: positions = [], isLoading, error, refetch, isFetching } = usePortfolioPositions(account, chainId);
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
    return <PositionsTable account={account} chainId={chainId} data={filteredPositions} />;
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
          Prices and value · How values work
        </summary>
        <p>
          Price and value are in each chain's collateral (sDAI, sUSDS, and others), not USD. Value is marked at the
          current pool price, so the price you get when trading may differ.
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

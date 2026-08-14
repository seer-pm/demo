import { SearchIcon } from "@/lib/icons";
import { isTextInString } from "@/lib/utils";
import { usePortfolioPositions } from "@seer-pm/react";
import type { PortfolioChainId } from "@seer-pm/sdk";
import { useState } from "react";
import { Address } from "viem";
import { Alert } from "../Alert";
import Input from "../Form/Input";
import PositionsTable from "./PositionsTable";

function PositionsTab({ account, chainId }: { account: Address | undefined; chainId: PortfolioChainId }) {
  const { data: positions = [], isLoading, error, refetch, isFetching } = usePortfolioPositions(account, chainId);
  const [filterMarketName, setFilterMarketName] = useState("");

  const filteredPositions =
    positions.filter((position) => {
      const isMatchName = isTextInString(filterMarketName, position.marketName);
      const isMatchOutcome = isTextInString(filterMarketName, position.outcome);
      return isMatchName || isMatchOutcome;
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
          This profile has no outcome tokens on the selected chain.
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
    <div>
      <div className="grow mb-6">
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
      {renderTable()}
    </div>
  );
}

export default PositionsTab;

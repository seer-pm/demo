import { SearchIcon } from "@/lib/icons";
import { isTextInString } from "@/lib/utils";
import { usePortfolioValue } from "@seer-pm/react";
import type { SupportedChain } from "@seer-pm/sdk";
import { useState } from "react";
import { Address } from "viem";
import { Alert } from "../Alert";
import Input from "../Form/Input";
import PositionsTable from "./PositionsTable";

function PositionsTab({ account, chainId }: { account: Address | undefined; chainId: SupportedChain }) {
  const { data, isLoading, error } = usePortfolioValue(account, chainId);
  const positions = data?.positions ?? [];
  const [filterMarketName, setFilterMarketName] = useState("");
  const marketNameCallback = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setFilterMarketName((event.target as HTMLInputElement).value);
  };

  const filteredPositions =
    positions.filter((position) => {
      const isMatchName = isTextInString(filterMarketName, position.marketName);
      const isMatchOutcome = isTextInString(filterMarketName, position.outcome);
      return isMatchName || isMatchOutcome;
    }) ?? [];
  const renderTable = () => {
    if (isLoading) {
      return <div className="shimmer-container w-full h-[200px]" />;
    }
    return !filteredPositions.length ? (
      <Alert type="warning">No positions found.</Alert>
    ) : (
      <PositionsTable account={account} chainId={chainId} data={filteredPositions} />
    );
  };
  if (error) {
    return <Alert type="error">{error.message}</Alert>;
  }

  return (
    <div>
      <div className="grow mb-6">
        <Input
          placeholder="Search by market or outcome"
          className="w-full"
          icon={<SearchIcon />}
          onKeyUp={marketNameCallback}
        />
      </div>
      {renderTable()}
    </div>
  );
}

export default PositionsTab;

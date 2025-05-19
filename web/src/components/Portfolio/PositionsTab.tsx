import useCalculatePositionsValue from "@/hooks/portfolio/positionsTab/useCalculatePositionsValue";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { SearchIcon } from "@/lib/icons";
import { isTextInString, isUndefined } from "@/lib/utils";
import { useState } from "react";
import { useAccount } from "wagmi";
import { Alert } from "../Alert";
import Input from "../Form/Input";
import PositionsTable from "./PositionsTable";

function PositionsTab() {
  const { chainId = DEFAULT_CHAIN } = useAccount();
  const { positions, error } = useCalculatePositionsValue();
  const [filterMarketName, setFilterMarketName] = useState("");
  const marketNameCallback = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setFilterMarketName((event.target as HTMLInputElement).value);
  };

  const filteredPositions =
    positions?.filter((position) => {
      const isMatchName = isTextInString(filterMarketName, position.marketName);
      const isMatchOutcome = isTextInString(filterMarketName, position.outcome);
      return isMatchName || isMatchOutcome;
    }) ?? [];
  if (error) {
    return <Alert type="error">{error.message}</Alert>;
  }
  if (isUndefined(positions)) {
    return <div className="shimmer-container w-full h-[200px]" />;
  }
  if (!positions.length) {
    return <Alert type="warning">No positions found.</Alert>;
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
      <PositionsTable chainId={chainId as SupportedChain} data={filteredPositions} />
    </div>
  );
}

export default PositionsTab;

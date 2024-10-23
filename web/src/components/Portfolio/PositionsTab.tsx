import useCalculatePositionsValue from "@/hooks/portfolio/useCalculatePositionsValue";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { SearchIcon } from "@/lib/icons";
import { useState } from "react";
import { useAccount } from "wagmi";
import { Alert } from "../Alert";
import Input from "../Form/Input";
import PositionsTable from "./PositionsTable";

function PositionsTab() {
  const { chainId = DEFAULT_CHAIN } = useAccount();
  const { isGettingPositions, positions } = useCalculatePositionsValue();
  const [filterMarketName, setFilterMarketName] = useState("");
  const marketNameCallback = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setFilterMarketName((event.target as HTMLInputElement).value);
  };
  const filteredPositions =
    positions?.filter((position) => position.marketName.toLowerCase().includes(filterMarketName.toLowerCase())) ?? [];
  return (
    <>
      {isGettingPositions && <div className="shimmer-container w-full h-[200px]" />}

      {!isGettingPositions && !positions?.length && <Alert type="warning">No positions found.</Alert>}

      {!!positions?.length && (
        <div>
          <div className="grow mb-6">
            <Input
              placeholder="Search by Market Name"
              className="w-full"
              icon={<SearchIcon />}
              onKeyUp={marketNameCallback}
            />
          </div>
          <PositionsTable chainId={chainId as SupportedChain} data={filteredPositions} />
        </div>
      )}
    </>
  );
}

export default PositionsTab;

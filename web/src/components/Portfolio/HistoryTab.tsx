import { useHistoryTransactions } from "@/hooks/portfolio/useHistoryTransactions";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { SearchIcon } from "@/lib/icons";
import { useState } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { Alert } from "../Alert";
import Input from "../Form/Input";
import TransactionsTable from "./TransactionsTable";

function HistoryTab() {
  const { chainId = DEFAULT_CHAIN, address } = useAccount();
  const { data: historyTransactions, isLoading } = useHistoryTransactions(
    address as Address,
    chainId as SupportedChain,
  );
  const [filterMarketName, setFilterMarketName] = useState("");
  const marketNameCallback = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setFilterMarketName((event.target as HTMLInputElement).value);
  };
  const filteredTransactions =
    historyTransactions?.filter((tx) => tx.marketName.toLowerCase().includes(filterMarketName.toLowerCase())) ?? [];
  return (
    <>
      {isLoading && <div className="shimmer-container w-full h-[200px]" />}

      {!isLoading && !historyTransactions?.length && <Alert type="warning">No transactions found.</Alert>}

      {!!historyTransactions?.length && (
        <div>
          <div className="grow mb-6">
            <Input
              placeholder="Search by Market Name"
              className="w-full"
              icon={<SearchIcon />}
              onKeyUp={marketNameCallback}
            />
          </div>
          <TransactionsTable chainId={chainId as SupportedChain} data={filteredTransactions} />
        </div>
      )}
    </>
  );
}

export default HistoryTab;

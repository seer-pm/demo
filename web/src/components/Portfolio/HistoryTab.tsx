import { useHistoryTransactions } from "@/hooks/portfolio/historyTab/useHistoryTransactions";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { SearchIcon } from "@/lib/icons";
import { endOfDay, format, startOfDay } from "date-fns";
import { useState } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { Alert } from "../Alert";
import Button from "../Form/Button";
import Input from "../Form/Input";
import DateRangePicker from "./DateRangePicker";
import HistoryTable from "./HistoryTable";

function HistoryTab() {
  const { chainId = DEFAULT_CHAIN, address } = useAccount();
  const { data: historyTransactions, isLoading } = useHistoryTransactions(
    address as Address,
    chainId as SupportedChain,
  );
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isShowDateRangePicker, setShowDateRangePicker] = useState(false);
  const onChangeDate = (dates: (Date | null)[]) => {
    const [start, end] = dates;
    setStartDate(start ?? undefined);
    setEndDate(end ?? undefined);
  };
  const [filterMarketName, setFilterMarketName] = useState("");
  const marketNameCallback = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setFilterMarketName((event.target as HTMLInputElement).value);
  };
  const filteredTransactions =
    historyTransactions?.filter((tx) => {
      const nameFilter = tx.marketName.toLowerCase().includes(filterMarketName.toLowerCase());
      if (!tx.timestamp) return nameFilter;
      const startDateFilter = startDate ? tx.timestamp >= Math.floor(startOfDay(startDate).getTime() / 1000) : true;
      const endDateFilter = endDate ? tx.timestamp <= Math.floor(endOfDay(endDate).getTime() / 1000) : true;
      return nameFilter && startDateFilter && endDateFilter;
    }) ?? [];
  return (
    <>
      {isLoading && <div className="shimmer-container w-full h-[200px]" />}

      {!isLoading && !historyTransactions?.length && <Alert type="warning">No transactions found.</Alert>}

      {!!historyTransactions?.length && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="grow">
              <Input
                placeholder="Search by Market Name"
                className="w-full"
                icon={<SearchIcon />}
                onKeyUp={marketNameCallback}
              />
            </div>
            <div className="relative">
              <Button
                type="button"
                variant="secondary"
                text={
                  !startDate && !endDate
                    ? "Filter By Date"
                    : `${startDate ? format(startDate, "MMM d, yyyy") : "_"} - ${endDate ? format(endDate, "MMM d, yyyy") : "_"}`
                }
                onClick={() => setShowDateRangePicker((state) => !state)}
              />
              {isShowDateRangePicker && (
                <div className="absolute right-0 top-[60px]">
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onChange={onChangeDate}
                    onClose={() => setShowDateRangePicker(false)}
                  />
                </div>
              )}
            </div>
          </div>
          <HistoryTable chainId={chainId as SupportedChain} data={filteredTransactions} />
        </div>
      )}
    </>
  );
}

export default HistoryTab;

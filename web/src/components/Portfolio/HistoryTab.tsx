import { useHistoryTransactions } from "@/hooks/portfolio/historyTab/useHistoryTransactions";
import { SearchIcon } from "@/lib/icons";
import { isUndefined } from "@/lib/utils";
import type { PortfolioChainId } from "@seer-pm/sdk";
import { endOfDay, format, startOfDay } from "date-fns";
import { useState } from "react";
import { Address } from "viem";
import { Alert } from "../Alert";
import Button from "../Form/Button";
import Input from "../Form/Input";
import DateRangePicker from "./DateRangePicker";
import HistoryTable from "./HistoryTable";

function txTimestampSeconds(timestamp: number | undefined): number | undefined {
  if (timestamp == null || !Number.isFinite(timestamp) || timestamp === 0) return undefined;
  return timestamp > 1e12 ? Math.floor(timestamp / 1000) : timestamp;
}

function HistoryTab({ account, chainId }: { account: Address | undefined; chainId: PortfolioChainId }) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const { data: historyTransactions, error } = useHistoryTransactions(account);

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
      if (chainId !== "all" && tx.chainId !== chainId) return false;
      const nameFilter = (tx.marketName ?? "").toLowerCase().includes(filterMarketName.toLowerCase());
      const ts = txTimestampSeconds(tx.timestamp);
      if (ts == null) return nameFilter;
      const startDateFilter = startDate ? ts >= Math.floor(startOfDay(startDate).getTime() / 1000) : true;
      const endDateFilter = endDate ? ts <= Math.floor(endOfDay(endDate).getTime() / 1000) : true;
      return nameFilter && startDateFilter && endDateFilter;
    }) ?? [];
  const renderTable = () => {
    if (isUndefined(historyTransactions)) {
      return <div className="shimmer-container w-full h-[200px]" />;
    }
    return !filteredTransactions.length ? (
      <Alert type="warning">No transactions found.</Alert>
    ) : (
      <HistoryTable chainId={chainId} data={filteredTransactions} />
    );
  };
  if (error) {
    return <Alert type="error">{error.message}</Alert>;
  }

  return (
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
                : `${startDate ? format(startDate, "MMM d, yyyy") : "_"} - ${
                    endDate ? format(endDate, "MMM d, yyyy") : "_"
                  }`
            }
            onClick={() => setShowDateRangePicker((state) => !state)}
          />
          {isShowDateRangePicker && (
            <div className="absolute right-0 top-[60px] z-10">
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
      {renderTable()}
    </div>
  );
}

export default HistoryTab;

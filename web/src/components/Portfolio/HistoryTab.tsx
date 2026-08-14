import { useHistoryTransactions } from "@/hooks/portfolio/historyTab/useHistoryTransactions";
import useDebounce from "@/hooks/useDebounce";
import { SearchIcon } from "@/lib/icons";
import type { SupportedChain } from "@seer-pm/sdk";
import { endOfDay, format, startOfDay, subMonths } from "date-fns";
import { useMemo, useState } from "react";
import { Address } from "viem";
import { Alert } from "../Alert";
import Button from "../Form/Button";
import Input from "../Form/Input";
import DateRangePicker from "./DateRangePicker";
import HistoryTable from "./HistoryTable";

/** `limit=0` tells the endpoint to skip its row cap and return the full history. */
const UNCAPPED = 0;

function HistoryTab({ account, chainId }: { account: Address | undefined; chainId: SupportedChain }) {
  const currentDate = startOfDay(new Date());
  const [startDate, setStartDate] = useState<Date | undefined>(subMonths(currentDate, 1));
  const [endDate, setEndDate] = useState<Date | undefined>(currentDate);
  const [showAll, setShowAll] = useState(false);
  const { data, error, isFetching, isPlaceholderData } = useHistoryTransactions(
    account as Address,
    chainId,
    startDate && Math.floor(startOfDay(startDate).getTime() / 1000),
    endDate && Math.floor(endOfDay(endDate).getTime() / 1000),
    showAll ? UNCAPPED : undefined,
  );
  const historyTransactions = data?.transactions;
  const isTruncated = Boolean(data?.truncated);

  const [isShowDateRangePicker, setShowDateRangePicker] = useState(false);
  const onChangeDate = (dates: (Date | null)[]) => {
    const [start, end] = dates;
    setStartDate(start ?? undefined);
    setEndDate(end ?? undefined);
  };
  const [filterMarketName, setFilterMarketName] = useState("");
  const debouncedMarketName = useDebounce(filterMarketName, 250);
  const marketNameCallback = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setFilterMarketName((event.target as HTMLInputElement).value);
  };

  const filteredTransactions = useMemo(() => {
    if (!historyTransactions) return [];
    // Hoisted out of the loop — these were being recomputed for every row, on every render.
    const needle = debouncedMarketName.toLowerCase();
    const startTs = startDate ? Math.floor(startOfDay(startDate).getTime() / 1000) : undefined;
    const endTs = endDate ? Math.floor(endOfDay(endDate).getTime() / 1000) : undefined;
    return historyTransactions.filter((tx) => {
      const nameFilter = tx.marketName.toLowerCase().includes(needle);
      // The server already applies the window; this only covers rows with no timestamp.
      if (!tx.timestamp) return nameFilter;
      const startDateFilter = startTs === undefined ? true : tx.timestamp >= startTs;
      const endDateFilter = endTs === undefined ? true : tx.timestamp <= endTs;
      return nameFilter && startDateFilter && endDateFilter;
    });
  }, [historyTransactions, debouncedMarketName, startDate, endDate]);

  const viewAllButton = (
    <button type="button" className="text-purple-primary underline" onClick={() => setShowAll(true)}>
      View all transactions
    </button>
  );

  // `data` stays populated from the previous window while a wider one loads, which previously
  // made "View all" look like a dead button. Shimmer when there's nothing to show, or when what
  // we're showing belongs to a different request — but not during a background refresh of the
  // current one, which should keep rendering the rows we already have.
  const isLoadingNewRange = isFetching && isPlaceholderData;

  const renderTable = () => {
    if (!historyTransactions || isLoadingNewRange) {
      return <div className="shimmer-container w-full h-[200px]" />;
    }
    if (!filteredTransactions.length) {
      return (
        <Alert type="warning">
          {isTruncated ? (
            <span>No matches in the most recent transactions. {viewAllButton}</span>
          ) : (
            "No transactions found."
          )}
        </Alert>
      );
    }
    return <HistoryTable chainId={chainId} data={filteredTransactions} />;
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
      {isTruncated && !isLoadingNewRange && !!filteredTransactions.length && (
        <div className="text-[14px] text-black-secondary mb-3">
          Showing the most recent transactions only. {viewAllButton}
        </div>
      )}
      {renderTable()}
    </div>
  );
}

export default HistoryTab;

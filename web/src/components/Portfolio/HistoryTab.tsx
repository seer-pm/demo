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
  const { data: historyTransactions, error, refetch, isFetching } = useHistoryTransactions(account);

  const [isShowDateRangePicker, setShowDateRangePicker] = useState(false);
  const onChangeDate = (dates: (Date | null)[]) => {
    const [start, end] = dates;
    setStartDate(start ?? undefined);
    setEndDate(end ?? undefined);
  };
  const [filterMarketName, setFilterMarketName] = useState("");
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
  const hasActiveFilters = Boolean(filterMarketName || startDate || endDate);

  const renderTable = () => {
    if (isUndefined(historyTransactions)) {
      return <div className="shimmer-container w-full h-[200px]" aria-hidden />;
    }
    if (!filteredTransactions.length && hasActiveFilters) {
      return (
        <Alert type="info" title="No matching activity">
          Nothing matches this search or date range. Clear filters to see all activity.
        </Alert>
      );
    }
    if (!filteredTransactions.length) {
      return (
        <Alert type="info" title="No activity">
          This profile has no trades, splits, merges, or redemptions on the selected chain.
        </Alert>
      );
    }
    return <HistoryTable chainId={chainId} data={filteredTransactions} />;
  };
  if (error) {
    return (
      <Alert type="error" title="Couldn't load activity">
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
        <div className="grow min-w-0">
          <label className="sr-only" htmlFor="history-search">
            Search by market
          </label>
          <Input
            id="history-search"
            placeholder="Search by market"
            className="w-full"
            icon={<SearchIcon />}
            value={filterMarketName}
            isClearable
            onClear={() => setFilterMarketName("")}
            onChange={(event) => setFilterMarketName(event.target.value)}
          />
        </div>
        <div className="relative shrink-0">
          <Button
            type="button"
            variant="secondary"
            aria-expanded={isShowDateRangePicker}
            text={
              !startDate && !endDate
                ? "Filter by date"
                : `${startDate ? format(startDate, "MMM d, yyyy") : "…"} – ${
                    endDate ? format(endDate, "MMM d, yyyy") : "…"
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

import { useHistoryTransactions } from "@/hooks/portfolio/historyTab/useHistoryTransactions";
import { SearchIcon } from "@/lib/icons";
import { isUndefined } from "@/lib/utils";
import type { PortfolioChainId, TransactionData } from "@seer-pm/sdk";
import clsx from "clsx";
import { endOfDay, format, startOfDay } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { Address } from "viem";
import { Alert } from "../Alert";
import Button from "../Form/Button";
import Input from "../Form/Input";
import DateRangePicker from "./DateRangePicker";
import HistoryTable from "./HistoryTable";

type HistoryTypeFilter = "all" | "swap" | "split" | "merge" | "redeem";

const HISTORY_TYPE_FILTERS: { id: HistoryTypeFilter; label: string; types: TransactionData["type"][] | null }[] = [
  { id: "all", label: "All", types: null },
  { id: "swap", label: "Swap", types: ["swap", "bought", "sold"] },
  { id: "split", label: "Split", types: ["split"] },
  { id: "merge", label: "Merge", types: ["merge"] },
  { id: "redeem", label: "Redeem", types: ["redeem"] },
];

function txTimestampSeconds(timestamp: number | undefined): number | undefined {
  if (timestamp == null || !Number.isFinite(timestamp) || timestamp === 0) return undefined;
  return timestamp > 1e12 ? Math.floor(timestamp / 1000) : timestamp;
}

function HistoryTab({ account, chainId }: { account: Address | undefined; chainId: PortfolioChainId }) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const { data: historyTransactions, error, refetch, isFetching } = useHistoryTransactions(account);

  const [isShowDateRangePicker, setShowDateRangePicker] = useState(false);
  const dateWrapRef = useRef<HTMLDivElement>(null);
  const onChangeDate = (dates: (Date | null)[]) => {
    const [start, end] = dates;
    setStartDate(start ?? undefined);
    setEndDate(end ?? undefined);
  };
  const [filterMarketName, setFilterMarketName] = useState("");
  const [typeFilter, setTypeFilter] = useState<HistoryTypeFilter>("all");

  useEffect(() => {
    if (!isShowDateRangePicker) return;
    const onPointerDown = (event: MouseEvent) => {
      if (dateWrapRef.current && !dateWrapRef.current.contains(event.target as Node)) {
        setShowDateRangePicker(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isShowDateRangePicker]);
  const typeMeta = HISTORY_TYPE_FILTERS.find((item) => item.id === typeFilter) ?? HISTORY_TYPE_FILTERS[0];
  const filteredTransactions =
    historyTransactions?.filter((tx) => {
      if (chainId !== "all" && tx.chainId !== chainId) return false;
      if (typeMeta.types && !typeMeta.types.includes(tx.type)) return false;
      const nameFilter = (tx.marketName ?? "").toLowerCase().includes(filterMarketName.toLowerCase());
      const ts = txTimestampSeconds(tx.timestamp);
      if (ts == null) return nameFilter;
      const startDateFilter = startDate ? ts >= Math.floor(startOfDay(startDate).getTime() / 1000) : true;
      const endDateFilter = endDate ? ts <= Math.floor(endOfDay(endDate).getTime() / 1000) : true;
      return nameFilter && startDateFilter && endDateFilter;
    }) ?? [];
  const hasDateFilter = Boolean(startDate || endDate);
  const hasActiveFilters = Boolean(filterMarketName || hasDateFilter || typeFilter !== "all");

  const clearFilters = () => {
    setFilterMarketName("");
    setStartDate(undefined);
    setEndDate(undefined);
    setTypeFilter("all");
    setShowDateRangePicker(false);
  };

  const renderTable = () => {
    if (isUndefined(historyTransactions)) {
      return (
        <div aria-busy="true" aria-live="polite">
          <span className="sr-only">Loading activity</span>
          <div className="shimmer-container w-full h-[200px]" aria-hidden />
        </div>
      );
    }
    if (!filteredTransactions.length && hasActiveFilters) {
      return (
        <Alert type="info" title="No matching activity">
          <div className="space-y-3">
            <p>Nothing matches this search, type, or date range.</p>
            <button type="button" className="btn btn-sm btn-primary min-h-11" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
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
    return (
      <HistoryTable
        key={`${typeFilter}-${filterMarketName}-${startDate?.toISOString() ?? ""}-${endDate?.toISOString() ?? ""}`}
        chainId={chainId}
        account={account}
        data={filteredTransactions}
      />
    );
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

  const chipClass = (active: boolean) =>
    clsx("btn btn-sm min-h-11 px-3", active ? "btn-primary" : "btn-ghost border border-separator-100");

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
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
        <div ref={dateWrapRef} className="relative shrink-0 flex items-center gap-2">
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
          {hasDateFilter ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm min-h-11 px-3"
              onClick={() => onChangeDate([null, null])}
            >
              Clear dates
            </button>
          ) : null}
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
      <fieldset className="flex flex-wrap gap-2 items-center mb-6" aria-label="Filter by type">
        <span className="text-sm font-medium text-black-primary mr-1">Type</span>
        {HISTORY_TYPE_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={typeFilter === item.id}
            className={chipClass(typeFilter === item.id)}
            onClick={() => setTypeFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </fieldset>
      {renderTable()}
    </div>
  );
}

export default HistoryTab;

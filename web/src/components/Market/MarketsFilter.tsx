import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { Filter } from "@/lib/icons";
import clsx from "clsx";
import { useState } from "react";
import { MarketsFilterBox } from "./MarketsFilterBox";
import { ORDER_OPTIONS } from "./marketOrderOptions";

/**
 * Sort and Filter for the market list. They refine one list, so they sit in that list's toolbar
 * rather than in the global header, next to the category chips that refine the same list.
 */
export function MarketsFilter() {
  const {
    orderBy,
    setOrderBy,
    verificationStatusList,
    marketStatusList,
    chainsList,
    showConditionalMarkets,
    showMarketsWithRewards,
    showFutarchyMarkets,
    minLiquidity,
  } = useMarketsSearchParams();
  // Categories show on the chips and the sort order on its own control, so the count covers only
  // what is hidden inside the panel. That is what the user cannot otherwise see is applied.
  const activeFilters = [
    verificationStatusList?.length,
    marketStatusList?.length,
    chainsList?.length,
    showConditionalMarkets,
    showMarketsWithRewards,
    showFutarchyMarkets,
    minLiquidity > 0,
  ].filter(Boolean).length;
  const [isShowFilters, setShowFilters] = useState(false);

  return (
    <div className="seer-market-toolbar">
      <label className="seer-sort">
        <span>Sort</span>
        <select
          aria-label="Sort markets by"
          value={orderBy ?? "default"}
          onChange={(event) => setOrderBy(event.target.value as Parameters<typeof setOrderBy>[0])}
        >
          {ORDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.text}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className={clsx("seer-filter-button", isShowFilters && "is-open")}
        aria-expanded={isShowFilters}
        aria-controls="market-filter-panel"
        aria-label={activeFilters > 0 ? `Filter, ${activeFilters} active` : "Filter"}
        onClick={() => setShowFilters((state) => !state)}
      >
        <Filter fill="currentColor" />
        Filter
        {activeFilters > 0 && (
          <span className="seer-filter-count" aria-hidden="true">
            {activeFilters}
          </span>
        )}
      </button>
      {isShowFilters && (
        <div id="market-filter-panel" className="seer-filter-panel">
          <MarketsFilterBox setShowFilters={setShowFilters} />
        </div>
      )}
    </div>
  );
}

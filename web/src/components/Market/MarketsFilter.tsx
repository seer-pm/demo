import useMarketsSearchParams from "@/hooks/useMarketsSearchParams";
import { Filter } from "@/lib/icons";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
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
    orderDirection,
    setOrderDirection,
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
  const toolbarRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeFilters = useCallback(() => {
    setShowFilters(false);
    filterButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isShowFilters) return;
    const updatePanelHeight = () => {
      if (!panelRef.current) return;
      if (window.matchMedia("(max-width: 640px)").matches && toolbarRef.current) {
        const headerBottom = document.getElementById("header")?.getBoundingClientRect().bottom ?? 0;
        const top = Math.max(
          headerBottom + 8,
          Math.min(toolbarRef.current.getBoundingClientRect().bottom + 12, window.innerHeight - 196),
        );
        panelRef.current.style.setProperty("--seer-filter-top", `${top}px`);
      }
      const available = window.innerHeight - panelRef.current.getBoundingClientRect().top - 16;
      panelRef.current.style.setProperty("--seer-filter-height", `${Math.max(180, available)}px`);
    };
    const onScroll = () => {
      if (!window.matchMedia("(max-width: 640px)").matches) updatePanelHeight();
    };
    updatePanelHeight();
    const onPointerDown = (event: PointerEvent) => {
      if (!toolbarRef.current?.contains(event.target as Node)) setShowFilters(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeFilters();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updatePanelHeight);
    window.addEventListener("scroll", onScroll);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePanelHeight);
      window.removeEventListener("scroll", onScroll);
    };
  }, [isShowFilters, closeFilters]);

  return (
    <div className="seer-market-toolbar" ref={toolbarRef}>
      <div className="seer-sort-controls">
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
          className="seer-sort-direction"
          aria-label={`Sort ${orderDirection === "asc" ? "descending" : "ascending"}`}
          title={
            orderBy
              ? `Current order: ${orderDirection === "asc" ? "ascending" : "descending"}`
              : "Choose a sort option to change its direction"
          }
          disabled={!orderBy}
          onClick={() => setOrderDirection(orderDirection === "asc" ? "desc" : "asc")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden="true"
            className={orderDirection === "asc" ? "rotate-180" : undefined}
          >
            <path d="M12 4v16m-6-6 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <button
        ref={filterButtonRef}
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
        <div id="market-filter-panel" className="seer-filter-panel" ref={panelRef}>
          <MarketsFilterBox setShowFilters={(open) => (open ? setShowFilters(true) : closeFilters())} />
        </div>
      )}
    </div>
  );
}

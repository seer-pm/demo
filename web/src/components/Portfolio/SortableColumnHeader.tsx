import { ArrowDropDown, ArrowDropUp, ArrowSwap } from "@/lib/icons";
import { type Header, flexRender } from "@tanstack/react-table";
import clsx from "clsx";

export function SortableColumnHeader<TData>({
  header,
  align = "left",
}: {
  header: Header<TData, unknown>;
  align?: "left" | "center";
}) {
  const canSort = header.column.getCanSort();
  const sorted = header.column.getIsSorted();
  const label = flexRender(header.column.columnDef.header, header.getContext());
  const className = clsx(
    "flex items-center gap-2 min-h-11",
    align === "center" ? "justify-center w-full" : "justify-start",
  );

  if (header.isPlaceholder) return null;

  if (!canSort) {
    return <div className={className}>{label}</div>;
  }

  const next = header.column.getNextSortingOrder();
  const sortHint = next === "asc" ? "Sort ascending" : next === "desc" ? "Sort descending" : "Clear sort";
  const headerLabel = typeof header.column.columnDef.header === "string" ? header.column.columnDef.header : undefined;

  return (
    <button
      type="button"
      className={className}
      onClick={header.column.getToggleSortingHandler()}
      aria-label={headerLabel ? `${headerLabel}. ${sortHint}` : sortHint}
    >
      {label}
      <span className="flex-shrink-0" aria-hidden>
        {sorted === "asc" ? (
          <ArrowDropUp fill="currentColor" />
        ) : sorted === "desc" ? (
          <ArrowDropDown fill="currentColor" />
        ) : (
          <ArrowSwap />
        )}
      </span>
    </button>
  );
}

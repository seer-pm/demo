import { ArrowDropDown, ArrowDropUp } from "@/lib/icons";
import clsx from "clsx";

export type SortDir = "asc" | "desc";

function SortMark({ active, dir }: { active: boolean; dir: SortDir }) {
  const Icon = active && dir === "asc" ? ArrowDropUp : ArrowDropDown;
  return (
    <span
      className={clsx(
        "inline-flex size-4 flex-shrink-0 items-center justify-center [&>svg]:size-4",
        active ? "opacity-100" : "opacity-45",
      )}
      aria-hidden
    >
      <Icon fill="currentColor" />
    </span>
  );
}

/**
 * Right-aligned, sortable numeric column header, shared by the P&L and airdrop leaderboards.
 *
 * Generic over the board's sort-key union so each page keeps its own keys type-checked.
 */
export function SortableHeader<K extends string>({
  label,
  sortKey,
  activeSort,
  activeDir,
  onSort,
}: {
  label: string;
  sortKey: K;
  activeSort: K;
  activeDir: SortDir;
  onSort: (key: K) => void;
}) {
  const active = activeSort === sortKey;
  const currentDir = active ? (activeDir === "asc" ? "ascending" : "descending") : "not sorted";
  const nextDir = !active || activeDir === "asc" ? "descending" : "ascending";

  return (
    <th className="text-right" aria-sort={active ? (activeDir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        className={clsx(
          "inline-flex items-center justify-end gap-1 w-full min-h-11 font-semibold rounded-[1px] hover:text-base-content",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-primary",
          active ? "text-base-content" : "text-black-secondary",
        )}
        onClick={() => onSort(sortKey)}
        aria-label={`${label}, ${currentDir}. Activate to sort ${nextDir}.`}
      >
        {label}
        <SortMark active={active} dir={active ? activeDir : "desc"} />
      </button>
    </th>
  );
}

export default SortableHeader;

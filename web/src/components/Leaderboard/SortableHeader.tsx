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
 *
 * `lockDescending` drops the ascending half of the toggle: clicking a header picks what the board
 * ranks by, but the direction is always highest-first. A leaderboard has no bottom-first reading —
 * ascending only ever surfaced the smallest holders — so the airdrop board opts in. The P&L board
 * leaves it off and keeps the full toggle.
 */
export function SortableHeader<K extends string>({
  label,
  sortKey,
  activeSort,
  activeDir,
  onSort,
  lockDescending = false,
}: {
  label: string;
  sortKey: K;
  activeSort: K;
  activeDir: SortDir;
  onSort: (key: K) => void;
  lockDescending?: boolean;
}) {
  const active = activeSort === sortKey;
  const currentDir = active ? (activeDir === "asc" ? "ascending" : "descending") : "not sorted";
  const nextDir = !active || activeDir === "asc" ? "descending" : "ascending";
  // Announcing "activate to sort descending" on the column that is already sorted descending would
  // promise an action the button no longer performs, so a locked column that is active is inert.
  const inert = lockDescending && active;

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
        disabled={inert}
        aria-label={inert ? `${label}, ${currentDir}.` : `${label}, ${currentDir}. Activate to sort ${nextDir}.`}
      >
        {label}
        <SortMark active={active} dir={lockDescending ? "desc" : active ? activeDir : "desc"} />
      </button>
    </th>
  );
}

export default SortableHeader;

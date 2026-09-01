import { LEADERBOARD_PERIODS, type LeaderboardPeriod, PERIOD_LABELS } from "@/lib/leaderboardPeriods";
import clsx from "clsx";

export function PeriodFilter({
  value,
  onChange,
}: {
  value: LeaderboardPeriod;
  onChange: (period: LeaderboardPeriod) => void;
}) {
  return (
    <fieldset className="join">
      <legend className="sr-only">Time period</legend>
      {LEADERBOARD_PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          className={clsx("btn btn-sm join-item", value === p ? "btn-primary" : "btn-ghost")}
          onClick={() => onChange(p)}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </fieldset>
  );
}

export default PeriodFilter;

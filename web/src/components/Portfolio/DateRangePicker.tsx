import clsx from "clsx";
import { compareAsc, startOfDay, subMonths, subWeeks } from "date-fns";
import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import Button from "../Form/Button";

const defaultRanges = ["Today", "Last Week", "Last Month", "All"] as const;
type DefaultRange = (typeof defaultRanges)[number];
function DateRangePicker({
  startDate: initialStartDate,
  endDate: initialEndDate,
  onChange,
  onClose,
}: {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onChange: (dates: (Date | null)[]) => void;
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  useEffect(() => {
    setStartDate(initialStartDate);
  }, [initialStartDate]);

  useEffect(() => {
    setEndDate(initialEndDate);
  }, [initialEndDate]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const getDatesFromDefaultRange = (defaultRange: DefaultRange) => {
    let start: Date = startOfDay(new Date());
    let end: Date = start;
    switch (defaultRange) {
      case "Today": {
        end = start;
        break;
      }
      case "Last Week": {
        start = subWeeks(start, 1);
        break;
      }
      case "Last Month": {
        start = subMonths(start, 1);
        break;
      }
      case "All": {
        break;
      }
    }
    return [start, end];
  };
  const getDefaultRangeFromDates = () => {
    if (!startDate && !endDate) return "All";
    if (!startDate || !endDate) return "";
    for (const range of defaultRanges) {
      if (range === "All") continue;
      const [start, end] = getDatesFromDefaultRange(range);
      if (compareAsc(start, startDate) === 0 && compareAsc(end, endDate) === 0) {
        return range;
      }
    }
  };
  return (
    <div ref={rootRef} className="bg-base-100 w-fit border border-separator-100 rounded-[1px] shadow-md">
      <div className="flex border-b border-separator-100">
        <div className="border-r border-separator-100">
          {defaultRanges.map((range) => {
            return (
              <button
                type="button"
                key={range}
                className={clsx(
                  "text-[14px] whitespace-nowrap cursor-pointer flex px-3 py-2 min-h-11 w-full text-left border-l-[3px] border-transparent hover:bg-purple-medium dark:hover:bg-neutral hover:border-l-purple-primary",
                  getDefaultRangeFromDates() === range &&
                    "active border-l-[3px] border-l-purple-primary bg-purple-medium dark:bg-neutral",
                )}
                aria-pressed={getDefaultRangeFromDates() === range}
                onClick={() => {
                  if (range === "All") {
                    setStartDate(undefined);
                    setEndDate(undefined);
                    return;
                  }
                  const [nextStart, nextEnd] = getDatesFromDefaultRange(range);
                  setStartDate(nextStart);
                  setEndDate(nextEnd);
                }}
              >
                {range}
              </button>
            );
          })}
        </div>
        <DatePicker
          selected={startDate}
          onChange={(dates: (Date | null)[]) => {
            const [start, end] = dates;
            setStartDate(start ?? undefined);
            setEndDate(end ?? undefined);
          }}
          startDate={startDate}
          endDate={endDate}
          selectsRange
          inline
          calendarClassName="custom-date-picker border-none"
        />
      </div>
      <div className="flex justify-end text-center p-3 gap-2">
        <Button
          type="button"
          variant="secondary"
          text="Cancel"
          className="min-w-[60px] min-h-11"
          onClick={() => onClose()}
        />
        <Button
          variant="primary"
          type="button"
          text="Save"
          className="min-w-[60px] min-h-11"
          onClick={() => {
            onChange([startDate ?? null, endDate ?? null]);
            onClose();
          }}
        />
      </div>
    </div>
  );
}

export default DateRangePicker;

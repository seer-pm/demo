import clsx from "clsx";
import { compareAsc, startOfDay, subDays, subMonths, subWeeks, subYears } from "date-fns";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import Button from "../Form/Button";

const defaultRanges = ["Today", "Yesterday", "Last Week", "Last Month", "Last 3 Months", "Last Year", "All"] as const;
type DefaultRange = "Today" | "Yesterday" | "Last Week" | "Last Month" | "Last 3 Months" | "Last Year" | "All";
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
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  useEffect(() => {
    setStartDate(initialStartDate);
  }, [initialStartDate]);

  useEffect(() => {
    setEndDate(initialEndDate);
  }, [initialEndDate]);

  const getDatesFromDefaultRange = (defaultRange: DefaultRange) => {
    let start: Date = startOfDay(new Date());
    let end: Date = start;
    switch (defaultRange) {
      case "Today": {
        end = start;
        break;
      }
      case "Yesterday": {
        start = subDays(start, 1);
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
      case "Last 3 Months": {
        start = subMonths(start, 3);
        break;
      }
      case "Last Year": {
        start = subYears(start, 1);
        break;
      }
    }
    return [start, end];
  };
  const getDefaultRangeFromDates = () => {
    if (!startDate && !endDate) return "All";
    if (!startDate || !endDate) return "";
    for (const range of defaultRanges) {
      const [start, end] = getDatesFromDefaultRange(range);
      if (compareAsc(start, startDate) === 0 && compareAsc(end, endDate) === 0) {
        return range;
      }
    }
  };
  return (
    <div className="bg-white w-fit border border-[rgb(224,224,224)] rounded-[1px] drop-shadow">
      <div className="flex border-b border-[rgb(224,224,224)]">
        <div className="border-r border-[rgb(224,224,224)]">
          {defaultRanges.map((range) => {
            return (
              <div
                key="range"
                className={clsx(
                  "text-[14px] whitespace-nowrap cursor-pointer flex px-2 py-2 border-l-[3px] border-transparent hover:bg-purple-medium hover:border-l-purple-primary",
                  getDefaultRangeFromDates() === range &&
                    "active border-l-[3px] border-l-purple-primary bg-purple-medium",
                )}
                onClick={() => {
                  if (range === "All") {
                    setStartDate(undefined);
                    setEndDate(undefined);
                    return;
                  }
                  const [startDate, endDate] = getDatesFromDefaultRange(range);
                  setStartDate(startDate);
                  setEndDate(endDate);
                }}
              >
                {range}
              </div>
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
          className="!min-w-[60px] !min-h-[35px] !h-[35px] !text-[14px]"
          onClick={() => onClose()}
        />
        <Button
          variant="primary"
          type="button"
          text="Save"
          className="!min-w-[60px] !min-h-[35px] !h-[35px] !text-[14px]"
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

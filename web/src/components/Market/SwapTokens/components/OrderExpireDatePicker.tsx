import Button from "@/components/Form/Button";
import { addYears } from "date-fns";
import { useState } from "react";
import DatePicker from "react-datepicker";

function OrderExpireDatePicker({
  initialDate,
  onSave,
}: {
  initialDate: Date | string | null;
  onSave: (date: Date | string | null) => void;
}) {
  const [date, setDate] = useState(initialDate);
  return (
    <div className="space-y-5 flex flex-col items-center">
      <DatePicker
        showTimeSelect
        timeIntervals={1}
        onChange={(date) => setDate(date)}
        selected={date ? new Date(date) : null}
        inline
        dateFormat="yyyy-MM-dd HH:mm"
        dateFormatCalendar="MMMM"
        timeFormat="HH:mm"
        placeholderText="yyyy-MM-dd HH:mm"
        calendarClassName="custom-date-picker"
        showYearDropdown
        dropdownMode="select"
        maxDate={addYears(new Date(), 1)}
      />
      <Button text="Save" onClick={() => onSave(date)} />
    </div>
  );
}

export default OrderExpireDatePicker;

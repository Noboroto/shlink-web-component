import { endOfDay } from 'date-fns';
import { DateInput } from './DateInput';
import type { DateRange } from './helpers/dateIntervals';

interface DateRangeRowProps extends DateRange {
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  disabled?: boolean;
}

export const DateRangeRow = (
  { startDate = null, endDate = null, disabled = false, onStartDateChange, onEndDateChange }: DateRangeRowProps,
) => (
  <div className="row">
    <div className="col-md-6">
      <DateInput
        selected={startDate}
        placeholderText="Since..."
        isClearable
        maxDate={endDate ?? undefined}
        disabled={disabled}
        onChange={onStartDateChange}
      />
    </div>
    <div className="col-md-6">
      <DateInput
        className="mt-2 mt-md-0"
        selected={endDate}
        placeholderText="Until..."
        isClearable
        minDate={startDate ?? undefined}
        disabled={disabled}
        onChange={(date) => onEndDateChange(date && endOfDay(date))}
      />
    </div>
  </div>
);

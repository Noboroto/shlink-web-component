import { differenceInDays, endOfDay, startOfDay, subDays } from 'date-fns';
import type { DateInterval as SettingsDateInterval } from '../../../settings';
import type { DateOrString } from './date';
import { formatInternational, isBeforeOrEqual, now, parseISO } from './date';

export type DateInterval = SettingsDateInterval;

export type DateRange = {
  startDate?: Date | null;
  endDate?: Date | null;
};

export type MandatoryStartDateRange = Pick<DateRange, 'endDate'> & {
  startDate: Date;
};

export type StrictDateRange = {
  startDate: Date;
  endDate: Date;
};

export const ALL = 'all';

const INTERVAL_TO_STRING_MAP: Record<DateInterval, string | undefined> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7Days: 'Last 7 days',
  last30Days: 'Last 30 days',
  last90Days: 'Last 90 days',
  last180Days: 'Last 180 days',
  last365Days: 'Last 365 days',
  [ALL]: undefined,
} as const;

const INTERVALS = Object.keys(INTERVAL_TO_STRING_MAP) as DateInterval[];

export const dateRangeIsEmpty = (dateRange?: DateRange): boolean =>
  !dateRange || (!dateRange.startDate && !dateRange.endDate);

export const rangeIsInterval = (
  range?: DateRange | DateInterval
): range is DateInterval =>
  typeof range === 'string' && INTERVALS.includes(range);

export const DATE_INTERVALS = INTERVALS.filter(
  (value) => value !== ALL
) as Exclude<DateInterval, typeof ALL>[];

const dateOrNull = (date?: string): Date | null =>
  date ? parseISO(date) : null;

export const datesToDateRange = (
  startDate?: string,
  endDate?: string
): DateRange => ({
  startDate: dateOrNull(startDate),
  endDate: dateOrNull(endDate),
});

const dateRangeToString = (range?: DateRange): string | undefined => {
  if (!range || dateRangeIsEmpty(range)) {
    return undefined;
  }

  if (range.startDate && !range.endDate) {
    return `Since ${formatInternational(range.startDate)}`;
  }

  if (!range.startDate && range.endDate) {
    return `Until ${formatInternational(range.endDate)}`;
  }

  return `${formatInternational(range.startDate)} - ${formatInternational(range.endDate)}`;
};

export const rangeOrIntervalToString = (
  range?: DateRange | DateInterval
): string | undefined => {
  if (!range || range === ALL) {
    return undefined;
  }

  if (!rangeIsInterval(range)) {
    return dateRangeToString(range);
  }

  return INTERVAL_TO_STRING_MAP[range];
};

const startOfDaysAgo = (daysAgo: number) => startOfDay(subDays(now(), daysAgo));
const endingToday = (startDate: Date): DateRange => ({
  startDate,
  endDate: endOfDay(now()),
});

export const intervalToDateRange = (interval?: DateInterval): DateRange => {
  const conditions: [() => boolean, () => DateRange][] = [
    [() => interval === 'today', () => endingToday(startOfDay(now()))],
    [
      () => interval === 'yesterday',
      () => ({
        startDate: startOfDaysAgo(1),
        endDate: endOfDay(subDays(now(), 1)),
      }),
    ],
    [() => interval === 'last7Days', () => endingToday(startOfDaysAgo(7))],
    [() => interval === 'last30Days', () => endingToday(startOfDaysAgo(30))],
    [() => interval === 'last90Days', () => endingToday(startOfDaysAgo(90))],
    [() => interval === 'last180Days', () => endingToday(startOfDaysAgo(180))],
    [() => interval === 'last365Days', () => endingToday(startOfDaysAgo(365))],
  ];

  return conditions.find(([matcher]) => matcher())?.[1]() ?? {};
};

export const dateToMatchingInterval = (date: DateOrString): DateInterval => {
  const isoDate = parseISO(date);
  const conditions: [() => boolean, DateInterval][] = [
    [() => isBeforeOrEqual(startOfDay(now()), isoDate), 'today'],
    [() => isBeforeOrEqual(startOfDaysAgo(1), isoDate), 'yesterday'],
    [() => isBeforeOrEqual(startOfDaysAgo(7), isoDate), 'last7Days'],
    [() => isBeforeOrEqual(startOfDaysAgo(30), isoDate), 'last30Days'],
    [() => isBeforeOrEqual(startOfDaysAgo(90), isoDate), 'last90Days'],
    [() => isBeforeOrEqual(startOfDaysAgo(180), isoDate), 'last180Days'],
    [() => isBeforeOrEqual(startOfDaysAgo(365), isoDate), 'last365Days'],
  ];

  return conditions.find(([matcher]) => matcher())?.[1] ?? ALL;
};

export const toDateRange = (
  rangeOrInterval: DateRange | DateInterval
): DateRange => {
  if (rangeIsInterval(rangeOrInterval)) {
    return intervalToDateRange(rangeOrInterval);
  }

  return rangeOrInterval;
};

export const isMandatoryStartDateRange = (
  dateRange?: DateRange
): dateRange is MandatoryStartDateRange => !!(dateRange && dateRange.startDate);

/**
 * Returns the previous date range, using days as the minimum time unit.
 *
 * For example, if you provide a date range which has 12 days between start and end date, it will return another 12-day
 * DateRange where the endDate will be one day before the original startDate, and the start day will be 13 days before
 * the original startDate.
 * 2024-01-10 - 2024-01-18 => 2024-01-01T00:00:00 - 2024-01-09T:23:59:59
 *
 * Only the startDate is required. The endDate will fall back to current date if not provided
 */
export const calcPrevDateRange = ({
  startDate,
  endDate: optionalEndDate,
}: MandatoryStartDateRange): StrictDateRange => {
  const endDate = optionalEndDate ?? new Date();
  const daysDiff =
    differenceInDays(endOfDay(endDate), startOfDay(startDate)) + 1;
  const newStartDate = subDays(startOfDay(startDate), daysDiff);
  const newEndDate = subDays(endOfDay(startDate), 1);

  return { startDate: newStartDate, endDate: newEndDate };
};

export const dateRangeDaysDiff = (
  dateRange?: DateRange
): number | undefined => {
  if (!isMandatoryStartDateRange(dateRange)) {
    return undefined;
  }
  return differenceInDays(dateRange.endDate ?? new Date(), dateRange.startDate);
};

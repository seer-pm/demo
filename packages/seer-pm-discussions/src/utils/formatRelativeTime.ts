const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

type RelativeUnit = Intl.RelativeTimeFormatUnit;

type FormatRelativeTimeResult = {
  text: string;
  /** Suggested delay in ms until the displayed value may change. */
  nextUpdateMs: number;
};

function toTimestamp(date: number | Date): number {
  return typeof date === "number" ? date : date.getTime();
}

function pickUnit(absDiff: number): { unit: RelativeUnit; unitMs: number; nextUpdateMs: number } {
  if (absDiff < MINUTE) {
    return { unit: "second", unitMs: SECOND, nextUpdateMs: SECOND };
  }
  if (absDiff < HOUR) {
    return { unit: "minute", unitMs: MINUTE, nextUpdateMs: MINUTE };
  }
  if (absDiff < DAY) {
    return { unit: "hour", unitMs: HOUR, nextUpdateMs: HOUR };
  }
  if (absDiff < WEEK) {
    return { unit: "day", unitMs: DAY, nextUpdateMs: DAY };
  }
  if (absDiff < MONTH) {
    return { unit: "week", unitMs: WEEK, nextUpdateMs: WEEK };
  }
  if (absDiff < YEAR) {
    return { unit: "month", unitMs: MONTH, nextUpdateMs: DAY };
  }
  return { unit: "year", unitMs: YEAR, nextUpdateMs: DAY };
}

export function formatRelativeTime(date: number | Date, locale = "en-US", now = Date.now()): FormatRelativeTimeResult {
  const timestamp = toTimestamp(date);
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);
  const { unit, unitMs, nextUpdateMs } = pickUnit(absDiff);
  const value = Math.round(diff / unitMs);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  return {
    text: formatter.format(value, unit),
    nextUpdateMs,
  };
}

export function formatAbsoluteTime(date: number | Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(toTimestamp(date));
}

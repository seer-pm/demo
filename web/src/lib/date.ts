import { formatDistanceStrict, intervalToDuration } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { compareAsc } from "date-fns/compareAsc";
import { type FormatDurationOptions, formatDuration } from "date-fns/formatDuration";
import { fromUnixTime } from "date-fns/fromUnixTime";
import { Market } from "./market";
import { isUndefined } from "./utils";

// https://stackoverflow.com/a/72190364

export function utcToLocalTime(utcTime: Date | string | number) {
  if (typeof utcTime === "string" || typeof utcTime === "number") {
    // biome-ignore lint/style/noParameterAssign:
    utcTime = new Date(utcTime);
  }

  const tzOffset = utcTime.getTimezoneOffset() * 60000;
  return new Date(utcTime.getTime() - tzOffset);
}

export function formatDate(timestamp: number, formatString?: string) {
  const date = fromUnixTime(timestamp);
  return formatInTimeZone(date, "UTC", formatString ?? "MMMM d yyyy, HH:mm");
}

export function getTimeLeft(endDate: Date | string | number, withSeconds = false): string | false {
  const startDate = new Date();

  if (typeof endDate === "number" || typeof endDate === "string") {
    // biome-ignore lint/style/noParameterAssign:
    endDate = fromUnixTime(Number(endDate));
  }

  if (compareAsc(startDate, endDate) === 1) {
    return false;
  }

  const duration = intervalToDuration({ start: startDate, end: endDate });

  const format: FormatDurationOptions["format"] = ["years", "months", "weeks", "days", "hours"];

  if (withSeconds) {
    format.push("minutes", "seconds");
  } else if (Number(duration.days || 0) < 1) {
    if (Number(duration.minutes || 0) < 2) {
      format.push("seconds");
    } else {
      format.push("minutes");
    }
  }

  return formatDuration(duration, { format });
}

export function getChallengeRemainingTime(market: Market) {
  if (!isUndefined(market.verification) && market.verification.status === "verifying" && market.verification.deadline) {
    const now = Date.now();
    if (market.verification.deadline * 1000 < now) {
      return;
    }
    return formatDistanceStrict(market.verification.deadline * 1000, now);
  }
}

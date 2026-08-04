import { type CSSProperties, useEffect, useState } from "react";
import { formatAbsoluteTime, formatRelativeTime } from "../../utils/formatRelativeTime";

type TimeAgoProps = {
  date: number | Date;
  locale?: string;
  style?: CSSProperties;
  className?: string;
};

export function TimeAgo({ date, locale = "en-US", style, className }: TimeAgoProps) {
  const [now, setNow] = useState(() => Date.now());
  const { text, nextUpdateMs } = formatRelativeTime(date, locale, now);
  const absolute = formatAbsoluteTime(date, locale);
  const dateTime = typeof date === "number" ? new Date(date).toISOString() : date.toISOString();

  useEffect(() => {
    const id = window.setTimeout(() => setNow(Date.now()), nextUpdateMs);
    return () => window.clearTimeout(id);
  }, [now, nextUpdateMs]);

  return (
    <time dateTime={dateTime} title={absolute} style={style} className={className}>
      {text}
    </time>
  );
}

export default TimeAgo;

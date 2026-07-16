// Src/utils/formatRelativeTime.ts
import {
  MS_PER_DAY,
  MS_PER_HOUR,
  MS_PER_MINUTE,
  MS_PER_MONTH,
  MS_PER_WEEK,
  MS_PER_YEAR,
} from "./constants";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", MS_PER_YEAR],
  ["month", MS_PER_MONTH],
  ["week", MS_PER_WEEK],
  ["day", MS_PER_DAY],
  ["hour", MS_PER_HOUR],
  ["minute", MS_PER_MINUTE],
];

export function formatRelativeTime(timestamp: number): string {
  const diff = timestamp - Date.now();
  const absDiff = Math.abs(diff);

  for (const [unit, ms] of UNITS) {
    if (absDiff >= ms) {
      return rtf.format(Math.round(diff / ms), unit);
    }
  }
  return "just now";
}

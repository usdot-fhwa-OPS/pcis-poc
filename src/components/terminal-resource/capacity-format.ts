import type { DayCode, OpenInterval } from "./terminal-resource-manager-client";
import type { OutageDomain } from "./outage-domain";

export const DAYS: DayCode[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
export const DAY_LABELS: Record<DayCode, string> = {
  MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday", SUN: "Sunday",
};
export const DAY_SHORT: Record<DayCode, string> = {
  MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat", SUN: "Sun",
};
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WEEK_NUMBERS = ["FIRST", "SECOND", "THIRD", "FOURTH", "LAST"] as const;
export const OUTAGE_REASONS = ["Maintenance", "Equipment malfunction", "Labor shortage"];

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "2026-12-24" -> "Thu 12/24/2026". Parsed as a calendar date, so no time zone shift.
export function formatDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd || "");
  if (!m) return ymd || "";
  const dow = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay();
  return `${WEEKDAY_SHORT[dow]} ${m[2]}/${m[3]}/${m[1]}`;
}

// "17:00" -> "5:00 PM"
export function formatTime(hhmm: string): string {
  const m = /^(\d{2}):(\d{2})/.exec(hhmm || "");
  if (!m) return hhmm || "";
  const h = +m[1];
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

// "2026-12-15T08:00:00" (terminal local time) -> "Tue 12/15/2026 8:00 AM"
export function formatLocalDateTime(local: string): string {
  if (!local) return "";
  return `${formatDate(local.slice(0, 10))} ${formatTime(local.slice(11, 16))}`;
}

export function formatIntervals(intervals: OpenInterval[] | undefined): string {
  if (!intervals || intervals.length === 0) return "Closed";
  return intervals.map((i) => `${formatTime(i.open)} – ${formatTime(i.close)}`).join(", ");
}

// An outage's span: same day -> "Tue 12/15/2026 8:00 AM – 12:00 PM"; else both ends in full.
export function formatSpan(startAt: string, endAt: string): string {
  if (startAt.slice(0, 10) === endAt.slice(0, 10)) {
    return `${formatLocalDateTime(startAt)} – ${formatTime(endAt.slice(11, 16))}`;
  }
  return `${formatLocalDateTime(startAt)} – ${formatLocalDateTime(endAt)}`;
}

const joinList = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// "Every 2 weeks on Mon and Wed, until Thu 12/31/2026"
export function describeRecurrence(r: OutageDomain["recurrence"]): string {
  if (!r) return "Once";
  const units: Record<string, string> = { DAILY: "day", WEEKLY: "week", MONTHLY: "month", YEARLY: "year" };
  const unit = units[r.frequency] ?? "time";
  const every = r.interval > 1 ? `Every ${r.interval} ${unit}s` : `Every ${unit}`;
  const onThe = r.cycle === "ON_THE" && r.weekNumber && r.dayOfWeek
    ? `on the ${r.weekNumber.toLowerCase()} ${DAY_LABELS[r.dayOfWeek as DayCode] ?? r.dayOfWeek}`
    : "";
  const onDays = r.cycle === "EACH" && r.daysOfMonth?.length ? `on the ${joinList(r.daysOfMonth.map(ordinal))}` : "";
  let detail = "";
  if (r.frequency === "WEEKLY") detail = `on ${joinList((r.daysOfWeek ?? []).map((d) => DAY_SHORT[d as DayCode] ?? d))}`;
  if (r.frequency === "MONTHLY") detail = onThe || onDays;
  if (r.frequency === "YEARLY") {
    detail = [`in ${joinList((r.months ?? []).map((m) => MONTHS[m - 1]))}`, onThe || onDays].filter(Boolean).join(", ");
  }
  const until = r.until ? `, until ${formatDate(r.until)}` : "";
  return [every, detail].filter(Boolean).join(" ") + until;
}

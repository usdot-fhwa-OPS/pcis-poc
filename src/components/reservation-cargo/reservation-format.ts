import { format } from "date-fns";

// "45 Minutes", "1 Hour", "2.5 Hours"
export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} Minutes`;
  const hours = Number((minutes / 60).toFixed(2));
  return `${hours} ${hours === 1 ? "Hour" : "Hours"}`;
}

// "Fri, 4/24/2026, 12:00 PM" (dates always show the day of week)
export function formatReservationTime(value: Date | string) {
  return format(typeof value === "string" ? new Date(value) : value, "EEE, M/d/yyyy, h:mm a");
}

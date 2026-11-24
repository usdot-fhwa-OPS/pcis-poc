import type { GangDomain } from "../terminal-resource/gang-domain"
import type { OpenInterval } from "../terminal-resource/terminal-resource-manager-client"
import type { OutageDomain } from "../terminal-resource/outage-domain"

// Client-side copies of the terminal-resource Lambda's rules, so the TO sees a problem before saving.
// The server checks everything again.

export type Recurrence = NonNullable<OutageDomain["recurrence"]>

// "Heavy-lift crane" -> "HEAVY_LIFT_CRANE"
export const toEquipmentCode = (label: string) =>
  label.trim().toUpperCase().replace(/[\s-]+/g, "_").replace(/[^A-Z0-9_]/g, "")

// Older gang records stored the list as "equipmentType".
export function gangTypes(g: GangDomain): string[] {
  const raw: unknown = g.equipmentTypes ?? (g as { equipmentType?: unknown }).equipmentType ?? []
  return Array.isArray(raw) ? raw.map(String) : [String(raw)]
}

// Returns a message or null.
export function intervalsProblem(intervals: OpenInterval[], label: string): string | null {
  const sorted = [...intervals].sort((a, b) => a.open.localeCompare(b.open))
  for (const iv of sorted) {
    if (!iv.open || !iv.close) return `${label}: enter both an opening and a closing time.`
    if (iv.close <= iv.open) return `${label}: closing time must be after opening time.`
  }
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].open < sorted[i - 1].close) return `${label}: open periods can't overlap.`
  }
  return null
}

// "10, 15, 27" -> [10, 15, 27]; null if anything isn't a day 1–31.
export function parseDays(text: string): number[] | null {
  const parts = text.split(/[\s,]+/).filter(Boolean)
  const days = parts.map(Number)
  if (!parts.length || days.some((d) => !Number.isInteger(d) || d < 1 || d > 31)) return null
  return [...new Set(days)].sort((a, b) => a - b)
}

// Returns a message or null.
export function recurrenceProblem(r: Recurrence | undefined, startDate: string): string | null {
  if (!r) return null
  if (!Number.isInteger(r.interval) || r.interval < 1 || r.interval > 99) return "Repeat every must be 1 to 99."
  if (r.frequency === "WEEKLY" && !r.daysOfWeek?.length) return "Pick at least one day of the week."
  if (r.frequency === "YEARLY" && !r.months?.length) return "Pick at least one month."
  if (r.cycle === "EACH" && !r.daysOfMonth?.length) return "Enter the days of the month, like 1, 15."
  if (r.until && startDate && r.until < startDate) return "The end date can't be before the first outage."
  return null
}

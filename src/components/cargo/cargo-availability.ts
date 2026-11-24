export type CargoStatus = "On-Ship" | "Discharged" | "Released"

export const CARGO_STATUS_STEPS: CargoStatus[] = [
  "On-Ship",
  "Discharged",
  "Released",
]

// holds can arrive as a string ("A, B"), an array, a Set, or (from older API
// responses) an empty object, so type it loosely and normalize defensively.
export type RawHolds =
  | (string | null)[]
  | string
  | Set<string>
  | Record<string, unknown>
  | null

export interface CargoAvailabilityItem {
  containerStatus?: string | null
  holds?: RawHolds
}

export function toCargoStatus(value?: string | null): CargoStatus {
  if (value === "Discharged" || value === "Released") {
    return value
  }
  return "On-Ship"
}

export function normalizeHolds(holds?: RawHolds): string[] {
  if (!holds) return []
  if (typeof holds === "string") {
    return holds
      .split(",")
      .map((hold) => hold.trim())
      .filter(Boolean)
  }

  if (Array.isArray(holds)) {
    return holds.filter(
      (hold): hold is string => typeof hold === "string" && hold.trim() !== ""
    )
  }

  if (holds instanceof Set) {
    return Array.from(holds).filter((hold) => hold && hold.trim() !== "")
  }

  if (typeof holds === "object") {
    // Map shape: { customs: true, line: false } -> ["customs"]
    return Object.entries(holds)
      .filter(([, active]) => Boolean(active))
      .map(([name]) => name)
  }

  return []
}

export function isCargoSelectable(cargo: CargoAvailabilityItem): boolean {
  return (
    cargo.containerStatus === "Released" &&
    normalizeHolds(cargo.holds).length === 0
  )
}

export function getUnselectableReason(
  cargo: CargoAvailabilityItem
): string | null {
  const holds = normalizeHolds(cargo.holds)
  const reasons: string[] = []

  if (cargo.containerStatus !== "Released") {
    reasons.push(
      `Status is "${cargo.containerStatus ?? "Unknown"}" (must be Released)`
    )
  }

  if (holds.length > 0) {
    reasons.push(`Active holds: ${holds.join(", ")}`)
  }

  return reasons.length > 0 ? reasons.join(" • ") : null
}
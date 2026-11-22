export type CargoStatus = "On-Ship" | "Discharged" | "Released"

export const CARGO_STATUS_STEPS: CargoStatus[] = [
  "On-Ship",
  "Discharged",
  "Released",
]

export interface CargoAvailabilityItem {
  containerStatus?: string | null
  holds?: (string | null)[] | string | null
}

export function toCargoStatus(value?: string | null): CargoStatus {
  if (value === "Discharged" || value === "Released") {
    return value
  }
  return "On-Ship"
}

export function normalizeHolds(
  holds?: (string | null)[] | string | null
): string[] {
  if (!holds) return []
  if (typeof holds === "string") {
    return holds
      .split(",")
      .map((hold) => hold.trim())
      .filter(Boolean)
  }
  return holds.filter((hold): hold is string => Boolean(hold && hold.trim()))
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
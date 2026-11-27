export const CARGO_STATUS_STEPS = [
  "On-Ship",
  "Discharged",
  "Released",
] as const

export type CargoStatus = (typeof CARGO_STATUS_STEPS)[number]

export type CargoHolds = Record<string, boolean>

export interface CargoAvailabilityItem {
  containerStatus?: string | null
  holds?: CargoHolds | null
}

export function isCargoStatus(value: unknown): value is CargoStatus {
  return (
    typeof value === "string" &&
    (CARGO_STATUS_STEPS as readonly string[]).includes(value)
  )
}

export function toCargoStatus(value?: string | null): CargoStatus {
  return isCargoStatus(value) ? value : "On-Ship"
}

export function normalizeHolds(holds?: CargoHolds | null): string[] {
  if (!holds) return []

  return Object.entries(holds)
    .filter(([, active]) => active)
    .map(([name]) => name)
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
import { BerthRequestDomain } from "../berth-requests/berth-request-domain"

// Returns "Cleared" | "X Hazmat" | "Submitted" | "" for the MANIFEST column.
// hazmatCount must be passed in from the caller once the backend provides it.
// TODO: Derive hazmatCount from BerthRequestDomain when that field is available.
export function getManifestDisplay(req: BerthRequestDomain, hazmatCount = 0): string {
  if (req.ataAt && req.atdAt) return "Cleared"
  if (hazmatCount > 0) return `${hazmatCount} Hazmat`
  if (req.manifestFileName) return "Submitted"
  return ""
}

// Returns null (= Berth Pending), "Cleared", or the berth designation for the BERTH column.
// null     → amber "Berth Pending": ATA not yet entered
// string   → green designation badge: ATA entered, vessel at berth
// "Cleared"→ gray badge: both ATA and ATD entered
export function getBerthDisplay(req: BerthRequestDomain): string | null {
  if (req.ataAt && req.atdAt) return "Cleared"
  if (!req.ataAt) return null
  return req.berthAssignment?.designation ?? null
}

export function isVesselArchived(req: BerthRequestDomain): boolean {
  return !!(req.ataAt && req.atdAt)
}

export function isBerthPending(req: BerthRequestDomain): boolean {
  return !req.ataAt
}

// Needs attention = has hazmat items in the manifest.
// TODO: Pass actual hazmatCount when available from the backend.
export function needsAttention(_req: BerthRequestDomain, hazmatCount = 0): boolean {
  return hazmatCount > 0
}

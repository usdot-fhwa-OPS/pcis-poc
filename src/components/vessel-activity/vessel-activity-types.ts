import { BerthRequestDomain } from "../berth-requests/berth-request-domain"

export type ManifestDisplayStatus = "Submitted" | "Pending" | "Rejected" | "Cleared"
export type VesselDisplayStatus = "Awaiting" | "Processing" | "On Hold" | "Returned" | "Cleared"

export function getManifestStatus(req: BerthRequestDomain): ManifestDisplayStatus {
  if (req.ataAt && req.atdAt) return "Cleared"
  if (req.status === "DENIED") return "Rejected"
  if (req.manifestFileName) return "Submitted"
  return "Pending"
}

export function getVesselDisplayStatus(req: BerthRequestDomain): VesselDisplayStatus {
  if (req.ataAt && req.atdAt) return "Cleared"
  if (req.status === "DENIED") return "Returned"
  if (req.status === "MODIFIED") return "On Hold"
  if (req.status === "APPROVED") return "Processing"
  return "Awaiting"
}

export function isVesselArchived(req: BerthRequestDomain): boolean {
  return !!(req.ataAt && req.atdAt)
}

export function isBerthPending(req: BerthRequestDomain): boolean {
  return !req.berthAssignment?.designation
}

export function needsAttention(req: BerthRequestDomain): boolean {
  return req.status === "DENIED" || req.status === "MODIFIED"
}

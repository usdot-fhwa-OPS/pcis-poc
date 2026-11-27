"use client"

import { Badge } from "../ui/badge"
import { CargoHolds, normalizeHolds } from "./cargo-availability"

const HOLD_STYLES: Record<string, string> = {
  customs: "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-100",
  line: "border-blue-300 bg-blue-100 text-blue-900 hover:bg-blue-100",
  "customs enforcement":
    "border-red-300 bg-red-100 text-red-900 hover:bg-red-100",
}

const DEFAULT_HOLD_STYLE =
  "border-rose-300 bg-rose-100 text-rose-900 hover:bg-rose-100"

interface HoldsBadgesProps {
  holds?: CargoHolds | null
}

export function HoldsBadges({ holds }: HoldsBadgesProps) {
  const activeHolds = normalizeHolds(holds)

  if (activeHolds.length === 0) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700"
      >
        Clear
      </Badge>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {activeHolds.map((hold) => (
        <Badge
          key={hold}
          variant="outline"
          className={`capitalize ${
            HOLD_STYLES[hold.toLowerCase()] ?? DEFAULT_HOLD_STYLE
          }`}
        >
          {hold}
        </Badge>
      ))}
    </div>
  )
}
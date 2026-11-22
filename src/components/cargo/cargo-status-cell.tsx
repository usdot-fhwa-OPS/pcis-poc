"use client"

import { ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import {
  CARGO_STATUS_STEPS,
  CargoStatus,
  toCargoStatus,
} from "./cargo-availability"
import { saveCargoUnit } from "./cargo-units-client"

const STATUS_STYLES: Record<CargoStatus, string> = {
  "On-Ship": "border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200",
  Discharged: "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200",
  Released:
    "border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200",
}

const DOT_STYLES: Record<CargoStatus, string> = {
  "On-Ship": "bg-slate-500",
  Discharged: "bg-amber-500",
  Released: "bg-emerald-600",
}

interface CargoStatusCellProps {
  cargoUnitID: string
  initialStatus?: string | null
  readOnly?: boolean
  onStatusChange?: (cargoUnitID: string, newStatus: CargoStatus) => void
}

export function CargoStatusCell({
  cargoUnitID,
  initialStatus,
  readOnly = false,
  onStatusChange,
}: CargoStatusCellProps) {
  const [status, setStatus] = useState<CargoStatus>(
    toCargoStatus(initialStatus)
  )
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setStatus(toCargoStatus(initialStatus))
  }, [initialStatus])

  const handleStatusChange = async (val: string) => {
    const nextStatus = toCargoStatus(val)
    const previousStatus = status

    setStatus(nextStatus)
    setIsSaving(true)

    try {
      const updatedContainerStatus = await saveCargoUnit({
        cargoUnitID,
        containerStatus: nextStatus,
      })
      console.log("Updated container status:", updatedContainerStatus)
      onStatusChange?.(cargoUnitID, nextStatus)
    } catch (error) {
      console.error("Error updating container status:", error)
      setStatus(previousStatus)
    } finally {
      setIsSaving(false)
    }
  }

  const isLocked = readOnly || status === "Released" || isSaving

  const statusPill = (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${DOT_STYLES[status]}`} />
      <span>{status}</span>
    </span>
  )

  if (readOnly) {
    return (
      <span
        className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
      >
        {statusPill}
      </span>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isLocked}>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 font-medium ${STATUS_STYLES[status]}`}
        >
          {statusPill}
          {!isLocked && <ChevronDown className="h-3.5 w-3.5 opacity-70" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52">
        <DropdownMenuLabel>Cargo Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={status}
          onValueChange={handleStatusChange}
        >
          {CARGO_STATUS_STEPS.map((step) => (
            <DropdownMenuRadioItem key={step} value={step}>
              <span className="inline-flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${DOT_STYLES[step]}`} />
                {step}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
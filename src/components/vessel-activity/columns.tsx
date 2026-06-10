import { ColumnDef } from "@tanstack/react-table"
import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { cn } from "../../lib/utils"
import { BerthRequestDomain } from "../berth-requests/berth-request-domain"
import { getManifestStatus, getVesselDisplayStatus } from "./vessel-activity-types"

const TIME_OPTIONS = [
  "12:00 AM", "01:00 AM", "02:00 AM", "03:00 AM", "04:00 AM", "05:00 AM",
  "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
  "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM",
]

// TODO: Extract to a shared component once a second use site outside berth-requests is confirmed.
function DateTimePicker({
  initialValue,
  requestId,
  field,
  disabled = false,
}: {
  initialValue: string | undefined
  requestId: string
  field: "ataAt" | "atdAt"
  disabled?: boolean
}) {
  const parsedDate = initialValue ? new Date(initialValue) : undefined
  const parsedTime = (() => {
    if (!parsedDate || isNaN(parsedDate.getTime())) return TIME_OPTIONS[12]
    const t = format(parsedDate, "hh:mm aa").toUpperCase()
    return TIME_OPTIONS.includes(t) ? t : TIME_OPTIONS[12]
  })()

  const [date, setDate] = useState<Date | undefined>(parsedDate)
  const [time, setTime] = useState<string>(parsedTime)
  const [open, setOpen] = useState(false)

  const label = field === "ataAt" ? "Enter ATA" : "Enter ATD"
  const displayLabel = date ? `${format(date, "MM/dd/yyyy")} ${time}` : undefined

  const handleSave = () => {
    if (!date) return
    const combined = `${format(date, "MM/dd/yyyy")} ${time}`
    setOpen(false)
    // TODO: call updateBerthRequest(requestId, { [field]: combined }) once wired up
    console.log("TODO updateBerthRequest", requestId, field, combined)
  }

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block cursor-not-allowed">
              <Button
                variant="outline"
                disabled
                className="w-44 justify-start text-left font-normal text-muted-foreground pointer-events-none"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {label}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Enter ATA first</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-44 justify-start text-left font-normal",
            !displayLabel && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayLabel ?? label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
        <div className="mt-3">
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger>
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button className="mt-3 w-full" onClick={handleSave} disabled={!date}>
          Save
        </Button>
      </PopoverContent>
    </Popover>
  )
}

const manifestBadgeClass: Record<string, string> = {
  Submitted: "bg-green-100 text-green-700 border-green-200",
  Pending:   "bg-gray-100 text-gray-600 border-gray-200",
  Rejected:  "bg-red-100 text-red-700 border-red-200",
  Cleared:   "bg-gray-100 text-gray-500 border-gray-200",
}

const statusBadgeClass: Record<string, string> = {
  Awaiting:   "bg-gray-50 text-gray-500 border-gray-200",
  Processing: "bg-blue-100 text-blue-700 border-blue-200",
  "On Hold":  "bg-gray-200 text-gray-700 border-gray-300",
  Returned:   "bg-orange-100 text-orange-700 border-orange-200",
  Cleared:    "bg-gray-100 text-gray-500 border-gray-200",
}

export const columns: ColumnDef<BerthRequestDomain>[] = [
  {
    id: "vessel",
    header: "VESSEL / VA",
    cell: ({ row }) => (
      <div className="min-w-[160px]">
        <div className="font-semibold text-gray-900 text-sm">{row.original.vesselID}</div>
        <div className="text-xs text-gray-500 mt-0.5">VA: {row.original.vesselAgentEmail}</div>
      </div>
    ),
  },
  {
    accessorKey: "etaAt",
    header: "ETA",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700 whitespace-nowrap">{row.original.etaAt}</span>
    ),
  },
  {
    id: "ataAt",
    header: "ATA",
    cell: ({ row }) => (
      <DateTimePicker
        initialValue={row.original.ataAt}
        requestId={row.original.requestId}
        field="ataAt"
      />
    ),
  },
  {
    accessorKey: "etdAt",
    header: "ETD",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700 whitespace-nowrap">{row.original.etdAt}</span>
    ),
  },
  {
    id: "atdAt",
    header: "ATD",
    cell: ({ row }) => (
      <DateTimePicker
        initialValue={row.original.atdAt}
        requestId={row.original.requestId}
        field="atdAt"
        disabled={!row.original.ataAt}
      />
    ),
  },
  {
    id: "berth",
    header: "BERTH",
    cell: ({ row }) => {
      const designation = row.original.berthAssignment?.designation
      if (!designation) {
        return (
          <span className="inline-flex whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            Berth Pending
          </span>
        )
      }
      return <span className="text-sm text-gray-700">{designation}</span>
    },
  },
  {
    id: "manifest",
    header: "MANIFEST",
    cell: ({ row }) => {
      const status = getManifestStatus(row.original)
      return (
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${manifestBadgeClass[status]}`}>
          {status}
        </span>
      )
    },
  },
  {
    id: "vesselStatus",
    header: "STATUS",
    cell: ({ row }) => {
      const status = getVesselDisplayStatus(row.original)
      return (
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadgeClass[status]}`}>
          {status}
        </span>
      )
    },
  },
  {
    id: "flags",
    header: "FLAGS",
    // TODO: Derive flags (Hazmat count, Doc Missing, etc.) from manifest analysis once the
    // backend provides structured flag data on the BerthRequestDomain.
    cell: () => <span className="text-gray-400 text-sm">—</span>,
  },
]

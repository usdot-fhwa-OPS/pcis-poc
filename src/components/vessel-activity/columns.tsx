import { ColumnDef } from "@tanstack/react-table"
import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, TriangleAlert } from "lucide-react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Calendar } from "../ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { cn } from "../../lib/utils"
import { BerthRequestDomain } from "../berth-requests/berth-request-domain"
import { getManifestDisplay, getBerthDisplay } from "./vessel-activity-types"
import { updateBerthRequest } from "../berth-requests/berth-request-client"
import { VesselAcitivtyTableMeta } from "./data-table"

const TIME_OPTIONS = [
  "12:00 AM", "01:00 AM", "02:00 AM", "03:00 AM", "04:00 AM", "05:00 AM",
  "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
  "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM",
]

// TODO: Extract to a shared component once a second confirmed use site exists outside berth-requests.
function DateTimePicker({
  initialValue,
  requestId,
  field,
  disabled = false,
  afterSaved,
}: {
  initialValue: string | undefined
  requestId: string
  field: "ataAt" | "atdAt"
  disabled?: boolean
  afterSaved?: any
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
  

  const handleSave = async () => {
    if (!date) return
    const combined = `${format(date, "MM/dd/yyyy")} ${time}`
    setOpen(false)
    let berthReq = {requestId:requestId} as BerthRequestDomain;
    berthReq[field] = combined;
    await updateBerthRequest(berthReq)
    afterSaved(requestId, combined);
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
                className="w-48 justify-start text-left font-normal text-muted-foreground pointer-events-none"
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
            "w-48 justify-start text-left font-normal",
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

// ── Shared column definitions ────────────────────────────────────────────────

const vesselColumn: ColumnDef<BerthRequestDomain> = {
  id: "vessel",
  header: "VESSEL",
  cell: ({ row }) => (
    <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
      {row.original.vesselID}
    </span>
  ),
}

const etaColumn: ColumnDef<BerthRequestDomain> = {
  accessorKey: "etaAt",
  header: "ETA",
  cell: ({ row }) => (
    <span className="text-sm text-gray-700 whitespace-nowrap">{row.original.etaAt}</span>
  ),
}

const ataColumn: ColumnDef<BerthRequestDomain> = {
  id: "ataAt",
  header: "ATA",
  cell: ({ row, table }) => (
    <DateTimePicker
      initialValue={row.original.ataAt}
      requestId={row.original.requestId}
      field="ataAt"
      afterSaved= {(requestId:string, newVal:string)=>{
        (table.options.meta as VesselAcitivtyTableMeta).setAtaAt(requestId, newVal)
      }}
    />
  ),
}

const etdColumn: ColumnDef<BerthRequestDomain> = {
  accessorKey: "etdAt",
  header: "ETD",
  cell: ({ row }) => (
    <span className="text-sm text-gray-700 whitespace-nowrap">{row.original.etdAt}</span>
  ),
}

const atdColumn: ColumnDef<BerthRequestDomain> = {
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
}

const berthColumn: ColumnDef<BerthRequestDomain> = {
  id: "berth",
  header: () => <div className="text-center">BERTH</div>,
  cell: ({ row }) => {
    const display = getBerthDisplay(row.original)
    return (
      <div className="flex justify-center">
        {display === null ? (
          <Badge className="border-amber-300 rounded-full bg-amber-100 hover:bg-amber-100/80 text-amber-700 whitespace-nowrap">
            Berth Pending
          </Badge>
        ) : display === "Cleared" ? (
          <Badge className="border-gray-300 rounded-full bg-gray-100 hover:bg-gray-100/80 text-gray-600">
            Cleared
          </Badge>
        ) : (
          <Badge className="border-green-300 rounded-full bg-green-100 hover:bg-green-100/80 text-green-700 whitespace-nowrap">
            {display}
          </Badge>
        )}
      </div>
    )
  },
}

const manifestColumn: ColumnDef<BerthRequestDomain> = {
  id: "manifest",
  header: () => <div className="text-center">MANIFEST</div>,
  cell: ({ row }) => {
    // TODO: Pass actual hazmatCount from backend when available.
    const display = getManifestDisplay(row.original)
    if (!display) return <div className="flex justify-center"><span className="text-gray-400 text-sm">—</span></div>

    const isHazmat = display.includes("Hazmat")
    const isCleared = display === "Cleared"

    return (
      <div className="flex justify-center">
        <Badge className={`rounded-full gap-1 ${
          isHazmat
            ? "border-amber-300 bg-amber-100 hover:bg-amber-100/80 text-amber-700"
            : isCleared
            ? "border-gray-300 bg-gray-100 hover:bg-gray-100/80 text-gray-600"
            : "border-green-300 bg-green-100 hover:bg-green-100/80 text-green-700"
        }`}>
          {isHazmat && <TriangleAlert className="h-3 w-3" />}
          {display}
        </Badge>
      </div>
    )
  },
}

// ── Per-tab column sets ──────────────────────────────────────────────────────

export const allColumns: ColumnDef<BerthRequestDomain>[] = [
  vesselColumn, etaColumn, ataColumn, etdColumn, atdColumn, berthColumn, manifestColumn,
]

export const inboundColumns: ColumnDef<BerthRequestDomain>[] = [
  vesselColumn, etaColumn, ataColumn, berthColumn, manifestColumn,
]

export const outboundColumns: ColumnDef<BerthRequestDomain>[] = [
  vesselColumn, etdColumn, atdColumn, berthColumn, manifestColumn,
]

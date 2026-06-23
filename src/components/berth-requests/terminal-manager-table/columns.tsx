"use client"

import { ColumnDef, Row, Table } from "@tanstack/react-table"
import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, CheckIcon, XIcon } from "lucide-react"
import { Button } from "../../ui/button"
import { Calendar } from "../../ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { cn } from "../../../lib/utils"
import { BerthRequestDomain } from "../berth-request-domain"
import { TerminalOperatorBerthRequestsTableMeta } from "./data-table"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog"
import { Textarea } from "../../../components/ui/textarea"
import { useNavigate } from "@tanstack/react-router"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../components/ui/tooltip"
import { Badge } from "../../../components/ui/badge"

function RequestDetails({ row, table }: { row: Row<BerthRequestDomain>; table: Table<BerthRequestDomain> }) {
  const meta = table.options.meta as TerminalOperatorBerthRequestsTableMeta
  const berthConfig = meta.berthConfigs?.find(c => c.terminalId === row.original.terminalId)
  

  return (
    <div className="space-y-2 text-sm">
      <p><span className="font-medium">Vessel ID:</span> {row.original.vesselID}</p>
      <div>
        <p className="font-medium">Contact:</p>
        <p className="pl-4">{berthConfig?.terminalName ?? '—'}</p>
        <p className="pl-4">Phone: {berthConfig?.terminalPhone ?? '—'}</p>
        <p className="pl-4">Email: {berthConfig?.terminalEmail ?? '—'}</p>
      </div>
      <p><span className="font-medium">Estimated Arrival:</span> {row.original.etaAt}</p>
      <p><span className="font-medium">Estimated Departure:</span> {row.original.etdAt}</p>
      <p><span className="font-medium">Date Requested:</span> {row.original.requestedAt}</p>
      <p><span className="font-medium">Services Required:</span> {row.original.services?.join(', ')}</p>
      <p><span className="font-medium">Cargo Manifest:</span> {row.original.manifestFileName}</p>
    </div>
  )
}

function ApproveDialog({ row, table }: { row: Row<BerthRequestDomain>; table: Table<BerthRequestDomain> }) {
  const [open, setOpen] = useState(false)
  const [selectedBerth, setSelectedBerth] = useState('')
  const meta = table.options.meta as TerminalOperatorBerthRequestsTableMeta
  const berthConfig = meta.berthConfigs?.find(c => c.terminalId === row.original.terminalId)
  const designations = (berthConfig?.berthDesignations ?? []) as string[]

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setSelectedBerth(row.original.berthAssignment?.designation ?? '')
    setOpen(isOpen)
  }

  const handleApprove = () => {
    meta.decideBerthRequest(row.original.requestId, 'APPROVED', { berthAssignment: selectedBerth })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger render={<Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1"><CheckIcon className="h-4 w-4" />Approve</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve Berth Request</DialogTitle>
          <DialogDescription>Review the Berth Request details before approving.</DialogDescription>
        </DialogHeader>
        <RequestDetails row={row} table={table} />
        <hr className="my-1" />
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium whitespace-nowrap">Select Berth Assignment:</span>
          <Select value={selectedBerth} onValueChange={setSelectedBerth}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {designations.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white">Approve Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DenyDialog({ row, table }: { row: Row<BerthRequestDomain>; table: Table<BerthRequestDomain> }) {
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const meta = table.options.meta as TerminalOperatorBerthRequestsTableMeta

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setComment('')
    setOpen(isOpen)
  }

  const handleDeny = () => {
    meta.decideBerthRequest(row.original.requestId, 'DENIED', { denialComment: comment || undefined })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger render={<Button size="sm" variant="destructive" className="gap-1"><XIcon className="h-4 w-4" />Deny</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deny Berth Request</DialogTitle>
          <DialogDescription>Review the Berth Request details before denying.</DialogDescription>
        </DialogHeader>
        <RequestDetails row={row} table={table} />
        <hr className="my-1" />
        <div className="space-y-1 text-sm">
          <p className="font-medium">Comment (Optional):</p>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter reason for denial..."
            className="resize-none"
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button variant="destructive" onClick={handleDeny}>Deny Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteDialog({ row, table }: { row: Row<BerthRequestDomain>; table: Table<BerthRequestDomain> }) {
  const [open, setOpen] = useState(false)
  const meta = table.options.meta as TerminalOperatorBerthRequestsTableMeta

  const handleDelete = () => {
    meta.deleteBerthRequest(row.original.requestId)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="link" className="text-red-600 p-0 h-auto">Delete</Button>} />
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="uppercase tracking-wide text-center">Confirmation Required</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-center py-2">
          Deleting a Berth Request can't be undone.<br />Do you want to continue?
        </p>
        <DialogFooter className="sm:justify-center">
          <Button onClick={handleDelete}>Yes</Button>
          <DialogClose render={<Button>No</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const TIME_OPTIONS = [
  "12:00 AM", "01:00 AM", "02:00 AM", "03:00 AM", "04:00 AM", "05:00 AM",
  "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
  "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM",
]

function DateTimePicker({
  initialValue,
  requestId,
  field,
  disabled = false,
  table,
}: {
  initialValue: string | undefined
  requestId: string
  field: "ataAt" | "atdAt"
  disabled?: boolean
  table: Table<BerthRequestDomain> 
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

  const meta = table.options.meta as TerminalOperatorBerthRequestsTableMeta
  const handleSave = async () => {
    if (!date) return
    const combined = `${format(date, "MM/dd/yyyy")} ${time}`
    setOpen(false)
    // TODO: call updateBerthRequest(requestId, { [field]: combined }) once wired up
    let bReq:BerthRequestDomain = {} as BerthRequestDomain;
    bReq[field] = combined;
    bReq.requestId = requestId;
    await  meta.modifyBerthRequest(bReq)
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
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
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

function formatDateTime(value: string | undefined): string {
  if (!value) return "—"
  try {
    return format(new Date(value), "MM/dd/yyyy hh:mm aa").toUpperCase()
  } catch {
    return value
  }
}

const statusBadgeClass: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-700 hover:bg-green-100",
  DENIED:   "bg-red-100 text-red-700 hover:bg-red-100",
  REQUESTED:"bg-blue-50 text-blue-700 hover:bg-blue-50",
  MODIFIED: "bg-amber-100 text-amber-700 hover:bg-amber-100",
}

export const columns: ColumnDef<BerthRequestDomain>[] = [
  // Define the columns for the table based on the database items (refer to resources.ts for schema names)
  {
    accessorKey: "vesselID",
    header: "Vessel ID",
    cell: ({ row }) => (
      <div className="flex space-x-8 ">
        <Button
          size="sm"
          variant="link"
          onClick={() =>
            {}
            //handleRespond(row.original.vesselID, 'Approved')
          }
        >
          {row.original.vesselID}
        </Button>
        <Button
          size="sm"
          variant="link"
          onClick={() =>
          {}
          }
        >
          Contact
        </Button>
      </div>
    ),
  },
{
    accessorKey: "respond",
    header: () => <div style={{ minWidth: "50px" }}>Respond to Request</div>,
    cell: ({ row, table }) => (
      <div className="flex space-x-4">
        <ApproveDialog row={row} table={table as Table<BerthRequestDomain>} />
        <DenyDialog row={row} table={table as Table<BerthRequestDomain>} />
      </div>
    ),

  },  
  {
    accessorKey: "etaAt",
    header: "Arrival (ETA)",
  },
  {
    accessorKey: "etdAt",
    header: "Depature (ETA)",
  },
  {
    accessorKey: "requestedAt",
    header: "Date Requested",
  },
  {
    accessorKey: "actions",
    header: () => <div style={{ minWidth: "50px" }}>Actions</div>,
    cell: ({ row, table }) => { 
      const navigate = useNavigate();
      return(
      <div className="flex space-x-4">
        <Button
          size="sm"
          variant="link"
          className="text-blue-600 p-0 h-auto"
          onClick={() => {
             sessionStorage.setItem('berthRequestOriginal', JSON.stringify(row.original))
            navigate({to:'/berth-request-modify'});

          }}
        >
          Modify
        </Button>
        <DeleteDialog row={row} table={table as Table<BerthRequestDomain>} />
      </div>
    )},

  },
]

// columns[0] = vesselID+Contact, columns[1] = respond (Approve/Deny)
// columns[2] = etaAt, columns[3] = etdAt, columns[4] = requestedAt, columns[5] = actions

const vesselIdOnlyColumn: ColumnDef<BerthRequestDomain> = {
  accessorKey: "vesselID",
  header: "Vessel ID",
  cell: ({ row }) => <div>{row.original.vesselID}</div>,
}

const contactColumn: ColumnDef<BerthRequestDomain> = {
  id: "contact",
  header: "Contact",
  cell: ({ row }) => (
    <a href={`mailto:${row.original.vesselAgentEmail}`}>
      <Button size="sm" variant="link" className="text-blue-600 p-0 h-auto">Contact</Button>
    </a>
  ),
}

export const requestedColumns: ColumnDef<BerthRequestDomain>[] = [
  vesselIdOnlyColumn,
  contactColumn,
  columns[1],
  columns[2],
  columns[3],
  columns[4],
  columns[5],
]

export const modificationRequestedColumns: ColumnDef<BerthRequestDomain>[] = [
  vesselIdOnlyColumn,
  contactColumn,
  columns[1],
  columns[2],
  columns[3],
  columns[4],
  columns[5],
]

export const ongoingColumns: ColumnDef<BerthRequestDomain>[] = [
  vesselIdOnlyColumn,
  contactColumn,
  {
    id: "berthAssignment",
    header: "Berth Assignment",
    cell: ({ row }) => (
      <div>{row.original.berthAssignment?.designation ?? "—"}</div>
    ),
  },
  {
    id: "ataAt",
    header: "Actual Arrival (ATA)",
    cell: ({ row , table}) => (
      <DateTimePicker
        initialValue={row.original.ataAt}
        requestId={row.original.requestId}
        field="ataAt"
        table={table}
      />
    ),
  },
  {
    id: "atdAt",
    header: "Actual Departure (ATD)",
    cell: ({ row , table}) => (
      <DateTimePicker
        initialValue={row.original.atdAt}
        requestId={row.original.requestId}
        field="atdAt"
        disabled={!row.original.ataAt}
        table={table}
      />
    ),
  },
  columns[2],
  columns[3],
  columns[4],
  columns[5],
]

export const completedColumns: ColumnDef<BerthRequestDomain>[] = [
  vesselIdOnlyColumn,
  contactColumn,
  {
    id: "berthAssignment",
    header: "Berth Assignment",
    cell: ({ row }) => (
      <div>{row.original.berthAssignment?.designation ?? "—"}</div>
    ),
  },
  {
    id: "ataAt",
    header: "Actual Arrival (ATA)",
    cell: ({ row }) => <div>{formatDateTime(row.original.ataAt)}</div>,
  },
  {
    id: "atdAt",
    header: "Actual Departure (ATD)",
    cell: ({ row }) => <div>{formatDateTime(row.original.atdAt)}</div>,
  },
  columns[2],
  columns[3],
  columns[4],
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.status
      return (
        <Badge className={`border-transparent rounded-full ${statusBadgeClass[s] ?? "bg-gray-100 text-gray-700 hover:bg-gray-100"}`}>
          {s}
        </Badge>
      )
    },
  },
]

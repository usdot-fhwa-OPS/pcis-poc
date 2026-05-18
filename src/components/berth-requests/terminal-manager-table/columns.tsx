"use client"

import { ColumnDef } from "@tanstack/react-table"
import { useState } from "react"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { BerthRequestDomain } from "../berth-request-domain"
import { TerminalOperatorBerthRequestsTableMeta } from "./data-table"

function InlineTimeInput({
  initialValue,
  requestId,
  field,
}: {
  initialValue: string | undefined
  requestId: string
  field: "ataAt" | "atdAt"
}) {
  const [value, setValue] = useState(initialValue ?? "")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (value === (initialValue ?? "")) return
    setSaving(true)
    // TODO: call updateBerthRequest(requestId, { [field]: value }) once wired up
    console.log("TODO updateBerthRequest", requestId, field, value)
    setSaving(false)
  }

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => { if (e.key === "Enter") handleSave() }}
      placeholder="MM/DD/YYYY HH:MM"
      disabled={saving}
      className="w-40 h-8 text-sm"
    />
  )
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
      <div className="flex space-x-8 ">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
             (table.options.meta  as TerminalOperatorBerthRequestsTableMeta)
                  .decideBerthRequest(row.original.requestId, 'APPROVED')
          }
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() =>
             (table.options.meta  as TerminalOperatorBerthRequestsTableMeta)
                  .decideBerthRequest(row.original.requestId, 'DENIED')
          }
        >
          Deny
        </Button>
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
    cell: ({ row, table }) => (
      <div className="flex space-x-8 ">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => 
          {row.original.requestId}
            //handleModify(row.original.vesselID)
            }
        >
          Modify
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => 
          {(table.options.meta  as TerminalOperatorBerthRequestsTableMeta)
                  .deleteBerthRequest(row.original.requestId)}
           
          }
        >
          Delete
        </Button>
      </div>
    ),

  },
]

// columns[0] = vesselID+Contact, columns[1] = respond (Approve/Deny)
// columns[2] = etaAt, columns[3] = etdAt, columns[4] = requestedAt, columns[5] = actions

export const requestedColumns: ColumnDef<BerthRequestDomain>[] = [...columns]

export const modificationRequestedColumns: ColumnDef<BerthRequestDomain>[] = [...columns]

export const ongoingColumns: ColumnDef<BerthRequestDomain>[] = [
  columns[0],
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
    cell: ({ row }) => (
      <InlineTimeInput
        initialValue={row.original.ataAt}
        requestId={row.original.requestId}
        field="ataAt"
      />
    ),
  },
  {
    id: "atdAt",
    header: "Actual Departure (ATD)",
    cell: ({ row }) => (
      <InlineTimeInput
        initialValue={row.original.atdAt}
        requestId={row.original.requestId}
        field="atdAt"
      />
    ),
  },
  columns[2],
  columns[3],
  columns[4],
]

export const completedColumns: ColumnDef<BerthRequestDomain>[] = [
  columns[0],
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
    cell: ({ row }) => <div>{row.original.ataAt ?? "—"}</div>,
  },
  {
    id: "atdAt",
    header: "Actual Departure (ATD)",
    cell: ({ row }) => <div>{row.original.atdAt ?? "—"}</div>,
  },
  columns[2],
  columns[3],
  columns[4],
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.status}</div>
    ),
  },
]

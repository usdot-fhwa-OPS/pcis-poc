"use client"

import { ColumnDef, Row, Table } from "@tanstack/react-table"
import { useState } from "react"
import { Button } from "../../ui/button"
import { BerthRequestDomain } from "../berth-request-domain"
import { BerthConfigDomain } from "../berth-config-domain"
import { VesselAgentBerthRequestsTableMeta } from "./data-table"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog"

function DeleteDialog({ row, table }: { row: Row<BerthRequestDomain>; table: Table<BerthRequestDomain> }) {
  const [open, setOpen] = useState(false)
  const meta = table.options.meta as VesselAgentBerthRequestsTableMeta

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

const showTerminal = (id: string) => { id }

const berthAssignmentColumn: ColumnDef<BerthRequestDomain> = {
  id: "berthAssignment",
  header: "Berth Assignment",
  cell: ({ row }) => (
    <div>{row.original.berthAssignment?.designation ?? "—"}</div>
  ),
}

const actualArrivalColumn: ColumnDef<BerthRequestDomain> = {
  accessorKey: "ataAt",
  header: "Actual Arrival (ATA)",
  cell: ({ row }) => (
    <div>{row.original.ataAt ?? "—"}</div>
  ),
}

const actualDepartureColumn: ColumnDef<BerthRequestDomain> = {
  accessorKey: "atdAt",
  header: "Actual Departure (ATD)",
  cell: ({ row }) => (
    <div>{row.original.atdAt ?? "—"}</div>
  ),
}

export const columns: ColumnDef<BerthRequestDomain>[] = [
  // Define the columns for the table based on the database items (refer to resources.ts for schema names)
  {
    accessorKey: "vesselID",
    header: "Vessel ID",
  },
{
    accessorKey: "terminal",
    header: () => <div style={{ minWidth: "50px" }}>Terminal</div>,
    cell: ({ row, table }) => {
      const terminal: BerthConfigDomain | undefined = (table.options.meta as VesselAgentBerthRequestsTableMeta)
                                              .brConfigList.find((value) =>(value.terminalId === row.original.terminalId)) 
      return (
        <Button size="sm" variant="link" onClick={() => showTerminal(row.original.vesselID)}>
          {terminal?.terminalName}
        </Button>
      )
    },

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
      <div className="flex space-x-4">
        <Button size="sm" variant="link" className="text-blue-600 p-0 h-auto" onClick={() => {}}>
          Modify
        </Button>
        <DeleteDialog row={row} table={table as Table<BerthRequestDomain>} />
      </div>
    ),

  },
]

// columns[0..1] = vesselID, terminal
// columns[2..4] = etaAt, etdAt, requestedAt
// columns[5]    = actions

const vesselIdOnlyColumn: ColumnDef<BerthRequestDomain> = {
  accessorKey: "vesselID",
  header: "Vessel ID",
  cell: ({ row }) => <div>{row.original.vesselID}</div>,
}

const terminalNameOnlyColumn: ColumnDef<BerthRequestDomain> = {
  id: "terminalName",
  header: "Terminal",
  cell: ({ row, table }) => {
    const terminal = (table.options.meta as VesselAgentBerthRequestsTableMeta)
      .brConfigList.find((t) => t.terminalId === row.original.terminalId)
    return <div>{terminal?.terminalName ?? "—"}</div>
  },
}

const contactColumn: ColumnDef<BerthRequestDomain> = {
  id: "contact",
  header: "Contact",
  cell: ({ row, table }) => {
    const terminal = (table.options.meta as VesselAgentBerthRequestsTableMeta)
      .brConfigList.find((t) => t.terminalId === row.original.terminalId)
    return (
      <a href={`mailto:${terminal?.terminalEmail}`}>
        <Button size="sm" variant="link" className="text-blue-600 p-0 h-auto">Contact</Button>
      </a>
    )
  },
}

export const requestedColumns: ColumnDef<BerthRequestDomain>[] = [
  vesselIdOnlyColumn,
  terminalNameOnlyColumn,
  contactColumn,
  columns[2],
  columns[3],
  columns[4],
  columns[5],
]

export const modificationRequestedColumns: ColumnDef<BerthRequestDomain>[] = [
  vesselIdOnlyColumn,
  terminalNameOnlyColumn,
  contactColumn,
  columns[2],
  columns[3],
  columns[4],
  columns[5],
]

export const ongoingColumns: ColumnDef<BerthRequestDomain>[] = [
  vesselIdOnlyColumn,
  terminalNameOnlyColumn,
  contactColumn,
  berthAssignmentColumn,
  actualArrivalColumn,
  columns[2],
  columns[3],
  columns[4],
  columns[5],
]

export const completedColumns: ColumnDef<BerthRequestDomain>[] = [
  vesselIdOnlyColumn,
  terminalNameOnlyColumn,
  contactColumn,
  berthAssignmentColumn,
  actualArrivalColumn,
  actualDepartureColumn,
  columns[2],
  columns[3],
  columns[4],
]

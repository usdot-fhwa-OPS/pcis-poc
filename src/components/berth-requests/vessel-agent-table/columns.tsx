"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "../../ui/button"
import { BerthRequestDomain } from "../berth-request-domain"
import { BerthConfigDomain } from "../berth-config-domain"
import { VesselAgentBerthRequestsTableMeta } from "./data-table"

const showTerminal = (
  id: string
) => {id}

const showContact = (
  contact: string
) => {contact}

const handleModify = (id: string) => {
  alert(`Modify request ${id}`)
}
const handleDelete = (id: string, table: any) => {
  const confirmed = window.confirm(
    'Are you sure you want to delete this berth request?'+id
  )

  if (confirmed) {
     {(table.options.meta )
                      .deleteBerthRequest(id)}
               
              }
  }

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
      <div className="flex space-x-8 ">
        <Button
          size="sm"
          variant="link"
          onClick={() =>
            showTerminal(row.original.vesselID)
          }
        >
          {terminal?.terminalName}
        </Button>
        <Button
          size="sm"
          variant="link"
          onClick={() =>
            showContact(row.original.vesselID)
          }
        >
          Contact
        </Button>
      </div>
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
      <div className="flex space-x-8 ">
        <Button
          size="sm"
          variant="link"
          onClick={() => handleModify(row.original.requestId)}
        >
          Modify
        </Button>

        <Button
          size="sm"
          variant="link"
          onClick={() => handleDelete(row.original.requestId, table)}
        >
          Delete
        </Button>
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
      <div>
        <a href={`mailto:${terminal?.terminalEmail}`}>
          <Button size="sm" variant="outline">Contact</Button>
        </a>
      </div>
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

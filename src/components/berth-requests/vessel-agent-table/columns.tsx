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
const handleDelete = (id: string) => {
  const confirmed = window.confirm(
    'Are you sure you want to delete this berth request?'+id
  )

  if (confirmed) {
    //setData((prev) => prev.filter((item) => item.id !== id))
  }
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
    cell: ({ row }) => (
      <div className="flex space-x-8 ">
        <Button
          size="sm"
          variant="link"
          onClick={() => handleModify(row.original.vesselID)}
        >
          Modify
        </Button>

        <Button
          size="sm"
          variant="link"
          onClick={() => handleDelete(row.original.vesselID)}
        >
          Delete
        </Button>
      </div>
    ),

  },
]

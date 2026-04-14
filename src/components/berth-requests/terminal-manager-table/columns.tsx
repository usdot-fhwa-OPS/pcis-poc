"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { BerthRequestDomain } from "../berth-request-domain"



const handleRespond = (
  id: string,
  status: 'Approved' | 'Rejected'
) => {
  /* setData((prev) =>
    prev.map((item) =>
      item.id === id ? { ...item, status } : item
    )
  ) */
}
const handleModify = (id: string) => {
  alert(`Modify request ${id}`)
}
const handleDelete = (id: string) => {
  const confirmed = window.confirm(
    'Are you sure you want to delete this berth request?'
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
    cell: ({ row }) => (
      <div className="flex space-x-8 ">
        <Button
          size="sm"
          variant="link"
          onClick={() =>
            handleRespond(row.original.vesselID, 'Approved')
          }
        >
          {row.original.vesselID}
        </Button>
        <Button
          size="sm"
          variant="link"
          onClick={() =>
            handleRespond(row.original.vesselID, 'Approved')
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
    cell: ({ row }) => (
      <div className="flex space-x-8 ">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            handleRespond(row.original.vesselID, 'Approved')
          }
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() =>
            handleRespond(row.original.vesselID, 'Rejected')
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
    cell: ({ row }) => (
      <div className="flex space-x-8 ">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleModify(row.original.vesselID)}
        >
          Modify
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDelete(row.original.vesselID)}
        >
          Delete
        </Button>
      </div>
    ),

  },
]

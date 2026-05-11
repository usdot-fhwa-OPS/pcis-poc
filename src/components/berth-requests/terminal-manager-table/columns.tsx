"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "../../ui/button"
import { BerthRequestDomain } from "../berth-request-domain"
import { TerminalOperatorBerthRequestsTableMeta } from "./data-table"

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

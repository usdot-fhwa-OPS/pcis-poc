"use client"

import { ColumnDef } from "@tanstack/react-table"

//Four Imports needed for Amplify Data Queries and CRUD methods

import { TerminalCapacityDomain } from "./terminal-capacity-domain"
import { DeleteTerminalCapacityButton } from "../terminal-capacity/delete-terminal-capacity-button.tsx";
import { UpdateTerminalCapacity } from "./update-terminal-capacity.tsx";

//const client = generateClient<Schema>();

//Define the selection of data that will be used for the table (type exported from cargo.tsx in this case)
export const columns: ColumnDef<TerminalCapacityDomain>[] = [
  // Define the columns for the table based on the database items (refer to resources.ts for schema names)
  {
    accessorKey: "capacity", 
    header: "Capacity",
  },
  {
    accessorKey: "startDate",
    header: "Start",
  },
   {
    accessorKey: "startTime",
    header: "",
  },
  {
    accessorKey: "endDate",
    header: "End",
  },
   {
    accessorKey: "endTime",
    header: "",
  },
 {
    accessorKey: "repeat",
    header: "Repeat",
  },
  {
    accessorKey: "reason",
    header: "Reason",
  },
  {
          accessorKey: "actions",
          header: () => <div style={{ minWidth: "50px"}}>Actions</div>,
          cell: ({ row }) => (
            <div className="flex space-x-8 ">
             {UpdateTerminalCapacity(row.original.capacityId)}
              <DeleteTerminalCapacityButton/>
            </div>
          ),
          
        },
]

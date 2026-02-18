"use client"

import { ColumnDef } from "@tanstack/react-table"

//Four Imports needed for Amplify Data Queries and CRUD methods

import { TerminalCapacityDomian } from "./terminal-capacity-domain"
import { DeleteTerminalCapacity } from "./delete-terminal-capacity"

//const client = generateClient<Schema>();

//Define the selection of data that will be used for the table (type exported from cargo.tsx in this case)
export const columns: ColumnDef<TerminalCapacityDomian>[] = [
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
    accessorKey: "endDate",
    header: "End",
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
    header: " Actions",
    cell: ({ row }) => {
      // Initialize local state with the current containerStatus.
      // const [cargoStatus, setStatus] = useState<"On-Ship" | "On-Dock">(
      //   row.original.containerStatus as "On-Ship" | "On-Dock"
      // )

      return (
        <div>
          <a >Edit</a> &nbsp;&nbsp; { DeleteTerminalCapacity(row.original.capacityId)}

        </div>
      )
    },
  
  },
]

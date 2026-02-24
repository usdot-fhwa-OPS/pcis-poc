"use client"

import { ColumnDef } from "@tanstack/react-table"

//Four Imports needed for Amplify Data Queries and CRUD methods

import { TerminalCapacityDomian } from "./terminal-capacity-domain"
import { DeleteTerminalCapacityButton } from "../terminal-capacity/delete-terminal-capacity-button.tsx";

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
    header: " Actions",
    cell: ({ row }) => {
        <div className="flex space-x-8 ">
              <Button 
                variant="outline" 
                //onClick={() => ()} 
                //TO DO: PCIS2-42
              >
                Edit
              </Button>
              <DeleteTerminalCapacityButton/>
          </div>
    },
  
  },
]

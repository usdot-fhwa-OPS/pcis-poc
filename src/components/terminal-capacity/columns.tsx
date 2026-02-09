"use client"

import { ColumnDef } from "@tanstack/react-table"

//Four Imports needed for Amplify Data Queries and CRUD methods

import { TerminalCapacityDomian } from "./terminal-capacity-domain"

//const client = generateClient<Schema>();

//Define the selection of data that will be used for the table (type exported from cargo.tsx in this case)
export const columns: ColumnDef<TerminalCapacityDomian>[] = [
  // Define the columns for the table based on the database items (refer to resources.ts for schema names)
  {
    accessorKey: "capacityId",
    header: "Capacity Id",
  },
  {
    accessorKey: "capacity", 
    header: "Capacity",
  },
  {
    accessorKey: "startDate",
    header: "Start",
  },
  {
    accessorKey: "endtDate",
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
    accessorKey: "transopEmail",
    header: "Transportation Operator Email",
  }, 
  {
    accessorKey: "actions",
    header: " Actions",
    cell: (/*{ row }*/) => {
      // Initialize local state with the current containerStatus.
      // const [cargoStatus, setStatus] = useState<"On-Ship" | "On-Dock">(
      //   row.original.containerStatus as "On-Ship" | "On-Dock"
      // )

      return (
        <div></div>
      )
    },
  },
  {
    accessorKey: "flag",
    header: "Flag",
    cell: (/*{ row }*/) => {
      // Initialize flagged state from the row data; fallback to false if undefined.
      //const [flagged, setFlagged] = useState<boolean>(row.original.flag || false)

      // Function to handle flag toggling.
      // const handleFlagToggle = async () => {
      //   const newFlag = !flagged
      //   // Optimistically update the UI.
      //   setFlagged(newFlag)
      //   try {
      //     // Call the Amplify update method for the flag (again must always contain containerID)
      //     const { data: updatedContainerStatus } = await client.models.Container.update({
      //       cargoUnitID: row.original.cargoUnitID, // changed containerID to cargoUnitID
      //       flag: newFlag,
      //     })
      //     console.log("Updated flag:", updatedContainerStatus)
      //   } catch (error) {
      //     console.error("Error updating flag:", error);
      //   }
      // }

      return (
        <div></div>
        // <Button variant="ghost" onClick={handleFlagToggle} className="p-2">
        //   <Flag className={flagged ? "text-red-600" : "text-gray-400"} />
        // </Button>
      )
    },
  },
]

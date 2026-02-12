"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Flag } from "lucide-react"
import { useState } from "react"
import { Button } from "../ui/button"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
//Four Imports needed for Amplify Data Queries and CRUD methods

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { UpcomingCargo } from "../../routes/cargo"

const client = generateClient<Schema>();

//Define the selection of data that will be used for the table (type exported from cargo.tsx in this case)
export const columns: ColumnDef<UpcomingCargo>[] = [
  // Define the columns for the table based on the database items (refer to resources.ts for schema names)
  {
    accessorKey: "vesselID",
    header: "Vessel ID",
  },
  {
    accessorKey: "cargoUnitID", 
    header: "Cargo Unit ID",
  },
  {
    accessorKey: "origin",
    header: "Origin",
  },
  {
    accessorKey: "bcoName",
    header: "BCO",
  },
  {
    accessorKey: "bcoEmail",
    header: "BCO Email",
  },
  {
    accessorKey: "transopName",
    header: "Transportation Coordinator and Dispatcher",
  },
  {
    accessorKey: "transopEmail",
    header: "Transportation Coordinator and Dispatcher Email",
  }, 
  {
    accessorKey: "cargoUnitStatus",
    header: "Cargo Unit Status",
    cell: ({ row }) => {
      // Initialize local state with the current containerStatus.
      const [cargoStatus, setStatus] = useState<"On-Ship" | "On-Dock">(
        row.original.cargoUnitStatus as "On-Ship" | "On-Dock"
      )

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={cargoStatus === "On-Dock"}>
            <Button variant="outline">{cargoStatus}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Cargo Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={cargoStatus}
              onValueChange={async (val: string) => {
                // Update the UI immediately.
                setStatus(val as "On-Ship" | "On-Dock")
                try {
                  // Call the Amplify update method (must always contain containerID)
                  const { data: updatedCargoUnitStatus } = await client.models.Container.update({
                    cargoUnitID: row.original.cargoUnitID, 
                    cargoUnitStatus: val,
                  })
                  console.log("Updated Cargo Unit Status:", updatedCargoUnitStatus)
                } catch (error) {
                  console.error("Error updating Cargo Unit Status:", error)
                }
              }}
            >
              <DropdownMenuRadioItem value="On-Ship">On-Ship</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="On-Dock">On-Dock</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    accessorKey: "flag",
    header: "Flag",
    cell: ({ row }) => {
      // Initialize flagged state from the row data; fallback to false if undefined.
      const [flagged, setFlagged] = useState<boolean>(row.original.flag || false)

      // Function to handle flag toggling.
      const handleFlagToggle = async () => {
        const newFlag = !flagged
        // Optimistically update the UI.
        setFlagged(newFlag)
        try {
          // Call the Amplify update method for the flag (again must always contain containerID)
          const { data: updatedCargoUnitStatus } = await client.models.Container.update({
            cargoUnitID: row.original.cargoUnitID, 
            flag: newFlag,
          })
          console.log("Updated flag:", updatedCargoUnitStatus)
        } catch (error) {
          console.error("Error updating flag:", error);
        }
      }

      return (
        <Button variant="ghost" onClick={handleFlagToggle} className="p-2">
          <Flag className={flagged ? "text-red-600" : "text-gray-400"} />
        </Button>
      )
    },
  },
]

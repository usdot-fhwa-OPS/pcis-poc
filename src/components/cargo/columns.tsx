"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Flag } from "lucide-react"
import { useState } from "react"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { CargoTableMeta } from "./cargo-table"



import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog"  

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
    header: () => <div className="text-center">Vessel ID</div>,
  },
  {
    accessorKey: "containerID",
    header: () => <div className="text-center">Container ID</div>,
  },
  {
    accessorKey: "origin",
    header: () => <div className="text-center">Origin</div>,
  },
  {
    accessorKey: "bcoName",
    header: () => <div className="text-center">BCO</div>,
  },
  {
    accessorKey: "bcoEmail",
    header: () => <div className="text-center">BCO Email</div>,
  },
  {
    accessorKey: "transopName",
    header: () => <div className="text-center">Transportation Operator</div>,
    cell: ({ row, table }) => {
      const cargo = row.original
  
      const [open, setOpen] = useState(false)
      const [tempName, setTempName] = useState("")
      const [tempEmail, setTempEmail] = useState("")
  
      // If either operator OR email is missing, show "Book" button
      const isMissing = !cargo.transopName?.trim() || !cargo.transopEmail?.trim()
  
      function handleSubmit() {
        // Use the parent's updateCargo method:
        (table.options.meta as CargoTableMeta)?.updateCargo(cargo.containerID, tempName, tempEmail)
        setOpen(false)
      }
  
      if (isMissing) {
        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Book</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Book Transportation Operator</DialogTitle>
                <DialogDescription>
                  Enter a name and email to assign this cargo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-2">
                <div>
                  <Label>Operator Name</Label>
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Operator Email</Label>
                  <Input
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!tempName.trim() || !tempEmail.trim()}>
                  Submit
                  </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }
  
      // If both operator and email are already filled, just display operator's name
      return <span>{cargo.transopName}</span>
    },
  },
  {
    accessorKey: "transopEmail",
    header: () => <div className="text-center">Transportation Operator Email</div>,
    cell: ({ row, table }) => {
      const cargo = row.original
  
      const [open, setOpen] = useState(false)
      const [tempName, setTempName] = useState("")
      const [tempEmail, setTempEmail] = useState("")
  
      // If either operator OR email is missing, show "Book" button
      const isMissing = !cargo.transopName?.trim() || !cargo.transopEmail?.trim()
  
      function handleSubmit() {
        (table.options.meta as CargoTableMeta)?.updateCargo(cargo.containerID, tempName, tempEmail)
        setOpen(false)
      }
  
      if (isMissing) {
        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Book</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Book Transportation Operator</DialogTitle>
                <DialogDescription>
                  Enter a name and email to assign this cargo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-2">
                <div>
                  <Label>Operator Name</Label>
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Operator Email</Label>
                  <Input
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!tempName.trim() || !tempEmail.trim()}>
                  Submit
                  </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }
  
      // If both fields are already set, show the email
      return <span>{cargo.transopEmail}</span>
    },
  }, 
  {
    accessorKey: "containerStatus",
    header: () => <div className="text-center">Cargo Status</div>,
    cell: ({ row }) => {
      // Initialize local state with the current containerStatus.
      const [cargoStatus, setStatus] = useState<"On Ship" | "On Dock">(
        row.original.containerStatus as "On Ship" | "On Dock"
      )

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">{cargoStatus}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Cargo Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={cargoStatus}
              onValueChange={async (val: string) => {
                // Update the UI immediately.
                setStatus(val as "On Ship" | "On Dock")
                try {
                  // Call the Amplify update method (must always contain containerID)
                  const { data: updatedContainerStatus } = await client.models.Container.update({
                    containerID: row.original.containerID,
                    containerStatus: val,
                  })
                  console.log("Updated container status:", updatedContainerStatus)
                } catch (error) {
                  console.error("Error updating container status:", error)
                }
              }}
            >
              <DropdownMenuRadioItem value="On Ship">On Ship</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="On Dock">On Dock</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    accessorKey: "flag",
    header: () => <div className="text-center">Flag</div>,
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
          const { data: updatedContainerStatus } = await client.models.Container.update({
            containerID: row.original.containerID,
            flag: newFlag,
          })
          console.log("Updated flag:", updatedContainerStatus)
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
  // Temporary column to add contact button
  {
    id: "contact",
    header: () => <div className="text-center">Contact</div>,
    cell: ({ row }) => {
      const email = row.original.bcoEmail

      // Option A: Anchor tag wrapping a Button
      return (
        <a
          href={`mailto:${email}?subject=Inquiry%20About%20Cargo&body=Hello%20${row.original.bcoName},`}
        >
          <Button variant="outline">Contact</Button>
        </a>
      )
    },
  },
]

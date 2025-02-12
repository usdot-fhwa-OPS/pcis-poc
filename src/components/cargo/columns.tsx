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

export type Cargo = {
    vesselID : number
    containerID : string
    origin: string
    bco: string
    bco_email: string
    operator: string
    operator_email: string
    status: "On Ship" | "On Dock"
    flag: boolean
    contact: string // Temporarily putting this here to add contact button
}

export const columns : ColumnDef<Cargo>[] = [
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
        accessorKey: "bco",
        header: () => <div className="text-center">BCO</div>,
    },
    {
        accessorKey: "bco_email",
        header: () => <div className="text-center">BCO Email</div>,
    },
    {
      accessorKey: "operator",
      header: () => <div className="text-center">Transportation Operator</div>,
      cell: ({ row, table }) => {
        const cargo = row.original
    
        const [open, setOpen] = useState(false)
        const [tempName, setTempName] = useState("")
        const [tempEmail, setTempEmail] = useState("")
    
        // If either operator OR email is missing, show "Book" button
        const isMissing = !cargo.operator?.trim() || !cargo.operator_email?.trim()
    
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
        return <span>{cargo.operator}</span>
      },
    },
    {
      accessorKey: "operator_email",
      header: () => <div className="text-center">Transportation Operator Email</div>,
      cell: ({ row, table }) => {
        const cargo = row.original
    
        const [open, setOpen] = useState(false)
        const [tempName, setTempName] = useState("")
        const [tempEmail, setTempEmail] = useState("")
    
        // If either operator OR email is missing, show "Book" button
        const isMissing = !cargo.operator?.trim() || !cargo.operator_email?.trim()
    
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
        return <span>{cargo.operator_email}</span>
      },
    },     
    {
        accessorKey: "status",
        header: () => <div className="text-center">Cargo Status</div>,
        cell: ({ row }) => { 
            const [cargoStatus, setStatus] = useState<"On Ship" | "On Dock">(row.original.status)

            return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">{cargoStatus}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Cargo Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={cargoStatus} onValueChange={(val: string) => setStatus(val as "On Ship" | "On Dock")}>
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
        cell: () => {
            const [flagged, setFlagged] = useState(false)

            return (
                <Button 
                variant="ghost" 
                onClick={() => setFlagged((prev) => !prev)}
                className="p-2"
                >
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
          const email = row.original.bco_email
      
          return (
            <a
              href={`mailto:${email}?subject=Inquiry%20About%20Cargo&body=Hello%20${row.original.bco},`}
            >
              <Button variant="outline">Contact</Button>
            </a>
          )
        },
      },

]
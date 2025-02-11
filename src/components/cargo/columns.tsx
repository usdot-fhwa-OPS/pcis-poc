"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Flag } from "lucide-react"
import { useState } from "react"
import { Button } from "../ui/button"

import { UpcomingCargo } from "../../routes/cargo"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "../ui/dropdown-menu"

// export type Cargo = {
//     vesselID : number
//     containerID : string
//     origin: string
//     bco: string
//     bco_email: string
//     operator: string
//     operator_email: string
//     status: "On Ship" | "On Dock"
//     flag: boolean
//     //contact: string // Temporarily putting this here to add contact button
// }

export const columns : ColumnDef<UpcomingCargo>[] = [
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
    },
    {
        accessorKey: "transopEmail",
        header: () => <div className="text-center">Transportation Operator Email</div>,
    },
    {
        accessorKey: "assignmentStatus",
        header: () => <div className="text-center">Cargo Status</div>,
        cell: ({ row }) => { 
            const [cargoStatus, setStatus] = useState<"On-Ship" | "On-Dock">(row.original.assignmentStatus as "On-Ship" | "On-Dock")

            return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">{cargoStatus}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Cargo Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={cargoStatus} onValueChange={(val: string) => setStatus(val as "On-Ship" | "On-Dock")}>
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
      }
]
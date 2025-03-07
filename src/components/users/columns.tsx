"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "../ui/badge"

export type User = {
    given_name : string
    family_name: string
    "custom:role" : string
    "custom:organization" : string
    email : string
    phone_number : string
    verification_status : string
} 

export const columns : ColumnDef<User>[] = [
    {
        accessorKey: "given_name",
        header: () => <div className="text-center">Name</div>,
    },
    {
        accessorKey: "family_name",
        header: () => <div className="text-center">Name</div>,
    },
    {
        accessorKey: "custom:role",
        header: () => <div className="text-center">Role</div>,
    },
    {
        accessorKey: "custom:organization",
        header: () => <div className="text-center">Organization</div>,
    },
    {
        accessorKey: "email",
        header: () => <div className="text-center">Email</div>,
    },
    {
        accessorKey: "phone_number",
        header: () => <div className="text-center">Phone Number</div>,
    },
    {
        accessorKey: "verification_status",
        header: () => <div className="text-center">Status</div>,
        cell: ({row}) => { 
            return <Badge variant="outline">{row.original.verification_status}</Badge>
        },
    },   
]
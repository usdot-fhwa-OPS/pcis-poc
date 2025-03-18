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
        header: "First Name",
    },
    {
        accessorKey: "family_name",
        header: "Last Name",
    },
    {
        accessorKey: "custom:role",
        header: "Role",
    },
    {
        accessorKey: "custom:organization",
        header: "Organization",
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "phone_number",
        header: "Phone Number",
    },
    {
        accessorKey: "verification_status",
        header: "Status",
        cell: ({row}) => { 
            return <Badge variant="outline">{row.original.verification_status}</Badge>
        },
    },   
]
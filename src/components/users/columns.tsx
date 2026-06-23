"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "../ui/badge"

export type User = {
    given_name: string
    family_name: string
    "custom:role": string
    "custom:organization": string
    email: string
    phone_number: string
    verification_status: string
}

export const columns: ColumnDef<User>[] = [
    {
        id: "full_name",
        header: "Full Name",
        cell: ({ row }) => (
            <span className="font-medium text-gray-900">
                {`${row.original.given_name ?? ""} ${row.original.family_name ?? ""}`.trim()}
            </span>
        ),
        filterFn: (row, _, filterValue: string) => {
            const fullName = `${row.original.given_name ?? ""} ${row.original.family_name ?? ""}`.toLowerCase()
            return fullName.includes(filterValue.toLowerCase())
        },
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
        cell: ({ row }) => {
            const status = row.original.verification_status
            const isVerified = status?.toLowerCase() === "verified"
            return (
                <Badge className={
                    isVerified
                        ? "border-transparent rounded-full bg-green-100 hover:bg-green-100/80 text-green-700"
                        : "border-transparent rounded-full bg-amber-100 hover:bg-amber-100/80 text-amber-700"
                }>
                    {status}
                </Badge>
            )
        },
    },
]

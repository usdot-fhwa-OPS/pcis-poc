import { ColumnDef } from "@tanstack/react-table"
import { CheckCircle, XCircle, TriangleAlert } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { Button } from "../ui/button"
import { HazardousCargoItem } from "./hazardous-cargo-types"

// TODO: hazmatClass and unNumber display "—" until those fields are added to DynamoDB schema.
export const columns: ColumnDef<HazardousCargoItem>[] = [
  {
    accessorKey: "cargoUnitID",
    header: "Cargo Unit",
    cell: ({ row }) => (
      <span className="font-medium text-gray-900">{row.original.cargoUnitID}</span>
    ),
  },
  {
    accessorKey: "vesselId",
    header: "Vessel",
  },
  {
    accessorKey: "hazmatClass",
    header: "Hazmat Class",
    // TODO: Replace placeholder once hazmatClass is added to DynamoDB schema.
    cell: ({ row }) => {
      const val = row.original.hazmatClass
      if (!val) return <span className="text-gray-400">—</span>
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
          <TriangleAlert className="h-3 w-3" /> {val}
        </span>
      )
    },
  },
  {
    accessorKey: "unNumber",
    header: "UN Number",
    // TODO: Replace placeholder once unNumber is added to DynamoDB schema.
    cell: ({ row }) => row.original.unNumber ?? <span className="text-gray-400">—</span>,
  },
  {
    accessorKey: "isCompliant",
    header: "Documentation Status",
    cell: ({ row }) => {
      const compliant = row.original.isCompliant
      return compliant ? (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300">
          <CheckCircle className="h-3 w-3" /> Compliant
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-300">
          <XCircle className="h-3 w-3" /> Non-Compliant
        </span>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    // TODO: Wire up navigation to real detail page once backend is connected.
    cell: ({ row }) => (
      <Button
        asChild
        variant={row.original.isCompliant ? "outline" : "destructive"}
        size="sm"
      >
        <Link
          to="/hazardous-cargo/$cargoUnitID"
          params={{ cargoUnitID: row.original.cargoUnitID }}
        >
          View
        </Link>
      </Button>
    ),
  },
]

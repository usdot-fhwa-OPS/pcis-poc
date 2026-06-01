"use client"

import { useState } from "react"
import { CheckCircle, XCircle } from "lucide-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { HazardousCargoItem } from "./hazardous-cargo-types"
import { useNavigate } from "@tanstack/react-router"

function ViewButton({ cargoUnitID, nonCompliant }: { cargoUnitID: string; nonCompliant: boolean }) {
  const navigate = useNavigate()
  return (
    <Button
      variant={nonCompliant ? "destructive" : "outline"}
      size="sm"
      onClick={() => navigate({ to: '/hazardous-cargo/$cargoUnitID', params: { cargoUnitID } })}
    >
      View
    </Button>
  )
}

// TODO: hazmatClass and unNumber columns display "--" until those fields are added
// to the DynamoDB schema and populated via the backend.
export const hazardousCargoColumns: ColumnDef<HazardousCargoItem>[] = [
  {
    accessorKey: "cargoUnitID",
    header: "Container",
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
    // TODO: Replace placeholder with real data once hazmatClass is added to DynamoDB schema.
    cell: ({ row }) => {
      const val = row.original.hazmatClass
      if (!val) return <span className="text-gray-400">—</span>
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
          ▲ {val}
        </span>
      )
    },
  },
  {
    accessorKey: "unNumber",
    header: "UN Number",
    // TODO: Replace placeholder with real data once unNumber is added to DynamoDB schema.
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
    cell: ({ row }) => <ViewButton cargoUnitID={row.original.cargoUnitID} nonCompliant={!row.original.isCompliant} />,
  },
]

interface HazardousCargoTableProps {
  data: HazardousCargoItem[]
}

export function HazardousCargoTable({ data }: HazardousCargoTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const table = useReactTable({
    data,
    columns: hazardousCargoColumns,
    getCoreRowModel: getCoreRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { columnFilters, pagination },
  })

  return (
    <div className="w-full border rounded-lg overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <Input
          placeholder="Filter by Container ID..."
          value={(table.getColumn("cargoUnitID")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("cargoUnitID")?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-gray-50">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={row.original.isCompliant ? "" : "bg-red-50 border-l-2 border-l-red-400"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={hazardousCargoColumns.length} className="h-24 text-center text-gray-500">
                No hazardous cargo records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <span className="text-sm text-gray-600">
          Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{" "}
          <strong>{table.getPageCount()}</strong>
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="border p-1 rounded text-sm"
        >
          {[5, 10, 20].map((size) => (
            <option key={size} value={size}>Show {size}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

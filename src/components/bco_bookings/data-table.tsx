"use client"
import * as React from "react"
import { Input } from "../ui/input.tsx"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnFiltersState,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table.tsx"

export interface BCODataTableMeta {
  assignTransOp: (cargoUnitID: string, newName: string, newEmail: string, reservationStatus: string) => Promise<boolean>; // changed containerID to cargoUnitID
  fetchTransportationOperators: () => Promise<any>
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  meta?: BCODataTableMeta
}

export function DataTable<TData, TValue>({ columns, data, meta }: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    meta: meta as BCODataTableMeta,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: { columnFilters },
    initialState: {
      sorting: [
        {id: "updatedAt", desc:true }
      ],
    },
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    
          <div className="mb-4 w-full px-3 py-2 border rounded-md">
        <Input
          placeholder="Filter by Cargo Unit ID" //changed Container ID to Cargo unit ID
          value={(table.getColumn("cargoUnitID")?.getFilterValue() as string) ?? ""}  // changed containerID to cargoUnitID
          onChange={(event) =>
            table.getColumn("cargoUnitID")?.setFilterValue(event.target.value) // changed containerID to cargoUnitID
          }
          className="max-w-sm"
        />
     

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

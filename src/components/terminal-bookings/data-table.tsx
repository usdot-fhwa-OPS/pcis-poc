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
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table.tsx"

<<<<<<< HEAD
export interface TransOpBookingDataTableMeta{
  updateBooking: (containerID: string, bookingStatus: string) => void
=======
//Adding interface for setting Booking status
export interface TerminalOperatorDataTableMeta {
  updateBooking: (id: string, status: string)  => void
>>>>>>> 2dbaf0de53eb987247153bdf75a3065e8f202903
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
<<<<<<< HEAD
  meta?: TransOpBookingDataTableMeta
}

export function DataTable<TData, TValue>({ columns, data, meta }: DataTableProps<TData, TValue>) {
=======
  meta?: TerminalOperatorDataTableMeta
}

export function DataTable<TData, TValue>({ columns, data ,meta}: DataTableProps<TData, TValue>) {
>>>>>>> 2dbaf0de53eb987247153bdf75a3065e8f202903
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
<<<<<<< HEAD
    meta: meta as TransOpBookingDataTableMeta,
=======
    meta: meta as TerminalOperatorDataTableMeta,
>>>>>>> 2dbaf0de53eb987247153bdf75a3065e8f202903
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: { columnFilters },
  })

  return (
    
          <div className="mb-4 w-full px-3 py-2 border rounded-md">
        <Input
          placeholder="Filter by Container ID"
          value={(table.getColumn("containerID")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("containerID")?.setFilterValue(event.target.value)
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

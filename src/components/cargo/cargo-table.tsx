"use client"

import * as React from "react"

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  TableOptions
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
import { type Cargo } from "./columns"

export interface CargoTableMeta {
  updateCargo: (containerID: string, newName: string, newEmail: string) => void
}

interface CargoTableOptions extends TableOptions<Cargo> {
  
  Row: Cargo

  mata?: CargoTableMeta
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  meta?: {
    updateCargo?: (containerID: string, newName: string, newEmail: string) => void
  }
}

export function DataTable<TData, TValue>({
  columns,
  data,
  meta,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )

  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    meta,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
        columnFilters,
        rowSelection,
    },
  })

  return (
    <div>
        <div className="flex items-center py-4">
        <Input
          placeholder="Filter by Container ID..."
          value={(table.getColumn("containerID")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("containerID")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

    <div className="rounded-md border">
      <Table className="w-full table-fixed text-center">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
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
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  </div>
  )
}

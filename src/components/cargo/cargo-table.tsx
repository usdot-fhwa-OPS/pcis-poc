"use client"

import * as React from "react"

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

import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Input } from "../ui/input"

export interface CargoTableMeta {
  updateCargo: (cargoUnitID: string, newName: string, newEmail: string) => void 
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  meta?: CargoTableMeta
}

export function DataTable<TData, TValue>({
  columns,
  data,
  meta,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const [pagination, setPagination] = React.useState({
              pageIndex: 0,
              pageSize: 10,
          })

  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    meta: meta as CargoTableMeta,
    getCoreRowModel: getCoreRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    getPaginationRowModel: getPaginationRowModel(),
    state: {
        columnFilters,
        rowSelection,
        pagination,
    },
  })

  const { pageIndex, pageSize } = table.getState().pagination
  const totalRows = table.getFilteredRowModel().rows.length
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const lastRow = Math.min((pageIndex + 1) * pageSize, totalRows)
  const pageCount = table.getPageCount()

  return (
    <>
    {/* Filtering */}
    <div className="flex max-xl:flex-wrap items-center gap-2 mb-4 p-2 bg-white border rounded-xl">
      <div className="relative ml-auto">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          placeholder="Search cargo unit ID..." 
          value={(table.getColumn("cargoUnitID")?.getFilterValue() as string) ?? ""} 
          onChange={(event) =>
            table.getColumn("cargoUnitID")?.setFilterValue(event.target.value) 
          }
          className="w-48 h-auto pl-8 pr-3 py-1.5 border border-gray-300 rounded-md shadow-none text-sm placeholder:text-gray-500 focus:outline-none focus:border-transparent focus-visible:outline-solid focus-visible:ring-2"
        />
      </div>
    </div>
    {/* Scrolling Container */}
    <div className="w-full not-last:mb-8 bg-white border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="leading-4">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray-50/50 hover:bg-gray-50 data-[state=selected]:bg-gray-50/50 text-xs tracking-wide">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="px-4 text-gray-500">
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
                  className="hover:bg-gray-50/50 data-[state=selected]:bg-gray-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent data-[state=selected]:bg-transparent">
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                  There is no cargo to display.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      {totalRows > 0 && (
        // Full pagination controls render only if there are more than 12 rows to display
        <div className="flex max-sm:flex-col items-center justify-between max-sm:justify-center gap-x-8 gap-y-4 px-4 py-3 border-t text-sm text-gray-500">
          {totalRows == 1 && (
            <span>{totalRows} item</span>
          )}
          {totalRows > 1 && totalRows < 12 && (
            <span>{totalRows} items</span>
          )}
          {totalRows > 12 && (
            <>
            <span>{firstRow} - {lastRow} of {totalRows} items</span>
            <div className="flex items-center gap-x-2 sm:mr-auto">
              <select
                id="rowsPerPage"
                value={table.getState().pagination.pageSize}
                onChange={(e) =>
                  table.setPageSize(Number(e.target.value))
                }
                className="p-1 border border-gray-300 rounded outline-gray-900 text-gray-700"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size} className="hover:bg-gray-900 text-gray-600 hover:text-white">
                    {size}
                  </option>
                ))}
              </select>
              <label htmlFor="rowsPerPage">items per page</label>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => table.setPageIndex(i)}
                  className={`w-8 h-8 rounded text-sm font-medium ${
                    pageIndex === i
                      ? "bg-gray-900 text-white"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            </>
          )}
        </div>
      )}
    </div>
    </>
  )
}

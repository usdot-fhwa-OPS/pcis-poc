import * as React from "react"
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"

type ResourceTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  emptyText: string
}

// A small table in the app's existing table style, for the /capacity sections.
// (C-8 uses this until U-1's shared DataTable is on develop.)
export function ResourceTable<TData>({ columns, data, emptyText }: ResourceTableProps<TData>) {
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })
  const total = data.length

  return (
    <div className="w-full bg-white border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="leading-4">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray-50/50 hover:bg-gray-50 text-xs uppercase tracking-wide">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-4 text-gray-500">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-50/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-4 has-[button]:px-4 has-[button]:py-3 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-20 text-center text-gray-500">
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {total > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-t text-sm text-gray-500">
          <span>{total === 1 ? "1 item" : `${total} items`}</span>
          {table.getPageCount() > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="px-2">Page {pagination.pageIndex + 1} of {table.getPageCount()}</span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
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

const PAGE_SIZE = 10

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: PAGE_SIZE })

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const { pageIndex } = table.getState().pagination
  const pageCount = table.getPageCount()
  const start = pageIndex * PAGE_SIZE
  const total = data.length

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
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

      <div className="flex items-center gap-4 px-3 py-3 text-sm border-t">
        <span>
          {total === 0
            ? "0 items"
            : `${start + 1} - ${Math.min(start + PAGE_SIZE, total)} of ${total} items`}
        </span>
        <span className="flex items-center gap-1">
          Pages:
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              onClick={() => table.setPageIndex(i)}
              className={`px-2 py-0.5 border rounded ${pageIndex === i ? "bg-muted font-semibold" : ""}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-2 py-0.5 border rounded disabled:opacity-50"
          >
            Next &gt;
          </button>
        </span>
      </div>
    </div>
  )
}

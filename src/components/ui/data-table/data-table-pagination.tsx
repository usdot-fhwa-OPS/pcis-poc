import type { Table } from "@tanstack/react-table"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  pageSizeOptions: number[]
}

// Page numbers to show: first, last, and the current page with one neighbour each side
function visiblePages(pageIndex: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([0, pageCount - 1, pageIndex - 1, pageIndex, pageIndex + 1])
  const sorted = Array.from(pages).filter((i) => i >= 0 && i < pageCount).sort((a, b) => a - b)
  const result: (number | "gap")[] = []
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) result.push("gap")
    result.push(page)
  })
  return result
}

export function DataTablePagination<TData>({ table, pageSizeOptions }: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination
  const totalRows = table.getFilteredRowModel().rows.length
  const pageCount = table.getPageCount()
  if (totalRows === 0) return null

  const firstRow = pageIndex * pageSize + 1
  const lastRow = Math.min((pageIndex + 1) * pageSize, totalRows)
  const showPageSize = totalRows > Math.min(...pageSizeOptions)

  return (
    <div className="flex max-sm:flex-col items-center justify-between max-sm:justify-center gap-x-8 gap-y-4 px-4 py-3 border-t text-sm text-gray-500">
      <span>
        {pageCount > 1
          ? `${firstRow} - ${lastRow} of ${totalRows} items`
          : `${totalRows} ${totalRows === 1 ? "item" : "items"}`}
      </span>
      {showPageSize && (
        <div className="flex items-center gap-x-2 sm:mr-auto">
          <select
            id="rowsPerPage"
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="p-1 border border-gray-300 rounded outline-gray-900 text-gray-700"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <label htmlFor="rowsPerPage">items per page</label>
        </div>
      )}
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          {visiblePages(pageIndex, pageCount).map((page, i) =>
            page === "gap" ? (
              <span key={`gap-${i}`} className="w-8 text-center">…</span>
            ) : (
              <button
                key={page}
                onClick={() => table.setPageIndex(page)}
                aria-current={pageIndex === page ? "page" : undefined}
                className={`w-8 h-8 rounded text-sm font-medium ${
                  pageIndex === page ? "bg-gray-900 text-white" : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {page + 1}
              </button>
            ),
          )}
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

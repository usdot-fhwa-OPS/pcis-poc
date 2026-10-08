import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  Header,
  PaginationState,
  RowSelectionState,
  SortingState,
  TableMeta,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"

import { Skeleton } from "../skeleton.tsx"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table.tsx"
import { DataTablePagination } from "./data-table-pagination.tsx"
import { DataTableToolbar } from "./data-table-toolbar.tsx"
import { withVariantFilterFns } from "./filter-fns.ts"
import "./types.ts"

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  // Passed through to `table.options.meta` for row actions defined in columns
  meta?: TableMeta<TData>
  getRowId?: (row: TData, index: number) => string
  isLoading?: boolean
  emptyMessage?: string
  enableGlobalSearch?: boolean
  searchPlaceholder?: string
  enableSorting?: boolean
  enableColumnVisibility?: boolean
  enableRowSelection?: boolean
  initialSorting?: SortingState
  initialColumnVisibility?: VisibilityState
  defaultPageSize?: number
  pageSizeOptions?: number[]
  // Page-specific controls shown at the start of the toolbar, e.g. status chips
  toolbarLeading?: React.ReactNode
  // Page-specific buttons shown at the end of the toolbar, e.g. "Add" or "Export"
  toolbarActions?: React.ReactNode
}

const DEFAULT_PAGE_SIZES = [5, 10, 20, 50]
const LOADING_ROWS = 5

export function DataTable<TData, TValue>({
  columns,
  data,
  meta,
  getRowId,
  isLoading = false,
  emptyMessage = "There are no items to display.",
  enableGlobalSearch = true,
  searchPlaceholder = "Search",
  enableSorting = true,
  enableColumnVisibility = true,
  enableRowSelection = false,
  initialSorting = [],
  initialColumnVisibility = {},
  defaultPageSize = 10,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  toolbarLeading,
  toolbarActions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialColumnVisibility)
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: defaultPageSize })

  const resolvedColumns = React.useMemo(() => withVariantFilterFns(columns), [columns])

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    meta,
    getRowId,
    enableSorting,
    enableRowSelection,
    state: { sorting, columnFilters, globalFilter, columnVisibility, rowSelection, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const visibleColumnCount = table.getVisibleLeafColumns().length
  const rows = table.getRowModel().rows

  return (
    <>
      <DataTableToolbar
        table={table}
        enableGlobalSearch={enableGlobalSearch}
        enableColumnVisibility={enableColumnVisibility}
        searchPlaceholder={searchPlaceholder}
        leading={toolbarLeading}
        actions={toolbarActions}
      />
      <div className="w-full not-last:mb-8 bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="leading-4">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-gray-50/50 hover:bg-gray-50 data-[state=selected]:bg-gray-50/50 text-xs uppercase tracking-wide"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan} className="px-4 text-gray-500">
                      {header.isPlaceholder ? null : <HeaderContent header={header} />}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: LOADING_ROWS }, (_, i) => (
                  <TableRow key={`loading-${i}`} className="hover:bg-transparent">
                    {Array.from({ length: visibleColumnCount }, (_, j) => (
                      <TableCell key={j} className="p-4">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    className="hover:bg-gray-50/50 data-[state=selected]:bg-gray-50/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="p-4 has-[button]:px-4 has-[button]:py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent data-[state=selected]:bg-transparent">
                  <TableCell colSpan={visibleColumnCount} className="h-24 text-center text-gray-500">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {!isLoading && <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />}
      </div>
    </>
  )
}

function HeaderContent<TData>({ header }: { header: Header<TData, unknown> }) {
  const content = flexRender(header.column.columnDef.header, header.getContext())
  if (!header.column.getCanSort()) return content

  const sorted = header.column.getIsSorted()
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown
  return (
    <button
      type="button"
      onClick={header.column.getToggleSortingHandler()}
      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
      className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-900"
    >
      {content}
      <Icon className={`h-3.5 w-3.5 shrink-0 ${sorted ? "text-gray-900" : "text-gray-400"}`} />
    </button>
  )
}

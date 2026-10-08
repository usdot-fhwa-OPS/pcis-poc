import * as React from "react"
import type { Table } from "@tanstack/react-table"
import { Search, X } from "lucide-react"

import { Button } from "../button.tsx"
import { Input } from "../input.tsx"
import { DataTableColumnFilter } from "./data-table-column-filter.tsx"
import { DataTableViewOptions } from "./data-table-view-options.tsx"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  enableGlobalSearch: boolean
  enableColumnVisibility: boolean
  searchPlaceholder: string
  leading?: React.ReactNode
  actions?: React.ReactNode
}

export function DataTableToolbar<TData>({
  table,
  enableGlobalSearch,
  enableColumnVisibility,
  searchPlaceholder,
  leading,
  actions,
}: DataTableToolbarProps<TData>) {
  const filterColumns = table
    .getAllLeafColumns()
    .filter((column) => column.columnDef.meta?.filterVariant && column.getCanFilter())
  const globalFilter = (table.getState().globalFilter as string) ?? ""
  const isFiltered = table.getState().columnFilters.length > 0 || globalFilter !== ""

  if (filterColumns.length === 0 && !enableGlobalSearch && !enableColumnVisibility && !leading && !actions) {
    return null
  }

  return (
    <div className="flex max-xl:flex-wrap items-center gap-2 mb-4 p-2 bg-white border rounded-xl">
      {leading}
      {filterColumns.map((column) => (
        <DataTableColumnFilter key={column.id} column={column} />
      ))}
      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            table.resetColumnFilters()
            table.setGlobalFilter("")
          }}
          className="h-8 px-2 text-gray-700"
        >
          Reset
          <X />
        </Button>
      )}
      <div className="flex items-center gap-2 ml-auto">
        {enableGlobalSearch && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder={searchPlaceholder}
              aria-label="Search table"
              value={globalFilter}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              className="w-48 h-8 pl-8 pr-3 py-1.5 border border-gray-300 rounded-md shadow-none text-sm placeholder:text-gray-500 focus:outline-none focus:border-transparent focus-visible:outline-solid focus-visible:ring-2"
            />
          </div>
        )}
        {actions}
        {enableColumnVisibility && <DataTableViewOptions table={table} />}
      </div>
    </div>
  )
}

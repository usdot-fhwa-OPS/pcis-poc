import type { RowData } from "@tanstack/react-table"

// How a column is filtered in the DataTable toolbar. Columns without a variant are
// still covered by the global search.
export type DataTableFilterVariant = "text" | "select" | "multiSelect" | "dateRange"

export interface DataTableFilterOption {
  label: string
  value: string
}

export interface DateRangeFilterValue {
  from?: Date
  to?: Date
}

declare module "@tanstack/react-table" {
  // TData and TValue must match TanStack's declaration even though they are unused here
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    // Name shown in filters and the column picker when the header isn't plain text
    label?: string
    filterVariant?: DataTableFilterVariant
    // Fixed choices for select/multiSelect; otherwise built from the column's values
    filterOptions?: DataTableFilterOption[]
    filterPlaceholder?: string
  }
}

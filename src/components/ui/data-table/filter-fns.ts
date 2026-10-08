import { endOfDay, isValid, startOfDay } from "date-fns"
import type { ColumnDef, Row, RowData } from "@tanstack/react-table"
import type { DateRangeFilterValue } from "./types.ts"

// Accepts Date objects, timestamps, ISO strings and the app's MM/dd/yyyy strings
export function parseDateValue(value: unknown): Date | undefined {
  if (value instanceof Date) return isValid(value) ? value : undefined
  if (typeof value === "number") return new Date(value)
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = new Date(value)
    return isValid(parsed) ? parsed : undefined
  }
  return undefined
}

export function multiSelectFilter<TData extends RowData>(
  row: Row<TData>,
  columnId: string,
  filterValue: string[],
): boolean {
  const value = row.getValue(columnId)
  return filterValue.includes(String(value ?? ""))
}
multiSelectFilter.autoRemove = (value: unknown) => !Array.isArray(value) || value.length === 0

export function dateRangeFilter<TData extends RowData>(
  row: Row<TData>,
  columnId: string,
  filterValue: DateRangeFilterValue,
): boolean {
  const date = parseDateValue(row.getValue(columnId))
  if (!date) return false
  if (filterValue.from && date < startOfDay(filterValue.from)) return false
  if (filterValue.to && date > endOfDay(filterValue.to)) return false
  return true
}
dateRangeFilter.autoRemove = (value: unknown) => {
  const range = value as DateRangeFilterValue | undefined
  return !range || (!range.from && !range.to)
}

// Sorts MM/dd/yyyy strings by date rather than as text; empty dates go last
export function dateValueSort<TData extends RowData>(rowA: Row<TData>, rowB: Row<TData>, columnId: string): number {
  const a = parseDateValue(rowA.getValue(columnId))
  const b = parseDateValue(rowB.getValue(columnId))
  if (!a || !b) return a ? -1 : b ? 1 : 0
  return a.getTime() - b.getTime()
}

// Gives columns that declare a select/multiSelect/dateRange variant the matching filter
// function (and date sorting for dateRange), so column definitions only need `meta.filterVariant`.
export function withVariantFilterFns<TData, TValue>(
  columns: ColumnDef<TData, TValue>[],
): ColumnDef<TData, TValue>[] {
  return columns.map((column) => {
    const resolved: Record<string, unknown> = {}
    if ("columns" in column && column.columns) {
      resolved.columns = withVariantFilterFns(column.columns)
    }
    const variant = column.meta?.filterVariant
    if (variant && variant !== "text" && !("filterFn" in column && column.filterFn)) {
      resolved.filterFn = variant === "dateRange" ? dateRangeFilter<TData> : multiSelectFilter<TData>
    }
    if (variant === "dateRange" && !column.sortingFn) {
      resolved.sortingFn = dateValueSort<TData>
    }
    return { ...column, ...resolved } as ColumnDef<TData, TValue>
  })
}

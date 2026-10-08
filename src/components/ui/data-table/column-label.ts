import type { Column } from "@tanstack/react-table"

// Name for a column in filters, the column picker and exports
export function getColumnLabel<TData>(column: Column<TData, unknown>): string {
  const { meta, header } = column.columnDef
  if (meta?.label) return meta.label
  if (typeof header === "string") return header
  return column.id
}

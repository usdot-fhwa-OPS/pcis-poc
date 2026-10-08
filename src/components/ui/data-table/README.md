# DataTable

Shared table for every list page (story U-1). It replaces the per-feature `data-table.tsx` copies. Out of the box it has global search, per-column filters, sorting, pagination, column show/hide, and loading and empty states.

## Usage

```tsx
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "../ui/data-table"

const columns: ColumnDef<Reservation, unknown>[] = [
  { accessorKey: "cargoUnitID", header: "Cargo Unit ID", meta: { filterVariant: "text" } },
  { accessorKey: "status", header: "Status", meta: { filterVariant: "multiSelect" } },
  { accessorKey: "direction", header: "Direction", meta: { filterVariant: "select" } },
  { accessorKey: "reservationDate", header: "Date", meta: { filterVariant: "dateRange" } },
  { id: "actions", header: "Actions", cell: ({ row, table }) => <RowActions row={row} meta={table.options.meta} />, enableHiding: false },
]

<DataTable
  columns={columns}
  data={reservations}
  meta={{ updateBooking }}              // read in cells via table.options.meta
  searchPlaceholder="Search reservations"
  initialSorting={[{ id: "updatedAt", desc: true }]}
  emptyMessage="There are no reservations to display."
  isLoading={loading}
  toolbarActions={<Button size="sm">Add</Button>}
/>
```

## Column `meta`

| Key | Purpose |
| --- | --- |
| `filterVariant` | `"text"`, `"select"`, `"multiSelect"` or `"dateRange"`. Adds a toolbar filter for the column. Leave it out to rely on global search only. |
| `filterOptions` | Fixed `{ label, value }[]` for select and multiSelect. Without it, options are built from the column's values. |
| `filterPlaceholder` | Placeholder for a text filter. |
| `label` | Name used in filters and the Columns menu when `header` is JSX rather than a string. |

## Notes

- **Date-range columns** accept `Date` objects, timestamps, ISO strings and `MM/dd/yyyy` strings. They also sort by date rather than as text.
- **Sorting** is on for every accessor column; set `enableSorting: false` on a column to turn it off. Display-only columns (with an `id` and no accessor) never sort.
- **Hiding:** set `enableHiding: false` on columns that must always show, such as actions.
- **Props:** `enableGlobalSearch`, `enableColumnVisibility`, `enableSorting` and `enableRowSelection` turn whole features on or off. `defaultPageSize` and `pageSizeOptions` control paging.
- **Excel/CSV export** is added by U-2 on top of this component.

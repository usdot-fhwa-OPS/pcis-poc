import { ColumnDef } from "@tanstack/react-table"
import { Button } from "../ui/button"

export interface BerthRequest {
  vesselId: string
  terminal: string
  terminalEmail: string
  arrivalDate: string
  arrivalTime: string
  departureDate: string
  departureTime: string
  dateRequested: string
  timeRequested: string
}

const baseColumns: ColumnDef<BerthRequest>[] = [
  { accessorKey: "vesselId", header: "Vessel ID" },
  {
    accessorKey: "terminal",
    header: "Terminal",
    cell: ({ row }) => (
      <span className="flex items-center gap-2">
        {row.original.terminal}
        <a href={`mailto:${row.original.terminalEmail}`}>
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
            Contact
          </Button>
        </a>
      </span>
    ),
  },
  {
    id: "arrival",
    header: "Arrival (ETA)",
    cell: ({ row }) => `${row.original.arrivalDate} ${row.original.arrivalTime}`,
  },
  {
    id: "departure",
    header: "Departure (ETD)",
    cell: ({ row }) => `${row.original.departureDate} ${row.original.departureTime}`,
  },
  {
    id: "dateRequested",
    header: "Date Requested",
    cell: ({ row }) => `${row.original.dateRequested} ${row.original.timeRequested}`,
  },
]

const actionsColumn: ColumnDef<BerthRequest> = {
  id: "actions",
  header: "Actions",
  cell: () => (
    <span className="flex gap-3">
      <button className="text-sm font-medium hover:underline">Modify</button>
      <button className="text-sm font-medium hover:underline">Delete</button>
    </span>
  ),
}

export const editableColumns = (): ColumnDef<BerthRequest>[] => [
  ...baseColumns,
  actionsColumn,
]

export const readOnlyColumns = (): ColumnDef<BerthRequest>[] => [...baseColumns]

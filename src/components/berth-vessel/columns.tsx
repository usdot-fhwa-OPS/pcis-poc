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
  status?: string
  berthAssignment?: string
  actualArrivalDate?: string
  actualArrivalTime?: string
  actualDepartureDate?: string
  actualDepartureTime?: string
}

const vesselIdColumn: ColumnDef<BerthRequest> = {
  accessorKey: "vesselId",
  header: "Vessel ID",
}

const terminalColumn: ColumnDef<BerthRequest> = {
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
}

const berthAssignmentColumn: ColumnDef<BerthRequest> = {
  accessorKey: "berthAssignment",
  header: "Berth Assignment",
}

const actualArrivalColumn: ColumnDef<BerthRequest> = {
  id: "actualArrival",
  header: "Actual Arrival (ATA)",
  cell: ({ row }) => `${row.original.actualArrivalDate} ${row.original.actualArrivalTime}`,
}

const actualDepartureColumn: ColumnDef<BerthRequest> = {
  id: "actualDeparture",
  header: "Actual Departure (ATD)",
  cell: ({ row }) => `${row.original.actualDepartureDate} ${row.original.actualDepartureTime}`,
}

const arrivalColumn: ColumnDef<BerthRequest> = {
  id: "arrival",
  header: "Arrival (ETA)",
  cell: ({ row }) => `${row.original.arrivalDate} ${row.original.arrivalTime}`,
}

const departureColumn: ColumnDef<BerthRequest> = {
  id: "departure",
  header: "Departure (ETD)",
  cell: ({ row }) => `${row.original.departureDate} ${row.original.departureTime}`,
}

const dateRequestedColumn: ColumnDef<BerthRequest> = {
  id: "dateRequested",
  header: "Date Requested",
  cell: ({ row }) => `${row.original.dateRequested} ${row.original.timeRequested}`,
}


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

export const requestedColumns = (): ColumnDef<BerthRequest>[] => [
  vesselIdColumn,
  terminalColumn,
  arrivalColumn,
  departureColumn,
  dateRequestedColumn,
  actionsColumn,
]

export const modificationRequestedColumns = (): ColumnDef<BerthRequest>[] => [
  vesselIdColumn,
  terminalColumn,
  arrivalColumn,
  departureColumn,
  dateRequestedColumn,
  actionsColumn,
]

export const ongoingColumns = (): ColumnDef<BerthRequest>[] => [
  vesselIdColumn,
  terminalColumn,
  berthAssignmentColumn,
  actualArrivalColumn,
  arrivalColumn,
  departureColumn,
  dateRequestedColumn,
  actionsColumn,
]

export const completedColumns = (): ColumnDef<BerthRequest>[] => [
  vesselIdColumn,
  terminalColumn,
  berthAssignmentColumn,
  actualArrivalColumn,
  actualDepartureColumn,
  arrivalColumn,
  departureColumn,
  dateRequestedColumn,
]

"use client"

import { ColumnDef } from "@tanstack/react-table"
import { UpdateTerminalCapacity } from "../terminal-capacity/update-terminal-capacity"
import { DeleteTerminalCapacityButton } from "../terminal-capacity/delete-terminal-capacity-button"
import { TerminalCapacityDomain } from "../terminal-capacity/terminal-capacity-domain"

export const columns: ColumnDef<TerminalCapacityDomain>[] = [
  {
    accessorKey: "capacity",
    header: "Capacity",
  },
  {
    id: "startDateTime",
    header: "Start Date/Time",
    cell: ({ row }) => `${row.original.startDate ?? ""} ${row.original.startTime ?? ""}`.trim(),
  },
  {
    id: "endDateTime",
    header: "End Date/Time",
    cell: ({ row }) => `${row.original.endDate ?? ""} ${row.original.endTime ?? ""}`.trim(),
  },
  {
    accessorKey: "repeat",
    header: "Repeat",
  },
  {
    accessorKey: "reason",
    header: "Reason",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {UpdateTerminalCapacity(row.original.capacityId)}
        {DeleteTerminalCapacityButton(row.original.capacityId)}
      </div>
    ),
  },
]

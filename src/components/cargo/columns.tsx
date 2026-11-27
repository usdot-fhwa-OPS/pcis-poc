"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Flag } from "lucide-react"
import { useEffect, useState } from "react"
import { UpcomingCargo } from "../../routes/cargo"
import { Button } from "../ui/button"
import { normalizeHolds } from "./cargo-availability"
import { CargoStatusCell } from "./cargo-status-cell"
import { saveCargoUnit } from "./cargo-units-client"
import { CargoTableMeta } from "./cargo-table"
import { HoldsBadges } from "./holds-badges"

function FlagCell({
  cargoUnitID,
  initialFlag,
}: {
  cargoUnitID: string
  initialFlag: boolean
}) {
  const [flagged, setFlagged] = useState<boolean>(initialFlag)

  useEffect(() => {
    setFlagged(initialFlag)
  }, [initialFlag])

  const handleFlagToggle = async () => {
    const newFlag = !flagged
    setFlagged(newFlag)
    try {
      const updatedContainerStatus = await saveCargoUnit({
        cargoUnitID,
        flag: newFlag,
      })
      console.log("Updated flag:", updatedContainerStatus)
    } catch (error) {
      console.error("Error updating flag:", error)
      setFlagged(!newFlag)
    }
  }

  return (
    <div className="text-center">
      <Button variant="ghost" onClick={handleFlagToggle} className="p-2">
        <Flag className={flagged ? "text-red-600" : "text-gray-500"} />
      </Button>
    </div>
  )
}

export const columns: ColumnDef<UpcomingCargo>[] = [
  {
    accessorKey: "vesselID",
    header: "Vessel ID",
  },
  {
    accessorKey: "cargoUnitID",
    header: "Cargo Unit ID",
  },
  {
    accessorKey: "origin",
    header: "Origin",
  },
  {
    accessorKey: "bcoName",
    header: "BCO",
  },
  {
    accessorKey: "bcoEmail",
    header: "BCO Email",
  },
  {
    accessorKey: "transopName",
    header: "Transportation Coordinator",
  },
  {
    accessorKey: "transopEmail",
    header: "Transportation Coordinator Email",
  },
  {
    accessorKey: "containerStatus",
    header: "Cargo Status",
    cell: ({ row, table }) => {
      const meta = table.options.meta as CargoTableMeta | undefined

      return (
        <CargoStatusCell
          cargoUnitID={row.original.cargoUnitID}
          initialStatus={row.original.containerStatus}
          onStatusChange={meta?.updateCargoStatus}
        />
      )
    },
  },
  {
    accessorKey: "holds",
    header: "Holds",
    cell: ({ row }) => <HoldsBadges holds={row.original.holds} />,
    filterFn: (row, _columnId, filterValue: unknown) => {
      const query = String(filterValue ?? "").trim().toLowerCase()
      if (!query) return true
      return normalizeHolds(row.original.holds).some((hold) =>
        hold.toLowerCase().includes(query)
      )
    },
  },
  {
    accessorKey: "flag",
    header: () => <div className="text-center">Flag</div>,
    cell: ({ row }) => (
      <FlagCell
        cargoUnitID={row.original.cargoUnitID}
        initialFlag={Boolean(row.original.flag)}
      />
    ),
  },
  ]
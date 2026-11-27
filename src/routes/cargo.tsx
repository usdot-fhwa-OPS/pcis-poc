import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { CargoHolds, CargoStatus } from "../components/cargo/cargo-availability"
import { DataTable } from "../components/cargo/cargo-table"
import { listCargoUnits } from "../components/cargo/cargo-units-client"
import { columns } from "../components/cargo/columns"

export const Route = createFileRoute("/cargo")({
  component: Cargo,
})

export interface UpcomingCargo {
  vesselID: string
  cargoUnitID: string
  origin: string
  bcoName: string
  bcoEmail: string
  transopName: string
  transopEmail: string
  containerStatus?: CargoStatus | null
  holds?: CargoHolds | null
  flag?: boolean | null
}

export default function Cargo() {
  const [data, setData] = useState<UpcomingCargo[]>([])

  const fetchContainers = async () => {
    const cargo = await listCargoUnits()
    setData(cargo)
  }

  useEffect(() => {
    fetchContainers()
  }, [])

  function updateCargo(cargoUnitID: string, newName: string, newEmail: string) {
    setData((prev) =>
      prev.map((cargo) =>
        cargo.cargoUnitID === cargoUnitID
          ? { ...cargo, operator: newName, operator_email: newEmail }
          : cargo
      )
    )
  }

  function updateCargoStatus(cargoUnitID: string, newStatus: CargoStatus) {
    setData((prev) =>
      prev.map((cargo) =>
        cargo.cargoUnitID === cargoUnitID
          ? { ...cargo, containerStatus: newStatus }
          : cargo
      )
    )
  }

  return (
    <div className="w-full px-6 py-6 md:px-10 md:py-8">
      <h1 className="mb-2 text-2xl leading-none font-semibold text-gray-900">
        Upcoming Cargo
      </h1>
      <p className="mb-4 text-sm text-gray-700">
        Real-time status and readiness for this terminal.
      </p>
      <DataTable
        columns={columns}
        data={data}
        enableRowSelection={false}
        meta={{ updateCargo, updateCargoStatus }}
      />
    </div>
  )
}
import { createFileRoute } from '@tanstack/react-router'
import { columns } from "../components/cargo/columns"
import { DataTable } from "../components/cargo/cargo-table"
import { useEffect, useState } from "react"

//Three Imports needed for Amplify Data Queries and CRUD methods
import { listCargoUnits } from '../components/cargo/cargo-units-client';
import { isCargoSelectable } from "../components/cargo/cargo-availability"

//const client = generateClient<Schema>();


export const Route = createFileRoute('/cargo')({
  component: Cargo,
})

//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able
export type CargoStatus = "On-Ship" | "Discharged" | "Released"

export interface UpcomingCargo {
  vesselID: string
  cargoUnitID: string
  origin: string
  bcoName: string
  bcoEmail: string
  transopName: string
  transopEmail: string
  containerStatus: CargoStatus | string
  holds?: (string | null)[] | string | null
  flag?: boolean | null
}

export default function Cargo() {
  //Will hold the data after the query call, according to the Cargo Type declared above.
  const [data, setData] = useState<UpcomingCargo[]>([])

  //Fetch the data from the database
  const fetchContainers = async () => {
    //Query the data from the database with selection set and auth mode (always apiKey)
     const cargo  =  await listCargoUnits();
    
    setData(cargo);
  }

  //Fetch the data on the first render
  useEffect(() => {
    fetchContainers();
  }, [])

  // The function that updates a row’s operator name/email.
  function updateCargo(cargoUnitID: string, newName: string, newEmail: string) { 
    setData((prev) =>
      prev.map((cargo) =>
        cargo.cargoUnitID === cargoUnitID 
          ? { ...cargo, operator: newName, operator_email: newEmail }
          : cargo
      )
    )
  }

  // Track selected ready-for-pickup rows for reservation requests
  const [selectedCargo, setSelectedCargo] = useState<UpcomingCargo[]>([])

  function updateCargoStatus(cargoUnitID: string, newStatus: string) {
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
      <h1 className="mb-2 text-2xl leading-none font-semibold text-gray-900">Upcoming Cargo</h1>
      <p className="mb-4 text-sm text-gray-700">Real-time status and readiness for this terminal.</p>
      {selectedCargo.length > 0 && (
        <p className="mb-3 text-sm font-medium text-emerald-700">
        {selectedCargo.length} ready unit{selectedCargo.length === 1 ? "" : "s"} selected for pickup
        </p>
      )}
      <DataTable
        columns={columns}
        data={data}
        // Pass the function in as meta so columns can call it
        enableRowSelection={(row) => isCargoSelectable(row.original)}
        onSelectedRowsChange={setSelectedCargo}
        meta={{ updateCargo, updateCargoStatus }}
      />
    </div>
  )
}
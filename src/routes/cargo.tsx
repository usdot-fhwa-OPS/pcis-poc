import { createFileRoute } from '@tanstack/react-router'
import { columns } from "../components/cargo/columns"
import { DataTable } from "../components/cargo/cargo-table"
import { useEffect, useState } from "react"

//Three Imports needed for Amplify Data Queries and CRUD methods
import { SelectionSet } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { listCargoUnits } from '../components/cargo/cargo-units-client';

//const client = generateClient<Schema>();


export const Route = createFileRoute('/cargo')({
  component: Cargo,
})

//Define the selection of data that will be used for the table
const selectionSet = ['vesselID', 'cargoUnitID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail', 'containerStatus', 'flag'] as const; 

//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able
export type UpcomingCargo = SelectionSet<Schema['Container']['type'], typeof selectionSet>

export default function Cargo() {
  //Will hold the data after the query call, according to the Cargo Type declared above.
  const [data, setData] = useState<UpcomingCargo[]>([])

  //Fetch the data from the database
  const fetchContainers = async () => {
    //Query the data from the database with selection set and auth mode (always apiKey)
     const cargo  =  await listCargoUnits();
    // await client.models.Container.list({
    //   selectionSet,
    //   authMode: 'apiKey'
    // });
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-center">Upcoming Cargo</h1>
      <div className="container mx-auto p-10">
        <DataTable
          columns={columns}
          data={data}
          // Pass the function in as meta so columns can call it
          meta={{ updateCargo }}
        />
      </div>
    </div>
  )
}
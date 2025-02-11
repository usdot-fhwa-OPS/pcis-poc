import { createFileRoute } from '@tanstack/react-router'
import { columns } from "../components/cargo/columns"
import { DataTable } from "../components/cargo/cargo-table"
import { useEffect, useState } from "react"

//Imports for Amplify Data 
import { SelectionSet, generateClient } from 'aws-amplify/data';
import { type Schema } from '../../amplify/data/resource';
const client = generateClient<Schema>();

export const Route = createFileRoute('/cargo')({
  component: Cargo,
})

//Define the selection of data that will be used for the table
const selectionSet = ['vesselID', 'containerID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail', 'assignmentStatus', 'flag'] as const;

//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able
export type UpcomingCargo = SelectionSet<Schema['Container']['type'], typeof selectionSet>

export default function Cargo() {
  //Will hold the data after the query call, according to the Cargo Type declared above.
  const [data, setData] = useState<UpcomingCargo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchContainers = async () => {
    const { data: cargo } = await client.models.Container.list({
      selectionSet,
    });
    setData(cargo);
    console.log(data);
  }

  useEffect(() => {
    async function fetchData() {
      await fetchContainers();
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-center">Upcoming Cargo</h1>
      <div>
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  )
}




// async function getData(): Promise<Cargo[]> {
//   // Replace with API Calls
//   return [
//     {
//       vesselID: 456,
//       containerID: "HM-7829",
//       origin: "Boston",
//       bco: "John Doe",
//       bco_email: "johndoe@leidos.com",
//       operator: "Person1",
//       operator_email: "person1@shipping.com",
//       status: "On Ship",
//       flag : false,
//       //contact: "" // Can be removed once contact button is moved to proper place
//     },
//     {
//       vesselID: 1236,
//       containerID: "US-198",
//       origin: "Shanghai",
//       bco: "Bob Smith",
//       bco_email: "bobsmith@transport.com",
//       operator: "Bob Smith",
//       operator_email: "bobsmith@transport.com",
//       status: "On Dock",
//       flag : false,
//       //contact : ""
//     },
//     {
//       vesselID: 88,
//       containerID: "123456",
//       origin: "Los Angeles",
//       bco: "John Doe",
//       bco_email: "johndoe@leidos.com",
//       operator: "John Doe",
//       operator_email: "johndoe@leidos.com",
//       status: "On Dock",
//       flag : false,
//       //contact: ""
//     },
//     {
//       vesselID: 1,
//       containerID: "GM-267",
//       origin: "Amsterdam",
//       bco: "Peter Parker",
//       bco_email: "peterparker@leidos.com",
//       operator: "Allison Smith",
//       operator_email: "allisonsmith@leidos.com",
//       status: "On Ship",
//       flag : false,
//       //contact: ""
//     },
//     {
//       vesselID: 346,
//       containerID: "HM-11",
//       origin: "Houston",
//       bco: "Jane Doe", 
//       bco_email: "janedoe@leidos.com",
//       operator: "Jane Doe",
//       operator_email: "janedoe@leidos.com",
//       status: "On Ship",
//       flag : false,
//       //contact: ""
//     },

//   ]
// }
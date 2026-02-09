import { createFileRoute } from "@tanstack/react-router"
import { columns } from "../components/terminal-capacity/columns"
import { DataTable } from "../components/terminal-capacity/terminal-capacity-table"
import { useEffect, useState } from "react"

//Three Imports needed for Amplify Data Queries and CRUD methods
import { TerminalCapacityDomian } from '../components/terminal-capacity/terminal-capacity-domain';
import { terminalCapacityList } from "../components/terminal-capacity/terminal-capacity-client";

//const client = generateClient<Schema>();


export const Route = createFileRoute('/terminal-capacity')({
  component: TerminalCapacityComponent,
})

//Define the selection of data that will be used for the table
//const selectionSet = ['vesselID', 'capacityId', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail', 'containerStatus', 'flag'] as const; 

//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able
//export type TerminalCapacity = SelectionSet<Schema['Container']['type'], typeof selectionSet>


export default function TerminalCapacityComponent() {
  //Will hold the data after the query call, according to the TerminalCapacity Type declared above.
  //const [data, setData] = useState<TerminalCapacityDomian[]>([])
  const [data, setData] = useState<TerminalCapacityDomian[]>([])

  

  //Fetch the data from the database
  const fetchTerminalCapacityList = async () => {
    //Query the data from the database with selection set and auth mode (always apiKey)
    // const { data: terminalCapacity } = await client.models.Container.list({
      
    //   authMode: 'apiKey'
    // });
    //setData(terminalCapacity);
    //setData(terminalCapacityList);
    
    setData(await terminalCapacityList());
  }

  //Fetch the data on the first render
  useEffect(() => {
    fetchTerminalCapacityList();
  }, [])

  // The function that updates a row’s operator name/email.
  // function updateTerminalCapacity(terminalCapacityUnitID: string, newName: string, newEmail: string) { 
  //   // setData((prev) =>
  //   //   prev.map((terminalCapacity) =>
  //   //     terminalCapacity.capacityId === capacityId 
  //   //       ? { ...terminalCapacity, operator: newName, operator_email: newEmail }
  //   //       : terminalCapacity
  //   //   )
  //   // )
  // }

  return (
    <div>
      <h1 className="text-2xl font-bold text-center">Terminal Capacity List</h1>
      <div className="container mx-auto p-10">
        <DataTable
          columns={columns}
          data={data}
          // Pass the function in as meta so columns can call it
          //meta={{ updateTerminalCapacity }}
        />
      </div>
    </div>
  )
}
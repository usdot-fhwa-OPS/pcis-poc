import { createFileRoute } from "@tanstack/react-router"
import { columns } from "../components/terminal-capacity/columns"
import { DataTable } from "../components/terminal-capacity/terminal-capacity-table"
import { useEffect, useState } from "react"

import { TerminalCapacityDomian } from '../components/terminal-capacity/terminal-capacity-domain';
import { terminalCapacityList } from "../components/terminal-capacity/terminal-capacity-client";
import { AddTerminalCapacity } from "../components/terminal-capacity/add-terminal-capacity";



export const Route = createFileRoute('/capacity')({
  component: TerminalCapacityComponent,
})


export default function TerminalCapacityComponent() {
  const [data, setData] = useState<TerminalCapacityDomian[]>([])

  

  //Fetch the data from the database
  const fetchTerminalCapacityList = async () => {
    
    setData(await terminalCapacityList());
  }

  //Fetch the data on the first render
  useEffect(() => {
    fetchTerminalCapacityList();
  }, [])


  return (
    <div>
      <h1 className="text-2xl font-bold text-center">Terminal Capacity List</h1>
      <div className="container mx-auto p-10">
        <div className="parent-container">
          <AddTerminalCapacity></AddTerminalCapacity>
        </div>
        <DataTable
          columns={columns}
          data={data}
        />
      </div>
    </div>
  )
}
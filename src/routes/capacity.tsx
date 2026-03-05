import { createFileRoute } from "@tanstack/react-router"
import { columns } from "../components/terminal-capacity/columns"
import { DataTable } from "../components/terminal-capacity/terminal-capacity-table"
import { useEffect, useState } from "react"

import { TerminalCapacityDomain } from '../components/terminal-capacity/terminal-capacity-domain';
import { terminalCapacityList } from "../components/terminal-capacity/terminal-capacity-client";
import { AddTerminalCapacity } from "../components/terminal-capacity/add-terminal-capacity";
import { UpdateTerminalCapacityButton } from "../components/terminal-capacity/update-terminal-capacity-button";

import { useAppDispatch } from '../hooks'
import { populate } from "../components/terminal-capacity/terminal-capacity-state";



export const Route = createFileRoute('/capacity')({
  component: TerminalCapacityComponent,
})


export default function TerminalCapacityComponent() {
  const [data, setData] = useState<TerminalCapacityDomain[]>([])
  const [loading, setLoading] = useState(true)
  
  const dispatch = useAppDispatch()
 


  //Fetch the data from the database
  const fetchTerminalCapacityList = async () => {
    
    setData(await terminalCapacityList());
     setLoading(false);

      dispatch(populate(await terminalCapacityList()));

  }

  //Fetch the data on the first render
  useEffect(() => {
    fetchTerminalCapacityList();
      

  }, [])

if (loading) {
    return <div>Loading...</div>
  }
 return (

   <div className="p-2">
      <h1 className="text-2xl font-bold text-center">Terminal Capacity</h1>
       <p className="text-left">Maximum Terminal Capacity: 5 Reservations per day&nbsp;&nbsp;
        <UpdateTerminalCapacityButton limit={5}/>      
       </p>
      <div className="container mx-auto p-10">
        <div className="parent-container">
          <AddTerminalCapacity fetchTerminalCapacityList={fetchTerminalCapacityList}></AddTerminalCapacity>
        </div>
              <DataTable
                columns={columns}
                data={data}
                meta={{fetchTerminalCapacityList}}
              />
            </div>
    </div>    
    
  )

}

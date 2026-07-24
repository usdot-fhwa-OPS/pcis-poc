import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { terminalCapacityList } from "../components/terminal-capacity/terminal-capacity-client";
import { AddTerminalCapacity } from "../components/terminal-capacity/add-terminal-capacity";
import { UpdateTerminalCapacityButton } from "../components/terminal-capacity/update-terminal-capacity-button";

import { useAppDispatch, useAppSelector } from '../hooks'
import { getTerminalCapacityList, populate } from "../components/terminal-capacity/terminal-capacity-state";
import { TerminalCapacityTable } from "../components/terminal_capacity_table/terminal-capacity-table";

export const Route = createFileRoute('/capacity')({
  component: TerminalCapacityComponent,
})

export default function TerminalCapacityComponent() {
 
  const data = useAppSelector(getTerminalCapacityList)
  const maxTerminalCapacity = data.filter((item)=>(item.capacityType==='MAXIMUM'))
  const [loading, setLoading] = useState(true)
  
  const dispatch = useAppDispatch()
 
  //Fetch the data from the database
  const fetchTerminalCapacityList = async () => {
  
      dispatch(populate(await terminalCapacityList()));
      setLoading(false);
  }

  //Fetch the data on the first render
  useEffect(() => {
    fetchTerminalCapacityList();
      

  }, [])

  if (loading) {
    return <div>Loading...</div>
  }
 return (
   <div className="w-full px-6 py-6 md:px-10 md:py-8">
      <h1 className="mb-6 text-2xl leading-none font-semibold text-gray-900">Capacity Planning</h1>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-700">
          Maximum Terminal Capacity:&nbsp;
          <span className="font-semibold">{maxTerminalCapacity[0].capacity} Reservations per day</span>
          &nbsp;&nbsp;
          <UpdateTerminalCapacityButton maxTerminalCapacity={maxTerminalCapacity[0]}/>
        </p>
        <AddTerminalCapacity/>
      </div>
      <TerminalCapacityTable data={data.filter((item)=>(item.capacityType==='TEMPORARY'))}/>
    </div>
  )

}
